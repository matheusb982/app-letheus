/**
 * Shared chat service — used by both web chat and WhatsApp.
 * Extracted from /api/chat/route.ts to avoid duplication.
 */

import { generateTextWithFallback } from "@/lib/services/ai-provider";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Purchase, type IPurchase } from "@/lib/db/models/purchase";
import { Revenue, type IRevenue } from "@/lib/db/models/revenue";
import { Goal, type IGoal } from "@/lib/db/models/goal";
import { Patrimony, type IPatrimony } from "@/lib/db/models/patrimony";
import { CachedResponse, type ICachedResponse } from "@/lib/db/models/cached-response";
import { Period, type IPeriod } from "@/lib/db/models/period";
import { ChatMessage } from "@/lib/db/models/chat-message";
import { ChatSession } from "@/lib/db/models/chat-session";
import { MONTH_NAMES } from "@/lib/utils/months";
import { createHash } from "crypto";
import mongoose from "mongoose";

/**
 * Build financial context string for AI prompts.
 */
export function buildFinancialContext(
  purchases: IPurchase[],
  revenues: IRevenue[],
  goals: IGoal[],
  patrimonies: IPatrimony[],
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

  // Goals comparison
  const totalGoal = goals.reduce((sum, g) => sum + g.value, 0);
  const goalLines = goals
    .map((g) => {
      const spent = bySubcat.get(g.subcategory_name ?? "") ?? 0;
      const diff = g.value - spent;
      const status = diff >= 0 ? "dentro da meta" : "estourou";
      return `  - ${g.subcategory_name}: Meta R$ ${g.value.toFixed(2)} | Gasto R$ ${spent.toFixed(2)} | ${status} (${diff >= 0 ? "sobra" : "excesso"} R$ ${Math.abs(diff).toFixed(2)})`;
    })
    .join("\n");

  // Patrimonies
  const totalPatrimony = patrimonies.reduce((sum, p) => sum + p.value, 0);
  const patrimonyLines = patrimonies
    .map((p) => `  - ${p.subcategory_name}: R$ ${p.value.toFixed(2)}`)
    .join("\n");

  return `PERIODO: ${period?.name ?? "?"} ${period?.year ?? ""}
RECEITAS (Total: R$ ${totalRevenue.toFixed(2)}):
${revenueLines || "  Nenhuma receita"}

DESPESAS (Total: R$ ${totalPurchase.toFixed(2)} | ${debitCount} debito, ${creditCount} credito):
Por subcategoria:
${subcatLines || "  Nenhuma despesa"}

Top 5 maiores despesas:
${top5 || "  Nenhuma"}

METAS DO MES (Total: R$ ${totalGoal.toFixed(2)}):
${goalLines || "  Nenhuma meta definida"}

PATRIMONIO (Total: R$ ${totalPatrimony.toFixed(2)}):
${patrimonyLines || "  Nenhum patrimonio registrado"}

SALDO: R$ ${balance.toFixed(2)}`;
}

/**
 * Resolve which period to use based on user message (detects month names).
 */
export async function resolvePeriodFromMessage(
  userMessage: string,
  defaultPeriodId: mongoose.Types.ObjectId | undefined,
  familyId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId | undefined> {
  const monthMatch = userMessage.toLowerCase().match(
    /\b(janeiro|fevereiro|marco|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/
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
        family_id: familyId,
      });
      if (foundPeriod) return foundPeriod._id;
    }
  }

  return defaultPeriodId;
}

/**
 * Load financial data for a period/family.
 */
export async function loadFinancialData(
  periodId: mongoose.Types.ObjectId | undefined,
  familyId: mongoose.Types.ObjectId
) {
  const [purchases, revenues, goals, patrimonies, currentPeriod] = await Promise.all([
    Purchase.find({ period_id: periodId, family_id: familyId }).lean<IPurchase[]>(),
    Revenue.find({ period_id: periodId, family_id: familyId }).lean<IRevenue[]>(),
    Goal.find({ period_id: periodId, family_id: familyId }).lean<IGoal[]>(),
    Patrimony.find({ period_id: periodId, family_id: familyId }).lean<IPatrimony[]>(),
    Period.findById(periodId).lean<IPeriod>(),
  ]);

  return { purchases, revenues, goals, patrimonies, currentPeriod };
}

/**
 * Generate a non-streaming chat response (used by WhatsApp).
 * Returns the response text directly.
 */
export async function generateChatResponse(
  userId: string,
  familyId: mongoose.Types.ObjectId,
  userMessage: string
): Promise<string> {
  await connectDB();

  const user = await User.findById(userId);
  const periodId = await resolvePeriodFromMessage(userMessage, user?.period_id, familyId);

  // Check cache
  const questionHash = createHash("sha256")
    .update(`${userMessage.toLowerCase().trim()}-${new Date().toISOString().split("T")[0]}`)
    .digest("hex");

  const cached = await CachedResponse.findOne<ICachedResponse>({
    user_id: userId,
    family_id: familyId,
    question_hash: questionHash,
    expires_at: { $gt: new Date() },
  });

  if (cached) return cached.answer;

  // Load financial data
  const { purchases, revenues, goals, patrimonies, currentPeriod } =
    await loadFinancialData(periodId, familyId);

  const financialContext = buildFinancialContext(purchases, revenues, goals, patrimonies, currentPeriod);

  const systemPrompt = `Voce e um assistente financeiro pessoal inteligente e amigavel.
Responda sempre em portugues brasileiro.
Base suas respostas nos dados financeiros fornecidos.
Calcule saldos, percentuais e comparacoes quando relevante.
Sugira insights e dicas de economia quando apropriado.
Seja conciso mas completo.
Voce esta respondendo via WhatsApp, entao mantenha as respostas curtas e diretas.

DADOS FINANCEIROS DO USUARIO:
${financialContext}`;

  const { text } = await generateTextWithFallback("openai", {
    system: systemPrompt,
    prompt: userMessage,
    maxOutputTokens: 2048,
  });

  // Cache the response
  await CachedResponse.create({
    user_id: userId,
    family_id: familyId,
    question_hash: questionHash,
    question: userMessage,
    answer: text,
    expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000),
  });

  return text;
}

/**
 * Save conversation to chat history.
 */
export async function saveConversation(
  userId: string,
  familyId: unknown,
  chatSessionId: string,
  question: string,
  answer: string
) {
  if (!chatSessionId) return;
  const now = new Date();
  await ChatMessage.create([
    { content: question, role: "user", chat_session_id: chatSessionId, user_id: userId, family_id: familyId, created_at: now, updated_at: now },
    { content: answer, role: "assistant", chat_session_id: chatSessionId, user_id: userId, family_id: familyId, created_at: new Date(now.getTime() + 1), updated_at: new Date(now.getTime() + 1) },
  ]);
  await ChatSession.findByIdAndUpdate(chatSessionId, { updated_at: new Date() });
}
