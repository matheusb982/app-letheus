"use server";

import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { Period, type IPeriod } from "@/lib/db/models/period";
import { Goal, type IGoal } from "@/lib/db/models/goal";
import { Purchase } from "@/lib/db/models/purchase";
import { Revenue } from "@/lib/db/models/revenue";
import { generateTextWithFallback } from "@/lib/services/ai-provider";

export interface GoalSuggestion {
  subcategory_name: string;
  subcategory_id: string;
  goal_id: string;
  current_value: number;
  suggested_value: number;
  avg_3m: number;
  trend: "up" | "down" | "stable";
  reason: string;
}

export interface GoalSuggestionsResult {
  suggestions: GoalSuggestion[];
  total_revenue: number;
  total_current_goals: number;
  total_suggested: number;
}

interface SpendingBySubcategory {
  subcategory_id: string;
  subcategory_name: string;
  months: { period: string; spent: number }[];
  avg: number;
  trend: "up" | "down" | "stable";
}

export async function getGoalSuggestions(): Promise<GoalSuggestionsResult> {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");
  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user?.period_id) throw new Error("Nenhum período selecionado");
  const familyId = user.family_id;

  // Get current period
  const currentPeriod = await Period.findById(user.period_id).lean<IPeriod>();
  if (!currentPeriod) throw new Error("Período não encontrado");

  // Find previous 3 periods
  const previousPeriods: IPeriod[] = [];
  let m = currentPeriod.month;
  let y = currentPeriod.year;
  for (let i = 0; i < 3; i++) {
    m--;
    if (m < 1) { m = 12; y--; }
    const p = await Period.findOne({ month: m, year: y, family_id: familyId }).lean<IPeriod>();
    if (p) previousPeriods.push(p);
  }

  // Get current goals
  const currentGoals = await Goal.find({ period_id: user.period_id, family_id: familyId }).lean<IGoal[]>();
  if (currentGoals.length === 0) {
    return { suggestions: [], total_revenue: 0, total_current_goals: 0, total_suggested: 0 };
  }

  // Get spending for each previous period by subcategory
  const previousPeriodIds = previousPeriods.map((p) => p._id);
  const allPurchases = await Purchase.find({
    period_id: { $in: previousPeriodIds },
    family_id: familyId,
  }).lean();

  // Build spending map: subcategory_id -> { periodId -> total }
  const spendingMap = new Map<string, Map<string, number>>();
  for (const p of allPurchases) {
    const subId = p.subcategory_id?.toString() ?? "";
    if (!subId) continue;
    if (!spendingMap.has(subId)) spendingMap.set(subId, new Map());
    const periodMap = spendingMap.get(subId)!;
    const pid = p.period_id?.toString() ?? "";
    periodMap.set(pid, (periodMap.get(pid) ?? 0) + (p.value ?? 0));
  }

  // Build spending by subcategory with trend
  const spendingData: SpendingBySubcategory[] = [];
  for (const goal of currentGoals) {
    const subId = goal.subcategory_id?.toString() ?? "";
    const periodSpending = spendingMap.get(subId) ?? new Map();

    const months = previousPeriods.map((p) => ({
      period: `${p.month}/${p.year}`,
      spent: periodSpending.get(p._id.toString()) ?? 0,
    }));

    const nonZeroMonths = months.filter((m) => m.spent > 0);
    const avg = nonZeroMonths.length > 0
      ? nonZeroMonths.reduce((s, m) => s + m.spent, 0) / nonZeroMonths.length
      : 0;

    // Trend: compare most recent vs oldest
    let trend: "up" | "down" | "stable" = "stable";
    if (months.length >= 2) {
      const recent = months[0].spent;
      const older = months[months.length - 1].spent;
      if (older > 0) {
        const change = (recent - older) / older;
        if (change > 0.15) trend = "up";
        else if (change < -0.15) trend = "down";
      }
    }

    spendingData.push({
      subcategory_id: subId,
      subcategory_name: goal.subcategory_name ?? "",
      months,
      avg,
      trend,
    });
  }

  // Get current revenue
  const revenues = await Revenue.find({ period_id: user.period_id, family_id: familyId }).lean();
  const totalRevenue = revenues.reduce((s, r) => s + ((r as Record<string, unknown>).value as number ?? 0), 0);

  // Build prompt for AI
  const goalsInfo = currentGoals.map((g) => {
    const spending = spendingData.find((s) => s.subcategory_id === g.subcategory_id?.toString());
    return {
      subcategory: g.subcategory_name,
      current_goal: g.value,
      avg_3m: spending?.avg ?? 0,
      trend: spending?.trend ?? "stable",
      months: spending?.months ?? [],
    };
  });

  const totalCurrentGoals = currentGoals.reduce((s, g) => s + g.value, 0);
  const maxBudget = totalRevenue * 0.8;

  const prompt = `Você é um consultor financeiro pessoal brasileiro. Seu objetivo é ajudar o usuário a ECONOMIZAR, nunca a gastar mais.

CONTEXTO:
- Receita mensal: R$ ${totalRevenue.toFixed(2)}
- Teto máximo para soma de todas as metas: R$ ${maxBudget.toFixed(2)} (80% da receita)
- Total das metas atuais: R$ ${totalCurrentGoals.toFixed(2)}
- Período: ${currentPeriod.month}/${currentPeriod.year}

DADOS (meta atual, média dos últimos 3 meses, tendência):
${JSON.stringify(goalsInfo, null, 2)}

REGRAS INVIOLÁVEIS:
1. A SOMA de todos os suggested_value NÃO PODE ultrapassar R$ ${maxBudget.toFixed(2)}
2. NUNCA sugira um valor MAIOR que a meta atual — o objetivo é economizar, não gastar mais
3. GASTOS FIXOS (mensalidades, contas, aluguel, condomínio, internet, plano de saúde, DAS, INSS, impostos fixos): NUNCA reduza abaixo da média. São contas que o usuário NÃO TEM COMO diminuir. Sugira exatamente a média arredondada pra cima ou mantenha a meta atual.
4. GASTOS VARIÁVEIS (restaurante, mercado, lazer, roupas, combustível): estes SIM podem ser reduzidos. Se a média está abaixo da meta, reduza.
5. Se a média está PRÓXIMA da meta (±10%) → MANTENHA o valor atual
6. Se a média está ACIMA da meta → MANTENHA a meta (incentivar o usuário a reduzir)
7. Se a tendência é de QUEDA em gastos variáveis → reduza a meta acompanhando
8. Para respeitar o teto de 80%, reduza APENAS os gastos variáveis, NUNCA os fixos

EXEMPLOS CORRETOS:
- Internet R$ 134/mês (fixo): meta R$ 135 → sugerir R$ 135 (NÃO reduzir, é conta fixa)
- DAS R$ 1181/mês (fixo): meta R$ 1196 → sugerir R$ 1196 (NÃO reduzir, é imposto)
- Aluguel R$ 2000/mês (fixo): meta R$ 2000 → sugerir R$ 2000 (NÃO reduzir)
- Restaurante: meta R$ 800, média R$ 520 → sugerir R$ 570 (variável, pode reduzir)
- Combustível: meta R$ 300, média R$ 350 → sugerir R$ 300 (acima, manter pra reduzir)
- Mercado: meta R$ 1200, média R$ 1180 → sugerir R$ 1200 (próximo, manter)

EXEMPLOS INCORRETOS (NÃO FAÇA ISSO):
- Internet: meta R$ 135, média R$ 134 → sugerir R$ 155 ❌ (aumentou sem motivo)
- DAS: meta R$ 1196, média R$ 1181 → sugerir R$ 1359 ❌ (aumentou 14%, absurdo)

Responda APENAS com JSON válido, sem explicação fora do JSON:
[
  {"subcategory": "nome exato", "suggested_value": 123.45, "reason": "Justificativa curta em português"}
]`;

  try {
    const { text } = await generateTextWithFallback("openai", {
      prompt,
      temperature: 0.3,
      maxOutputTokens: 4096,
    });

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return buildFallbackSuggestions(currentGoals, spendingData, totalRevenue);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      subcategory: string;
      suggested_value: number;
      reason: string;
    }>;

    const suggestions: GoalSuggestion[] = currentGoals.map((goal) => {
      const spending = spendingData.find((s) => s.subcategory_id === goal.subcategory_id?.toString());
      const aiSuggestion = parsed.find(
        (s) => s.subcategory.toLowerCase() === (goal.subcategory_name ?? "").toLowerCase()
      );

      return {
        subcategory_name: goal.subcategory_name ?? "",
        subcategory_id: goal.subcategory_id?.toString() ?? "",
        goal_id: goal._id.toString(),
        current_value: goal.value,
        suggested_value: aiSuggestion
          ? Math.round(aiSuggestion.suggested_value * 100) / 100
          : goal.value,
        avg_3m: spending?.avg ?? 0,
        trend: spending?.trend ?? "stable",
        reason: aiSuggestion?.reason ?? "Sem dados suficientes para sugestão",
      };
    });

    const capped = capSuggestionsToRevenue(suggestions, totalRevenue);

    return {
      suggestions: capped,
      total_revenue: totalRevenue,
      total_current_goals: currentGoals.reduce((s, g) => s + g.value, 0),
      total_suggested: capped.reduce((s, g) => s + g.suggested_value, 0),
    };
  } catch {
    return buildFallbackSuggestions(currentGoals, spendingData, totalRevenue);
  }
}

