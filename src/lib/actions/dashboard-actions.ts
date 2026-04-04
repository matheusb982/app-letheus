"use server";

import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { Purchase, type IPurchase } from "@/lib/db/models/purchase";
import { Revenue, type IRevenue } from "@/lib/db/models/revenue";
import { Goal, type IGoal } from "@/lib/db/models/goal";
import { Patrimony, type IPatrimony } from "@/lib/db/models/patrimony";
import { Period } from "@/lib/db/models/period";
import { APORTE_SUBCATEGORY_IDS, FINANCEIRAS_CATEGORY_NAME } from "@/lib/utils/constants";
import { Category } from "@/lib/db/models/category";
import { getPaymentsPerCategory } from "@/lib/services/payments-per-category";

export interface DashboardKPIs {
  totalRevenue: number;
  totalPurchase: number;
  totalAporte: number;
  totalBalance: number;
  totalGoal: number;
  totalPatrimony: number;
  performanceValue: number;
  hasPerformanceData: boolean;
}

export interface GoalAlert {
  subcategoryName: string;
  goalValue: number;
  spent: number;
  percentage: number;
  diff: number;
  level: "ok" | "warning" | "danger" | "exceeded";
}

function calculateGoalAlerts(
  goals: IGoal[],
  purchases: IPurchase[]
): GoalAlert[] {
  const spentBySubcat = new Map<string, number>();
  for (const p of purchases) {
    const key = p.subcategory_id?.toString();
    if (key) {
      spentBySubcat.set(key, (spentBySubcat.get(key) ?? 0) + p.value);
    }
  }

  return goals
    .map((g) => {
      const subcatId = g.subcategory_id?.toString() ?? "";
      const spent = spentBySubcat.get(subcatId) ?? 0;
      const percentage = g.value > 0 ? (spent / g.value) * 100 : 0;
      const diff = spent - g.value;

      let level: GoalAlert["level"] = "ok";
      if (percentage >= 100) level = "exceeded";
      else if (percentage >= 90) level = "danger";
      else if (percentage >= 70) level = "warning";

      return {
        subcategoryName: g.subcategory_name ?? "",
        goalValue: g.value,
        spent,
        percentage,
        diff,
        level,
      };
    })
    .filter((a) => a.level !== "ok")
    .sort((a, b) => b.percentage - a.percentage);
}

export async function getDashboardData() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) return null;

  const periodId = user.period_id;
  const familyId = user.family_id;

  const [purchases, revenues, goals, patrimonies] = await Promise.all([
    Purchase.find({ period_id: periodId, family_id: familyId }).lean<IPurchase[]>(),
    Revenue.find({ period_id: periodId, family_id: familyId }).lean<IRevenue[]>(),
    Goal.find({ period_id: periodId, family_id: familyId }).lean<IGoal[]>(),
    Patrimony.find({ period_id: periodId, family_id: familyId }).lean<IPatrimony[]>(),
  ]);

  const totalRevenue = revenues.reduce((sum, r) => sum + r.value, 0);
  const totalPurchase = purchases.reduce((sum, p) => sum + p.value, 0);

  // Resolve aporte IDs: try hardcoded first, fallback to FINANCEIRAS category subcategories
  const APORTE_SUBCATEGORY_NAMES = ["Investimento/Aporte Mensal", "Previdência Privada"];
  let aporteIds: string[] = [...APORTE_SUBCATEGORY_IDS];
  const hasHardcodedMatch = purchases.some((p) =>
    APORTE_SUBCATEGORY_IDS.includes(p.subcategory_id?.toString() as (typeof APORTE_SUBCATEGORY_IDS)[number])
  );
  if (!hasHardcodedMatch) {
    const financeirasCategory = await Category.findOne({
      family_id: familyId,
      name: FINANCEIRAS_CATEGORY_NAME,
      category_type: "purchase",
    });
    if (financeirasCategory) {
      aporteIds = financeirasCategory.subcategories
        .filter((s: { name: string }) => APORTE_SUBCATEGORY_NAMES.includes(s.name))
        .map((s: { _id: { toString(): string } }) => s._id.toString());
    }
  }

  const totalAporte = purchases
    .filter((p) => aporteIds.includes(p.subcategory_id?.toString() ?? ""))
    .reduce((sum, p) => sum + p.value, 0);
  const totalBalance = totalRevenue - totalPurchase;
  const totalGoal = goals.reduce((sum, g) => sum + g.value, 0);
  const totalPatrimony = patrimonies.reduce((sum, p) => sum + p.value, 0);

  // Performance: current patrimony - previous month patrimony - aporte
  // Needs: patrimony this month + patrimony last month (at least 2 periods)
  const currentPeriod = await Period.findById(periodId);
  let performanceValue = 0;
  let hasPerformanceData = false;

  if (currentPeriod && totalPatrimony > 0) {
    const prevMonth = currentPeriod.month === 1 ? 12 : currentPeriod.month - 1;
    const prevYear = currentPeriod.month === 1 ? currentPeriod.year - 1 : currentPeriod.year;
    const prevPeriod = await Period.findOne({ month: prevMonth, year: prevYear, family_id: familyId });

    if (prevPeriod) {
      const prevPatrimonies = await Patrimony.find({ period_id: prevPeriod._id, family_id: familyId }).lean<IPatrimony[]>();
      const prevTotalPatrimony = prevPatrimonies.reduce((sum, p) => sum + p.value, 0);
      if (prevTotalPatrimony > 0) {
        performanceValue = totalPatrimony - prevTotalPatrimony - totalAporte;
        hasPerformanceData = true;
      }
    }
  }

  const kpis: DashboardKPIs = {
    totalRevenue,
    totalPurchase,
    totalAporte,
    totalBalance,
    totalGoal,
    totalPatrimony,
    performanceValue,
    hasPerformanceData,
  };

  const paymentsPerCategory = await getPaymentsPerCategory(purchases, goals, familyId);

  const goalAlerts = calculateGoalAlerts(goals, purchases);

  return { kpis, paymentsPerCategory, goalAlerts };
}

export async function getGoalAlerts(): Promise<GoalAlert[]> {
  const session = await auth();
  if (!session) return [];

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) return [];

  const familyId = user.family_id;

  const [purchases, goals] = await Promise.all([
    Purchase.find({ period_id: user.period_id, family_id: familyId }).lean<IPurchase[]>(),
    Goal.find({ period_id: user.period_id, family_id: familyId }).lean<IGoal[]>(),
  ]);

  return calculateGoalAlerts(goals, purchases);
}
