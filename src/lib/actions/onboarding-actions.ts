"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { Period } from "@/lib/db/models/period";
import { Revenue, type IRevenue } from "@/lib/db/models/revenue";
import { Purchase, type IPurchase } from "@/lib/db/models/purchase";
import { getMonthName } from "@/lib/utils/months";
import { getUserFamilyId } from "@/lib/actions/family-helpers";
import { importCSV } from "@/lib/services/csv-import";
import { importText } from "@/lib/services/text-import";

export async function checkOnboardingStatus() {
  const session = await auth();
  if (!session) return { completed: true }; // redirect handled by middleware

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) return { completed: true };

  return {
    completed: user.onboarding_completed === true,
    hasperiod: !!user.period_id,
    userName: user.fullname?.split(" ")[0] || "Usuário",
  };
}

export async function ensurePeriodExists() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const familyId = await getUserFamilyId();
  const user = await User.findById(session.user.id);
  if (!user) throw new Error("Usuário não encontrado");

  // If user already has a period, skip
  if (user.period_id) {
    const existing = await Period.findById(user.period_id);
    if (existing) return { periodId: existing._id.toString() };
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Check if period exists for this month
  let period = await Period.findOne({ month, year, family_id: familyId });

  if (!period) {
    period = await Period.create({
      name: getMonthName(month),
      month,
      year,
      family_id: familyId,
    });

    // No default revenues for new users — they'll add their own
  }

  // Set user's period
  await User.findByIdAndUpdate(session.user.id, { period_id: period._id });

  return { periodId: period._id.toString() };
}

export async function saveOnboardingRevenue(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const familyId = await getUserFamilyId();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) throw new Error("Período não encontrado");

  const name = (formData.get("name") as string)?.trim() || "Salário";
  const valueStr = (formData.get("value") as string)?.replace(/[^\d.,]/g, "").replace(",", ".");
  const value = parseFloat(valueStr || "0");

  if (value <= 0) return { error: "Informe um valor válido" };

  await Revenue.create({
    name,
    value,
    period_id: user.period_id,
    family_id: familyId,
  });

  revalidatePath("/revenues");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function importOnboardingCSV(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const familyId = await getUserFamilyId();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) throw new Error("Período não encontrado");

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { created: 0, skipped: 0, total: 0, items: [], errors: ["Nenhum arquivo selecionado"] };
  }

  const purchaseType = (formData.get("purchaseType") as string) === "debit" ? "debit" as const : "credit" as const;

  // Auto-clear sample data when importing real data
  await Purchase.deleteMany({ family_id: familyId, is_sample: true });

  const text = await file.text();
  const result = await importCSV(text, user.period_id.toString(), purchaseType, session.user.id, familyId.toString());

  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return result;
}

export async function importOnboardingText(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const familyId = await getUserFamilyId();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) throw new Error("Período não encontrado");

  const text = formData.get("text") as string;
  if (!text?.trim()) {
    return { created: 0, skipped: 0, total: 0, items: [], errors: ["Nenhum texto fornecido"] };
  }

  // Auto-clear sample data when importing real data
  await Purchase.deleteMany({ family_id: familyId, is_sample: true });

  const result = await importText(text, user.period_id.toString(), session.user.id, familyId.toString());

  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return result;
}

export interface OnboardingSummary {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  topCategories: { name: string; total: number; percentage: number }[];
  biggestExpense: { description: string; value: number } | null;
}