function suggestValueForGoal(
  currentGoal: number,
  avg: number,
  trend: "up" | "down" | "stable"
): { value: number; reason: string } {
  if (avg === 0) {
    return { value: currentGoal, reason: "Sem histórico de gastos" };
  }

  const ratio = avg / currentGoal;

  // Gasto próximo da meta (±10%) → manter
  if (ratio >= 0.9 && ratio <= 1.1) {
    return { value: currentGoal, reason: "Meta adequada — gasto próximo do limite" };
  }

  // Gasto abaixo da meta (< 90%) → reduzir meta pra média + margem
  if (ratio < 0.9) {
    const margin = trend === "up" ? 0.15 : trend === "down" ? 0.05 : 0.10;
    const suggested = Math.round(avg * (1 + margin) * 100) / 100;
    // Nunca sugerir mais que a meta atual
    const final = Math.min(suggested, currentGoal);
    const reduction = Math.round((1 - final / currentGoal) * 100);
    return {
      value: final,
      reason: reduction > 0
        ? `Gasto médio abaixo da meta — possível redução de ${reduction}%`
        : "Meta adequada",
    };
  }

  // Gasto acima da meta (> 110%) → manter meta (objetivo é reduzir gastos)
  return {
    value: currentGoal,
    reason: "Gasto acima da meta — mantendo limite para incentivar redução",
  };
}

