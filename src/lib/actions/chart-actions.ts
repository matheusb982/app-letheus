"use server";

import { connectDB } from "@/lib/db/connection";
import { Period, type IPeriod } from "@/lib/db/models/period";
import { Purchase, type IPurchase } from "@/lib/db/models/purchase";
import { Goal, type IGoal } from "@/lib/db/models/goal";
import { Patrimony, type IPatrimony } from "@/lib/db/models/patrimony";
import { getUserFamilyId } from "@/lib/actions/family-helpers";

export interface ChartDataPoint {
  label: string;
  actual: number;
  planned: number;
}

export interface PatrimonyChartData {
  points: ChartDataPoint[];
  totalAmount: number;
}

export async function getAnnualPurchaseChartData(
  subcategoryId?: string
): Promise<ChartDataPoint[]> {
  await connectDB();
  const familyId = await getUserFamilyId();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Get up to 12 periods going backward from current month
  const periods = await Period.find({
    family_id: familyId,
    $or: [
      { year: currentYear },
      { year: currentYear - 1, month: { $gt: currentMonth } },
    ],
  })
    .sort({ year: 1, month: 1 })
    .lean<IPeriod[]>();

  const last12 = periods.slice(-12);

  const result: ChartDataPoint[] = [];

  for (const period of last12) {
    const purchaseQuery: Record<string, unknown> = { period_id: period._id, family_id: familyId };
    const goalQuery: Record<string, unknown> = { period_id: period._id, family_id: familyId };

    if (subcategoryId) {
      purchaseQuery.subcategory_id = subcategoryId;
      goalQuery.subcategory_id = subcategoryId;
    }

    const [purchases, goals] = await Promise.all([
      Purchase.find(purchaseQuery).lean<IPurchase[]>(),
      Goal.find(goalQuery).lean<IGoal[]>(),
    ]);

    result.push({
      label: `${period.month}/${period.year}`,
      actual: purchases.reduce((sum, p) => sum + p.value, 0),
      planned: goals.reduce((sum, g) => sum + g.value, 0),
    });
  }

  return result;
}

export async function getAnnualPatrimonyChartData(): Promise<PatrimonyChartData> {
  await connectDB();
  const familyId = await getUserFamilyId();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const periods = await Period.find({
    family_id: familyId,
    $or: [
      { year: currentYear },
      { year: currentYear - 1, month: { $gt: currentMonth } },
    ],
  })
    .sort({ year: 1, month: 1 })
    .lean<IPeriod[]>();

  const last12 = periods.slice(-12);

  const totalPatrimonies: number[] = [];
  const labels: string[] = [];

  for (const period of last12) {
    const patrimonies = await Patrimony.find({ period_id: period._id, family_id: familyId }).lean<IPatrimony[]>();
    const total = patrimonies.reduce((sum, p) => sum + p.value, 0);
    totalPatrimonies.push(total);
    labels.push(`${period.month}/${period.year}`);
  }

  // Calculate planned: starts from first value minus 4000, adds 4000 each month
  const plannedValues: number[] = [];
  if (totalPatrimonies.length > 0) {
    let planned = totalPatrimonies[0] - 4000;
    for (let i = 0; i < totalPatrimonies.length; i++) {
      planned += 4000;
      plannedValues.push(planned);
    }
  }

  const totalAmount =
    totalPatrimonies.length >= 2
      ? totalPatrimonies[totalPatrimonies.length - 1] - totalPatrimonies[0]
      : 0;

  const points: ChartDataPoint[] = labels.map((label, i) => ({
    label,
    actual: totalPatrimonies[i],
    planned: plannedValues[i] ?? 0,
  }));

  return { points, totalAmount };
}
