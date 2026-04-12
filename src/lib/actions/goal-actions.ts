"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { Goal, type IGoal } from "@/lib/db/models/goal";
import { Category } from "@/lib/db/models/category";
import { Purchase } from "@/lib/db/models/purchase";
import { Period } from "@/lib/db/models/period";
import { goalSchema } from "@/lib/validations/goals";
import { getUserFamilyContext } from "@/lib/actions/family-helpers";
import { checkSubscriptionActive } from "@/lib/actions/subscription-helpers";

export interface SerializedGoal {
  id: string;
  value: number;
  subcategory_name: string;
  subcategory_id: string;
  period_id: string;
}

async function getSubcategoryName(subcategoryId: string): Promise<string> {
  const category = await Category.findOne({ "subcategories._id": subcategoryId });
  if (!category) return "";
  const sub = category.subcategories.find((s: { _id: { toString(): string }; name?: string }) => s._id.toString() === subcategoryId);
  return sub?.name ?? "";
}

export async function getGoals(): Promise<SerializedGoal[]> {
  const { familyId, periodId } = await getUserFamilyContext();
  const goals = await Goal.find({ period_id: periodId, family_id: familyId }).sort({ subcategory_name: 1 }).lean<IGoal[]>();

  return goals.map((g) => ({
    id: g._id.toString(),
    value: g.value,
    subcategory_name: g.subcategory_name ?? "",
    subcategory_id: g.subcategory_id?.toString() ?? "",
    period_id: g.period_id?.toString() ?? "",
  }));
}

export async function getGoalById(id: string): Promise<SerializedGoal | null> {
  const { familyId } = await getUserFamilyContext();
  const g = await Goal.findOne({ _id: id, family_id: familyId }).lean<IGoal>();
  if (!g) return null;
  return {
    id: g._id.toString(),
    value: g.value,
    subcategory_name: g.subcategory_name ?? "",
    subcategory_id: g.subcategory_id?.toString() ?? "",
    period_id: g.period_id?.toString() ?? "",
  };
}

export async function createGoal(data: FormData) {
  const blocked = await checkSubscriptionActive();
  if (blocked) return { error: blocked };
  const { familyId, periodId } = await getUserFamilyContext();

  const raw = {
    value: data.get("value"),
    subcategory_id: data.get("subcategory_id"),
  };

  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const subcategoryName = await getSubcategoryName(parsed.data.subcategory_id);

  await Goal.create({
    value: parsed.data.value,
    subcategory_name: subcategoryName,
    subcategory_id: parsed.data.subcategory_id,
    period_id: periodId,
    family_id: familyId,
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateGoal(id: string, data: FormData) {
  const blocked = await checkSubscriptionActive();
  if (blocked) return { error: blocked };
  const { familyId } = await getUserFamilyContext();

  const raw = {
    value: data.get("value"),
    subcategory_id: data.get("subcategory_id"),
  };

  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const subcategoryName = await getSubcategoryName(parsed.data.subcategory_id);

  const existing = await Goal.findOne({ _id: id, family_id: familyId });
  if (!existing) return { error: "Meta não encontrada" };

  await Goal.findOneAndUpdate({ _id: id, family_id: familyId }, {
    value: parsed.data.value,
    subcategory_name: subcategoryName,
    subcategory_id: parsed.data.subcategory_id,
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteGoal(id: string) {
  const blocked = await checkSubscriptionActive();
  if (blocked) return { error: blocked };
  const { familyId } = await getUserFamilyContext();
  await Goal.findOneAndDelete({ _id: id, family_id: familyId });
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function getGoalReadiness(): Promise<{
  hasEnoughData: boolean;
  periodsWithData: number;
  minPeriodsNeeded: number;
}> {
  const { familyId } = await getUserFamilyContext();

  // Find periods that have at least 1 purchase
  const periods = await Period.find({ family_id: familyId }).lean();
  let periodsWithData = 0;

  for (const period of periods) {
    const count = await Purchase.countDocuments({
      period_id: period._id,
      family_id: familyId,
      is_sample: { $ne: true },
    });
    if (count > 0) periodsWithData++;
  }

  return {
    hasEnoughData: periodsWithData >= 2,
    periodsWithData,
    minPeriodsNeeded: 2,
  };
}
