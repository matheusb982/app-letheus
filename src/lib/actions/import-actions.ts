"use server";

import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { importCSV } from "@/lib/services/csv-import";
import { importText } from "@/lib/services/text-import";
import { revalidatePath } from "next/cache";

async function getUserContext(): Promise<{ periodId: string; userId: string }> {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) throw new Error("Nenhum período selecionado");
  return { periodId: user.period_id.toString(), userId: session.user.id! };
}

export async function importCSVAction(formData: FormData) {
  const { periodId, userId } = await getUserContext();
  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { success: false, created: 0, skipped: 0, total: 0, items: [], errors: ["Nenhum arquivo selecionado"] };
  }

  const text = await file.text();
  const result = await importCSV(text, periodId, "credit", userId);

  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return result;
}

export async function importTextAction(formData: FormData) {
  const { periodId, userId } = await getUserContext();
  const text = formData.get("text") as string;
  if (!text?.trim()) {
    return { success: false, created: 0, skipped: 0, total: 0, items: [], errors: ["Nenhum texto fornecido"] };
  }

  const result = await importText(text, periodId, userId);

  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return result;
}
