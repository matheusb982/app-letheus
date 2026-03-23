"use server";

import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { Period, type IPeriod } from "@/lib/db/models/period";
import { Goal, type IGoal } from "@/lib/db/models/goal";
import { Purchase } from "@/lib/db/models/purchase";
import { Revenue } from "@/lib/db/models/revenue";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

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
    const p = await Period.findOne({ month: m, year: y }).lean<IPeriod>();
    if (p) previousPeriods.push(p);
  }

  // Get current goals
  const currentGoals = await Goal.find({ period_id: user.period_id }).lean<IGoal[]>();
  if (currentGoals.length === 0) {
    return { suggestions: [], total_revenue: 0, total_current_goals: 0, total_suggested: 0 };
  }

  // Get spending for each previous period by subcategory
  const previousPeriodIds = previousPeriods.map((p) => p._id);
  const allPurchases = await Purchase.find({
    period_id: { $in: previousPeriodIds },
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
  const revenues = await Revenue.find({ period_id: user.period_id }).lean();
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

  const prompt = `Você é um consultor financeiro pessoal. Analise as metas de despesas do usuário e sugira valores otimizados.

Receita mensal atual: R$ ${totalRevenue.toFixed(2)}
Período atual: ${currentPeriod.month}/${currentPeriod.year}

Metas atuais e histórico de gastos dos últimos 3 meses:
${JSON.stringify(goalsInfo, null, 2)}

Para cada meta, sugira um valor otimizado considerando:
1. Se o gasto médio está muito abaixo da meta, considere reduzir a meta (mas com margem de segurança de ~15-20%)
2. Se o gasto médio está acima da meta, considere aumentar a meta para ser realista OU manter se o objetivo é reduzir gastos
3. Se a tendência é de alta, considere uma meta levemente maior
4. Se a tendência é de baixa, considere reduzir a meta
5. Considere que o total das metas não deve ultrapassar 80% da receita mensal
6. Se a meta já está boa (gasto próximo da meta ±10%), mantenha o valor atual

Responda APENAS com JSON no formato:
[
  {"subcategory": "nome", "suggested_value": 123.45, "reason": "Breve justificativa em português"}
]`;

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      providerOptions: {
        google: { thinkingConfig: { thinkingBudget: 1024 } },
      },
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

    return {
      suggestions,
      total_revenue: totalRevenue,
      total_current_goals: currentGoals.reduce((s, g) => s + g.value, 0),
      total_suggested: suggestions.reduce((s, g) => s + g.suggested_value, 0),
    };
  } catch {
    return buildFallbackSuggestions(currentGoals, spendingData, totalRevenue);
  }
}

function buildFallbackSuggestions(
  goals: IGoal[],
  spending: SpendingBySubcategory[],
  totalRevenue: number
): GoalSuggestionsResult {
  const suggestions: GoalSuggestion[] = goals.map((goal) => {
    const sp = spending.find((s) => s.subcategory_id === goal.subcategory_id?.toString());
    const avg = sp?.avg ?? 0;
    const suggested = avg > 0 ? Math.round(avg * 1.15 * 100) / 100 : goal.value;
    return {
      subcategory_name: goal.subcategory_name ?? "",
      subcategory_id: goal.subcategory_id?.toString() ?? "",
      goal_id: goal._id.toString(),
      current_value: goal.value,
      suggested_value: suggested,
      avg_3m: avg,
      trend: sp?.trend ?? "stable",
      reason: avg > 0 ? "Baseado na média + 15% margem" : "Sem histórico",
    };
  });

  return {
    suggestions,
    total_revenue: totalRevenue,
    total_current_goals: goals.reduce((s, g) => s + g.value, 0),
    total_suggested: suggestions.reduce((s, g) => s + g.suggested_value, 0),
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
