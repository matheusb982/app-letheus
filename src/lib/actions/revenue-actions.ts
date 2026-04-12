"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { Revenue, type IRevenue } from "@/lib/db/models/revenue";
import { revenueSchema } from "@/lib/validations/revenues";
import { getUserFamilyContext } from "@/lib/actions/family-helpers";
import { checkSubscriptionActive } from "@/lib/actions/subscription-helpers";

export interface SerializedRevenue {
  id: string;
  value: number;
  name: string;
  description: string;
  period_id: string;
}

export async function getRevenues(): Promise<SerializedRevenue[]> {
  const { familyId, periodId } = await getUserFamilyContext();
  const revenues = await Revenue.find({ period_id: periodId, family_id: familyId }).sort({ created_at: -1 }).lean<IRevenue[]>();

  return revenues.map((r) => ({
    id: r._id.toString(),
    value: r.value,
    name: r.name,
    description: r.description ?? "",
    period_id: r.period_id?.toString() ?? "",
  }));
}

export async function getRevenueById(id: string): Promise<SerializedRevenue | null> {
  const { familyId } = await getUserFamilyContext();
  const r = await Revenue.findOne({ _id: id, family_id: familyId }).lean<IRevenue>();
  if (!r) return null;
  return {
    id: r._id.toString(),
    value: r.value,
    name: r.name,
    description: r.description ?? "",
    period_id: r.period_id?.toString() ?? "",
  };
}

export async function createRevenue(data: FormData) {
  const blocked = await checkSubscriptionActive();
  if (blocked) return { error: blocked };
  const { familyId, periodId } = await getUserFamilyContext();

  const raw = {
    value: data.get("value"),
    name: data.get("name"),
    description: data.get("description"),
  };

  const parsed = revenueSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await Revenue.create({
    value: parsed.data.value,
    name: parsed.data.name,
    description: parsed.data.description ?? "",
    period_id: periodId,
    family_id: familyId,
  });

  revalidatePath("/revenues");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateRevenue(id: string, data: FormData) {
  const blocked = await checkSubscriptionActive();
  if (blocked) return { error: blocked };
  const { familyId } = await getUserFamilyContext();

  const raw = {
    value: data.get("value"),
    name: data.get("name"),
    description: data.get("description"),
  };

  const parsed = revenueSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const existing = await Revenue.findOne({ _id: id, family_id: familyId });
  if (!existing) return { error: "Receita não encontrada" };

  await Revenue.findOneAndUpdate({ _id: id, family_id: familyId }, {
    value: parsed.data.value,
    name: parsed.data.name,
    description: parsed.data.description ?? "",
  });

  revalidatePath("/revenues");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteRevenue(id: string) {
  const blocked = await checkSubscriptionActive();
  if (blocked) return { error: blocked };
  const { familyId } = await getUserFamilyContext();
  await Revenue.findOneAndDelete({ _id: id, family_id: familyId });
  revalidatePath("/revenues");
  revalidatePath("/dashboard");
}
