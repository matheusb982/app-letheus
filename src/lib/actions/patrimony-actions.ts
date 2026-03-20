"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { Patrimony, type IPatrimony } from "@/lib/db/models/patrimony";
import { Category } from "@/lib/db/models/category";
import { patrimonySchema } from "@/lib/validations/patrimonies";

export interface SerializedPatrimony {
  id: string;
  value: number;
  subcategory_name: string;
  subcategory_id: string;
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

async function getSubcategoryName(subcategoryId: string): Promise<string> {
  const category = await Category.findOne({ "subcategories._id": subcategoryId });
  if (!category) return "";
  const sub = category.subcategories.find((s: { _id: { toString(): string }; name?: string }) => s._id.toString() === subcategoryId);
  return sub?.name ?? "";
}

export async function getPatrimonies(): Promise<SerializedPatrimony[]> {
  const periodId = await getUserPeriodId();
  const patrimonies = await Patrimony.find({ period_id: periodId }).sort({ subcategory_name: 1 }).lean<IPatrimony[]>();

  return patrimonies.map((p) => ({
    id: p._id.toString(),
    value: p.value,
    subcategory_name: p.subcategory_name ?? "",
    subcategory_id: p.subcategory_id?.toString() ?? "",
    period_id: p.period_id?.toString() ?? "",
  }));
}

export async function getPatrimonyById(id: string): Promise<SerializedPatrimony | null> {
  await connectDB();
  const p = await Patrimony.findById(id).lean<IPatrimony>();
  if (!p) return null;
  return {
    id: p._id.toString(),
    value: p.value,
    subcategory_name: p.subcategory_name ?? "",
    subcategory_id: p.subcategory_id?.toString() ?? "",
    period_id: p.period_id?.toString() ?? "",
  };
}

export async function createPatrimony(data: FormData) {
  const periodId = await getUserPeriodId();

  const raw = {
    value: data.get("value"),
    subcategory_id: data.get("subcategory_id"),
  };

  const parsed = patrimonySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const subcategoryName = await getSubcategoryName(parsed.data.subcategory_id);

  await Patrimony.create({
    value: parsed.data.value,
    subcategory_name: subcategoryName,
    subcategory_id: parsed.data.subcategory_id,
    period_id: periodId,
  });

  revalidatePath("/patrimonies");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePatrimony(id: string, data: FormData) {
  await connectDB();

  const raw = {
    value: data.get("value"),
    subcategory_id: data.get("subcategory_id"),
  };

  const parsed = patrimonySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const subcategoryName = await getSubcategoryName(parsed.data.subcategory_id);

  await Patrimony.findByIdAndUpdate(id, {
    value: parsed.data.value,
    subcategory_name: subcategoryName,
    subcategory_id: parsed.data.subcategory_id,
  });

  revalidatePath("/patrimonies");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePatrimony(id: string) {
  await connectDB();
  await Patrimony.findByIdAndDelete(id);
  revalidatePath("/patrimonies");
  revalidatePath("/dashboard");
}
