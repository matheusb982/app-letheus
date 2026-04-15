import { streamTextWithFallback } from "@/lib/services/ai-provider";
import {
  buildFinancialContext,
  loadFinancialData,
  resolvePeriodFromMessage,
  saveConversation,
} from "@/lib/services/chat-service";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { ChatMessage } from "@/lib/db/models/chat-message";
import { CachedResponse, type ICachedResponse } from "@/lib/db/models/cached-response";
import { ADMIN_EMAIL } from "@/lib/utils/constants";
import { createHash } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Não autorizado", { status: 401 });
  }

  await connectDB();

  // Check subscription (skip for admin)
  const chatUser = await User.findById(session.user.id);
  if (chatUser?.family_id && session.user.email !== ADMIN_EMAIL) {
    const { Family } = await import("@/lib/db/models/family");
    const family = await Family.findById(chatUser.family_id);
    if (family) {
      const status = family.subscription_status ?? "trialing";
      const trialEndsAt = family.trial_ends_at;
      const isExpired = status === "expired" || status === "canceled" ||
        (status === "trialing" && trialEndsAt && new Date() > trialEndsAt);
      if (isExpired) {
        return new Response("Seu período de teste expirou. Assine para continuar usando o chat.", { status: 403 });
      }
    }
  }
  const body = await req.json();
  const { messages, chatSessionId } = body;
  // AI SDK v6: content may be in parts, not content field
  const lastMsg = messages[messages.length - 1];
  const userMessage = lastMsg?.content ?? lastMsg?.parts?.find((p: {type: string; text?: string}) => p.type === "text")?.text ?? "";


  // Get user and family context
  const user = await User.findById(session.user.id);
  const familyId = user?.family_id;

  // Check cache
  const questionHash = createHash("sha256")
    .update(`${userMessage.toLowerCase().trim()}-${new Date().toISOString().split("T")[0]}`)
    .digest("hex");

  const cached = await CachedResponse.findOne<ICachedResponse>({
    user_id: session.user.id,
    family_id: familyId,
    question_hash: questionHash,
    expires_at: { $gt: new Date() },
  });

  if (cached) {
    // Save to chat history
    await saveConversation(session.user.id, familyId, chatSessionId, userMessage, cached.answer);
    // Return as text stream so useChat can process it
    return new Response(cached.answer, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Find period (check if user mentions a specific month)
  const periodId = await resolvePeriodFromMessage(userMessage, user?.period_id, familyId);

  // Get financial data
  const { purchases, revenues, goals, patrimonies, currentPeriod } =
    await loadFinancialData(periodId, familyId);

  const financialContext = buildFinancialContext(purchases, revenues, goals, patrimonies, currentPeriod);

  // Get conversation history (validate session belongs to this family)
  const recentMessages = await ChatMessage.find({ chat_session_id: chatSessionId, family_id: familyId })
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
    const result = await streamTextWithFallback("openai", {
      system: systemPrompt,
      messages,
      maxOutputTokens: 4096,
      async onFinish({ text }: { text: string }) {
        // Save conversation and cache
        await saveConversation(session!.user.id, familyId, chatSessionId, userMessage, text);
        await CachedResponse.create({
          user_id: session!.user.id,
          family_id: familyId,
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
