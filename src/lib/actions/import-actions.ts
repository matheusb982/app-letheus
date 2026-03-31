"use server";

import { importCSV } from "@/lib/services/csv-import";
import { importText } from "@/lib/services/text-import";
import { revalidatePath } from "next/cache";
import { Purchase } from "@/lib/db/models/purchase";
import { getUserFamilyContext } from "@/lib/actions/family-helpers";
import { checkSubscriptionActive } from "@/lib/actions/subscription-helpers";

async function getUserContext(): Promise<{ periodId: string; userId: string; familyId: string }> {
  const ctx = await getUserFamilyContext();
  return { periodId: ctx.periodId.toString(), userId: ctx.userId, familyId: ctx.familyId.toString() };
}

export async function importCSVAction(formData: FormData) {
  const blocked = await checkSubscriptionActive();
  if (blocked) return { error: blocked };
  const { periodId, userId, familyId } = await getUserContext();
  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { success: false, created: 0, skipped: 0, total: 0, items: [], errors: ["Nenhum arquivo selecionado"] };
  }

  // Auto-clear sample data when importing real data
  await Purchase.deleteMany({ family_id: familyId, is_sample: true });

  const text = await file.text();
  const result = await importCSV(text, periodId, "credit", userId, familyId);

  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return result;
}

export async function importTextAction(formData: FormData) {
  const blocked = await checkSubscriptionActive();
  if (blocked) return { error: blocked };
  const { periodId, userId, familyId } = await getUserContext();
  const text = formData.get("text") as string;
  if (!text?.trim()) {
    return { success: false, created: 0, skipped: 0, total: 0, items: [], errors: ["Nenhum texto fornecido"] };
  }

  // Auto-clear sample data when importing real data
  await Purchase.deleteMany({ family_id: familyId, is_sample: true });

  const result = await importText(text, periodId, userId, familyId);

  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return result;
}