function isFixedExpense(suggestion: GoalSuggestion): boolean {
  // A fixed expense has avg very close to the goal (±10%) — it's a bill, not discretionary
  if (suggestion.avg_3m === 0) return false;
  const ratio = suggestion.avg_3m / suggestion.suggested_value;
  return ratio >= 0.85 && ratio <= 1.15;
}

function capSuggestionsToRevenue(
  suggestions: GoalSuggestion[],
  totalRevenue: number
): GoalSuggestion[] {
  if (totalRevenue <= 0) return suggestions;

  const maxTotal = totalRevenue * 0.8;
  const currentTotal = suggestions.reduce((s, g) => s + g.suggested_value, 0);

  if (currentTotal <= maxTotal) return suggestions;

  // Separate fixed vs variable expenses
  const fixed = suggestions.filter((s) => isFixedExpense(s));
  const variable = suggestions.filter((s) => !isFixedExpense(s));

  const fixedTotal = fixed.reduce((s, g) => s + g.suggested_value, 0);
  const variableTotal = variable.reduce((s, g) => s + g.suggested_value, 0);

  // Budget remaining for variable expenses after fixed
  const variableBudget = maxTotal - fixedTotal;

  // If fixed alone exceeds budget, can't do much — return as is
  if (variableBudget <= 0) return suggestions;

  // Only reduce variable expenses proportionally
  const factor = variableBudget / variableTotal;

  return suggestions.map((s) => {
    if (isFixedExpense(s)) return s; // Preserve fixed expenses
    return {
      ...s,
      suggested_value: Math.round(s.suggested_value * factor * 100) / 100,
      reason: s.reason + (factor < 0.95 ? " (ajustado para caber em 80% da receita)" : ""),
    };
  });
}

function buildFallbackSuggestions(
  goals: IGoal[],
  spending: SpendingBySubcategory[],
  totalRevenue: number
): GoalSuggestionsResult {
  const suggestions: GoalSuggestion[] = goals.map((goal) => {
    const sp = spending.find((s) => s.subcategory_id === goal.subcategory_id?.toString());
    const avg = sp?.avg ?? 0;
    const trend = sp?.trend ?? "stable";
    const { value, reason } = suggestValueForGoal(goal.value, avg, trend);

    return {
      subcategory_name: goal.subcategory_name ?? "",
      subcategory_id: goal.subcategory_id?.toString() ?? "",
      goal_id: goal._id.toString(),
      current_value: goal.value,
      suggested_value: value,
      avg_3m: avg,
      trend,
      reason,
    };
  });

  const capped = capSuggestionsToRevenue(suggestions, totalRevenue);

  return {
    suggestions: capped,
    total_revenue: totalRevenue,
    total_current_goals: goals.reduce((s, g) => s + g.value, 0),
    total_suggested: capped.reduce((s, g) => s + g.suggested_value, 0),
  };
}

export async function applyGoalSuggestions(
  updates: Array<{ goal_id: string; value: number }>
): Promise<{ success: boolean; updated: number }> {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");
  await connectDB();

  let updated = 0;
  for (const { goal_id, value } of updates) {
    await Goal.findByIdAndUpdate(goal_id, { value });
    updated++;
  }

  return { success: true, updated };
}