export async function getOnboardingSummary(): Promise<OnboardingSummary> {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) {
    return { totalRevenue: 0, totalExpenses: 0, balance: 0, transactionCount: 0, topCategories: [], biggestExpense: null };
  }

  const familyId = user.family_id;

  const [purchases, revenues] = await Promise.all([
    Purchase.find({ period_id: user.period_id, family_id: familyId }).lean<IPurchase[]>(),
    Revenue.find({ period_id: user.period_id, family_id: familyId }).lean<IRevenue[]>(),
  ]);

  const totalRevenue = revenues.reduce((sum, r) => sum + r.value, 0);
  const totalExpenses = purchases.reduce((sum, p) => sum + p.value, 0);
  const balance = totalRevenue - totalExpenses;
  const transactionCount = purchases.length;

  // Group by subcategory
  const bySubcat = new Map<string, number>();
  for (const p of purchases) {
    const name = p.subcategory_name || "Outros";
    bySubcat.set(name, (bySubcat.get(name) ?? 0) + p.value);
  }

  const topCategories = Array.from(bySubcat.entries())
    .map(([name, total]) => ({
      name,
      total,
      percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Biggest expense
  const sorted = [...purchases].sort((a, b) => b.value - a.value);
  const biggestExpense = sorted[0]
    ? { description: sorted[0].description || "Sem descrição", value: sorted[0].value }
    : null;

  return { totalRevenue, totalExpenses, balance, transactionCount, topCategories, biggestExpense };
}

export async function completeOnboarding() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { onboarding_completed: true });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function skipOnboarding() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();

  // Ensure period exists even when skipping
  await ensurePeriodExists();

  await User.findByIdAndUpdate(session.user.id, { onboarding_completed: true });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

const SAMPLE_PURCHASES = [
  { description: "Supermercado Extra", value: 287.5, subcategory_name: "Alimentação", type: "debit" as const, daysAgo: 2 },
  { description: "Uber", value: 23.9, subcategory_name: "Transporte", type: "credit" as const, daysAgo: 3 },
  { description: "Netflix", value: 55.9, subcategory_name: "Assinaturas", type: "credit" as const, daysAgo: 5 },
  { description: "Restaurante Sabor & Arte", value: 89.0, subcategory_name: "Alimentação", type: "credit" as const, daysAgo: 6 },
  { description: "Farmácia Drogasil", value: 67.8, subcategory_name: "Saúde", type: "debit" as const, daysAgo: 7 },
  { description: "Posto Shell", value: 250.0, subcategory_name: "Transporte", type: "debit" as const, daysAgo: 8 },
  { description: "iFood", value: 45.5, subcategory_name: "Alimentação", type: "credit" as const, daysAgo: 9 },
  { description: "Spotify", value: 21.9, subcategory_name: "Assinaturas", type: "credit" as const, daysAgo: 10 },
  { description: "Mercado Livre", value: 159.9, subcategory_name: "Compras", type: "credit" as const, daysAgo: 12 },
  { description: "Academia Smart Fit", value: 109.9, subcategory_name: "Saúde", type: "credit" as const, daysAgo: 15 },
  { description: "Padaria Pão Quente", value: 32.0, subcategory_name: "Alimentação", type: "debit" as const, daysAgo: 1 },
  { description: "Conta de Luz - Enel", value: 185.0, subcategory_name: "Moradia", type: "debit" as const, daysAgo: 18 },
] as const;

export async function createSampleData() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const familyId = await getUserFamilyId();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) throw new Error("Período não encontrado");

  // Don't create if samples already exist
  const existing = await Purchase.countDocuments({
    period_id: user.period_id,
    family_id: familyId,
    is_sample: true,
  });
  if (existing > 0) return { created: existing };

  const now = new Date();
  for (const item of SAMPLE_PURCHASES) {
    const date = new Date(now);
    date.setDate(date.getDate() - item.daysAgo);
    date.setHours(12, 0, 0, 0);

    await Purchase.create({
      value: item.value,
      purchase_date: date,
      purchase_type: item.type,
      description: item.description,
      subcategory_name: item.subcategory_name,
      period_id: user.period_id,
      family_id: familyId,
      is_sample: true,
    });
  }

  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return { created: SAMPLE_PURCHASES.length };
}

export async function clearSampleData() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const familyId = await getUserFamilyId();

  const result = await Purchase.deleteMany({ family_id: familyId, is_sample: true });

  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return { deleted: result.deletedCount };
}

export async function hasSampleData(): Promise<boolean> {
  const session = await auth();
  if (!session) return false;

  await connectDB();
  const familyId = await getUserFamilyId();
  const count = await Purchase.countDocuments({ family_id: familyId, is_sample: true });
  return count > 0;
}
