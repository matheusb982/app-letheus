"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { Revenue, type IRevenue } from "@/lib/db/models/revenue";
import { revenueSchema } from "@/lib/validations/revenues";

export interface SerializedRevenue {
  id: string;
  value: number;
  name: string;
  description: string;
  period_id: string;
}

async function getUserPeriodId() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) throw new Error("Nenhum período selecionado");
  return user.period_id;
}

export async function getRevenues(): Promise<SerializedRevenue[]> {
  const periodId = await getUserPeriodId();
  const revenues = await Revenue.find({ period_id: periodId }).sort({ created_at: -1 }).lean<IRevenue[]>();

  return revenues.map((r) => ({
    id: r._id.toString(),
    value: r.value,
    name: r.name,
    description: r.description ?? "",
    period_id: r.period_id?.toString() ?? "",
  }));
}

export async function getRevenueById(id: string): Promise<SerializedRevenue | null> {
  await connectDB();
  const r = await Revenue.findById(id).lean<IRevenue>();
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
  const periodId = await getUserPeriodId();

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
  });

  revalidatePath("/revenues");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateRevenue(id: string, data: FormData) {
  await connectDB();

  const raw = {
    value: data.get("value"),
    name: data.get("name"),
    description: data.get("description"),
  };

  const parsed = revenueSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await Revenue.findByIdAndUpdate(id, {
    value: parsed.data.value,
    name: parsed.data.name,
    description: parsed.data.description ?? "",
  });

  revalidatePath("/revenues");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteRevenue(id: string) {
  await connectDB();
  await Revenue.findByIdAndDelete(id);
  revalidatePath("/revenues");
  revalidatePath("/dashboard");
}
