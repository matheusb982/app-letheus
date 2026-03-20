"use server";

import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { Purchase, type IPurchase } from "@/lib/db/models/purchase";
import { Revenue, type IRevenue } from "@/lib/db/models/revenue";
import { Goal, type IGoal } from "@/lib/db/models/goal";
import { Patrimony, type IPatrimony } from "@/lib/db/models/patrimony";
import { Period } from "@/lib/db/models/period";
import { APORTE_SUBCATEGORY_IDS } from "@/lib/utils/constants";
import { getPaymentsPerCategory } from "@/lib/services/payments-per-category";

export interface DashboardKPIs {
  totalRevenue: number;
  totalPurchase: number;
  totalAporte: number;
  totalBalance: number;
  totalGoal: number;
  totalPatrimony: number;
  performanceValue: number;
}

export async function getDashboardData() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) return null;

  const periodId = user.period_id;

  const [purchases, revenues, goals, patrimonies] = await Promise.all([
    Purchase.find({ period_id: periodId }).lean<IPurchase[]>(),
    Revenue.find({ period_id: periodId }).lean<IRevenue[]>(),
    Goal.find({ period_id: periodId }).lean<IGoal[]>(),
    Patrimony.find({ period_id: periodId }).lean<IPatrimony[]>(),
  ]);

  const totalRevenue = revenues.reduce((sum, r) => sum + r.value, 0);
  const totalPurchase = purchases.reduce((sum, p) => sum + p.value, 0);
  const totalAporte = purchases
    .filter((p) =>
      APORTE_SUBCATEGORY_IDS.includes(p.subcategory_id?.toString() as (typeof APORTE_SUBCATEGORY_IDS)[number])
    )
    .reduce((sum, p) => sum + p.value, 0);
  const totalBalance = totalRevenue - totalPurchase;
  const totalGoal = goals.reduce((sum, g) => sum + g.value, 0);
  const totalPatrimony = patrimonies.reduce((sum, p) => sum + p.value, 0);

  // Performance: current patrimony - previous month patrimony - aporte
  const currentPeriod = await Period.findById(periodId);
  let performanceValue = 0;

  if (currentPeriod) {
    const prevMonth = currentPeriod.month === 1 ? 12 : currentPeriod.month - 1;
    const prevYear = currentPeriod.month === 1 ? currentPeriod.year - 1 : currentPeriod.year;
    const prevPeriod = await Period.findOne({ month: prevMonth, year: prevYear });

    if (prevPeriod) {
      const prevPatrimonies = await Patrimony.find({ period_id: prevPeriod._id }).lean<IPatrimony[]>();
      const prevTotalPatrimony = prevPatrimonies.reduce((sum, p) => sum + p.value, 0);
      performanceValue = totalPatrimony - prevTotalPatrimony - totalAporte;
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
  };

  const paymentsPerCategory = await getPaymentsPerCategory(purchases, goals);

  return { kpis, paymentsPerCategory };
}
