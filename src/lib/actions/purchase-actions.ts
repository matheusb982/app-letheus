"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { Purchase, type IPurchase } from "@/lib/db/models/purchase";
import { Category } from "@/lib/db/models/category";
import { saveClassificationRule } from "@/lib/services/classification-rules";
import { purchaseSchema } from "@/lib/validations/purchases";
import { getUserFamilyContext } from "@/lib/actions/family-helpers";
import { requireActiveSubscription } from "@/lib/actions/subscription-helpers";
function formatDateBR(date: Date): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const d = parts.find(p => p.type === 'day')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const y = parts.find(p => p.type === 'year')!.value;
  return `${y}-${m}-${d}`;
}


export interface SerializedPurchase {
  id: string;
  value: number;
  purchase_date: string;
  purchase_type: "debit" | "credit";
  description: string;
  subcategory_name: string;
  subcategory_id: string;
  period_id: string;
}

export async function getPurchases(subcategoryId?: string): Promise<SerializedPurchase[]> {
  const { familyId, periodId } = await getUserFamilyContext();

  const query: Record<string, unknown> = { period_id: periodId, family_id: familyId };
  if (subcategoryId) query.subcategory_id = subcategoryId;

  const purchases = await Purchase.find(query).sort({ purchase_date: -1 }).lean<IPurchase[]>();

  return purchases.map((p) => ({
    id: p._id.toString(),
    value: p.value,
    purchase_date: formatDateBR(p.purchase_date),
    purchase_type: p.purchase_type,
    description: p.description ?? "",
    subcategory_name: p.subcategory_name ?? "",
    subcategory_id: p.subcategory_id?.toString() ?? "",
    period_id: p.period_id?.toString() ?? "",
  }));
}

export async function getPurchaseById(id: string): Promise<SerializedPurchase | null> {
  await connectDB();
  const p = await Purchase.findById(id).lean<IPurchase>();
  if (!p) return null;
  return {
    id: p._id.toString(),
    value: p.value,
    purchase_date: formatDateBR(p.purchase_date),
    purchase_type: p.purchase_type,
    description: p.description ?? "",
    subcategory_name: p.subcategory_name ?? "",
    subcategory_id: p.subcategory_id?.toString() ?? "",
    period_id: p.period_id?.toString() ?? "",
  };
}

async function getSubcategoryName(subcategoryId: string): Promise<string> {
  const category = await Category.findOne({ "subcategories._id": subcategoryId });
  if (!category) return "";
  const sub = category.subcategories.find((s: { _id: { toString(): string }; name?: string }) => s._id.toString() === subcategoryId);
  return sub?.name ?? "";
}

export async function createPurchase(data: FormData) {
  await requireActiveSubscription();
  const { familyId, periodId } = await getUserFamilyContext();

  const raw = {
    value: data.get("value"),
    purchase_date: data.get("purchase_date"),
    purchase_type: data.get("purchase_type"),
    description: data.get("description"),
    subcategory_id: data.get("subcategory_id"),
  };

  const parsed = purchaseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const subcategoryName = parsed.data.subcategory_id
    ? await getSubcategoryName(parsed.data.subcategory_id)
    : "";

  // Auto-clear sample data when user creates real purchases
  await Purchase.deleteMany({ family_id: familyId, is_sample: true });

  await Purchase.create({
    value: parsed.data.value,
    purchase_date: new Date(parsed.data.purchase_date + "T12:00:00"),
    purchase_type: parsed.data.purchase_type,
    description: parsed.data.description ?? "",
    subcategory_id: parsed.data.subcategory_id || undefined,
    subcategory_name: subcategoryName,
    period_id: periodId,
    family_id: familyId,
  });

  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePurchase(id: string, data: FormData) {
  await requireActiveSubscription();
  await connectDB();
  const { familyId } = await getUserFamilyContext();

  const raw = {
    value: data.get("value"),
    purchase_date: data.get("purchase_date"),
    purchase_type: data.get("purchase_type"),
    description: data.get("description"),
    subcategory_id: data.get("subcategory_id"),
  };

  const parsed = purchaseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const subcategoryName = parsed.data.subcategory_id
    ? await getSubcategoryName(parsed.data.subcategory_id)
    : "";

  const oldPurchase = await Purchase.findById(id).lean<IPurchase>();
  
  await Purchase.findByIdAndUpdate(id, {
    value: parsed.data.value,
    purchase_date: new Date(parsed.data.purchase_date + "T12:00:00"),
    purchase_type: parsed.data.purchase_type,
    description: parsed.data.description ?? "",
    subcategory_id: parsed.data.subcategory_id || undefined,
    subcategory_name: subcategoryName,
  });

  // Se a subcategoria mudou, salvar regra de classificação
  if (
    parsed.data.subcategory_id &&
    oldPurchase?.subcategory_id?.toString() !== parsed.data.subcategory_id
  ) {
    const session = await auth();
    if (session?.user?.id && parsed.data.description) {
      await saveClassificationRule(
        parsed.data.description,
        parsed.data.subcategory_id,
        subcategoryName,
        session.user.id,
        familyId.toString()
      );
    }
  }

  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePurchase(id: string) {
  await requireActiveSubscription();
  await connectDB();
  await Purchase.findByIdAndDelete(id);
  revalidatePath("/purchases");
  revalidatePath("/dashboard");
}
