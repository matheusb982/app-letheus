import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Purchase, type IPurchase } from "@/lib/db/models/purchase";
import { Revenue, type IRevenue } from "@/lib/db/models/revenue";
import { ChatMessage } from "@/lib/db/models/chat-message";
import { ChatSession } from "@/lib/db/models/chat-session";
import { CachedResponse, type ICachedResponse } from "@/lib/db/models/cached-response";
import { Period, type IPeriod } from "@/lib/db/models/period";
import { DAILY_CHAT_LIMIT } from "@/lib/utils/constants";
import { MONTH_NAMES } from "@/lib/utils/months";
import { createHash } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Não autorizado", { status: 401 });
  }

  await connectDB();
  const { messages, chatSessionId } = await req.json();
  const userMessage = messages[messages.length - 1]?.content ?? "";

  // Rate limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dailyCount = await ChatMessage.countDocuments({
    user_id: session.user.id,
    role: "user",
    created_at: { $gte: todayStart },
  });

  if (dailyCount >= DAILY_CHAT_LIMIT) {
    return new Response(
      JSON.stringify({
        error: "Você atingiu o limite diário de perguntas. Tente novamente amanhã.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check cache
  const questionHash = createHash("sha256")
    .update(`${userMessage.toLowerCase().trim()}-${new Date().toISOString().split("T")[0]}`)
    .digest("hex");

  const cached = await CachedResponse.findOne<ICachedResponse>({
    user_id: session.user.id,
    question_hash: questionHash,
    expires_at: { $gt: new Date() },
  });

  if (cached) {
    // Save to chat history
    await saveConversation(session.user.id, chatSessionId, userMessage, cached.answer);
    // Return as text stream so useChat can process it
    return new Response(cached.answer, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Find period (check if user mentions a specific month)
  const user = await User.findById(session.user.id);
  let periodId = user?.period_id;

  const monthMatch = userMessage.toLowerCase().match(
    /\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/
  );

  if (monthMatch) {
    const monthNum = Object.entries(MONTH_NAMES).find(
      ([, name]) => name.toLowerCase() === monthMatch[1]
    )?.[0];
    if (monthNum) {
      const year = new Date().getFullYear();
      const foundPeriod = await Period.findOne<IPeriod>({
        month: parseInt(monthNum),
        year,
      });
      if (foundPeriod) periodId = foundPeriod._id;
    }
  }

  // Get financial data
  const [purchases, revenues] = await Promise.all([
    Purchase.find({ period_id: periodId }).lean<IPurchase[]>(),
    Revenue.find({ period_id: periodId }).lean<IRevenue[]>(),
  ]);

  const currentPeriod = await Period.findById(periodId).lean<IPeriod>();
  const financialContext = buildFinancialContext(purchases, revenues, currentPeriod);

  // Get conversation history
  const recentMessages = await ChatMessage.find({ chat_session_id: chatSessionId })
    .sort({ created_at: -1 })
    .limit(4)
    .lean();

  const historyText = recentMessages
    .reverse()
    .map((m: Record<string, unknown>) => {
      const content = String(m.content ?? "").slice(0, 100);
      return m.role === "user" ? `Usuário: ${content}` : `Assistente: ${content}`;
    })
    .join("\n");

  const systemPrompt = `Você é um assistente financeiro pessoal inteligente e amigável.
Responda sempre em português brasileiro.
Base suas respostas nos dados financeiros fornecidos.
Calcule saldos, percentuais e comparações quando relevante.
Sugira insights e dicas de economia quando apropriado.
Seja conciso mas completo.

DADOS FINANCEIROS DO USUÁRIO:
${financialContext}

${historyText ? `HISTÓRICO DA CONVERSA:\n${historyText}` : ""}`;

  try {
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages,
      temperature: 0.2,
      maxOutputTokens: 1024,
      async onFinish({ text }) {
        // Save conversation and cache
        await saveConversation(session!.user.id, chatSessionId, userMessage, text);
        await CachedResponse.create({
          user_id: session!.user.id,
          question_hash: questionHash,
          question: userMessage,
          answer: text,
          expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar sua pergunta. Tente novamente." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function buildFinancialContext(
  purchases: IPurchase[],
  revenues: IRevenue[],
  period: IPeriod | null
): string {
  const totalRevenue = revenues.reduce((sum, r) => sum + r.value, 0);
  const totalPurchase = purchases.reduce((sum, p) => sum + p.value, 0);
  const balance = totalRevenue - totalPurchase;

  const debitCount = purchases.filter((p) => p.purchase_type === "debit").length;
  const creditCount = purchases.filter((p) => p.purchase_type === "credit").length;

  // Group by subcategory
  const bySubcat = new Map<string, number>();
  for (const p of purchases) {
    const name = p.subcategory_name ?? "Sem categoria";
    bySubcat.set(name, (bySubcat.get(name) ?? 0) + p.value);
  }

  const subcatLines = [...bySubcat.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => {
      const pct = totalPurchase > 0 ? ((value / totalPurchase) * 100).toFixed(1) : "0";
      return `  - ${name}: R$ ${value.toFixed(2)} (${pct}%)`;
    })
    .join("\n");

  // Top 5 purchases
  const top5 = [...purchases]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((p) => `  - ${p.description ?? "Sem descrição"}: R$ ${p.value.toFixed(2)}`)
    .join("\n");

  const revenueLines = revenues
    .map((r) => `  - ${r.name}: R$ ${r.value.toFixed(2)}`)
    .join("\n");

  return `PERÍODO: ${period?.name ?? "?"} ${period?.year ?? ""}
RECEITAS (Total: R$ ${totalRevenue.toFixed(2)}):
${revenueLines || "  Nenhuma receita"}

DESPESAS (Total: R$ ${totalPurchase.toFixed(2)} | ${debitCount} débito, ${creditCount} crédito):
Por subcategoria:
${subcatLines || "  Nenhuma despesa"}

Top 5 maiores despesas:
${top5 || "  Nenhuma"}

SALDO: R$ ${balance.toFixed(2)}`;
}

async function saveConversation(
  userId: string,
  chatSessionId: string,
  question: string,
  answer: string
) {
  if (!chatSessionId) return;
  await ChatMessage.create([
    { content: question, role: "user", chat_session_id: chatSessionId, user_id: userId },
    { content: answer, role: "assistant", chat_session_id: chatSessionId, user_id: userId },
  ]);
  await ChatSession.findByIdAndUpdate(chatSessionId, { updated_at: new Date() });
}
