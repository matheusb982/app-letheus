/**
 * WhatsApp expense handler — parses freeform text into structured expenses.
 * Example: "Café R$15,00", "almoco 45 reais", "uber 22,50"
 */

import { connectDB } from "@/lib/db/connection";
import { Purchase } from "@/lib/db/models/purchase";
import { Category, type ICategory } from "@/lib/db/models/category";
import { Period, type IPeriod } from "@/lib/db/models/period";
import { classifyWithAI } from "@/lib/services/ai-classifier";
import { createHash } from "crypto";
import mongoose from "mongoose";

export interface ParsedExpense {
  description: string;
  value: number;
  purchase_type: "debit" | "credit";
  subcategory_name: string;
  subcategory_id: string;
}

/**
 * Parse value from text. Returns value in BRL or null.
 */
function parseValue(text: string): number | null {
  // Match R$ 15,00 or R$ 15.00 or R$15
  const rMatch = text.match(/R\$\s*(\d{1,6}[.,]\d{2})/i);
  if (rMatch) {
    return parseFloat(rMatch[1].replace(",", "."));
  }

  // Match R$15 (no decimals)
  const rNoDecimal = text.match(/R\$\s*(\d{1,6})\b/i);
  if (rNoDecimal) {
    return parseFloat(rNoDecimal[1]);
  }

  // Match "15,00 reais" or "15 reais"
  const reaisMatch = text.match(/(\d{1,6}[.,]?\d{0,2})\s*(?:reais|real)/i);
  if (reaisMatch) {
    return parseFloat(reaisMatch[1].replace(",", "."));
  }

  // Last resort: find a number that looks like a price
  const numberMatch = text.match(/(\d{1,6}[.,]\d{2})/);
  if (numberMatch) {
    return parseFloat(numberMatch[1].replace(",", "."));
  }

  return null;
}

/**
 * Extract description from text (remove the value part).
 */
function parseDescription(text: string): string {
  return text
    .replace(/R\$\s*\d{1,6}[.,]?\d{0,2}/gi, "")
    .replace(/\d{1,6}[.,]?\d{0,2}\s*(?:reais|real)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Get the current period for a family (current month/year).
 */
async function getCurrentPeriod(
  familyId: mongoose.Types.ObjectId,
  userPeriodId?: mongoose.Types.ObjectId
): Promise<IPeriod | null> {
  // Try user's selected period first
  if (userPeriodId) {
    const period = await Period.findById(userPeriodId).lean<IPeriod>();
    if (period) return period;
  }

  // Fallback to current month
  const now = new Date();
  return Period.findOne<IPeriod>({
    family_id: familyId,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }).lean<IPeriod>();
}

/**
 * Parse and classify an expense from freeform WhatsApp text.
 */
export async function parseExpense(
  text: string,
  userId: string,
  familyId: mongoose.Types.ObjectId,
  periodId?: mongoose.Types.ObjectId
): Promise<ParsedExpense | null> {
  const value = parseValue(text);
  if (!value || value <= 0) return null;

  const description = parseDescription(text) || "Despesa WhatsApp";

  await connectDB();

  // Load subcategories for classification
  const categories = await Category.find({
    family_id: familyId,
    category_type: "purchase",
  }).lean<ICategory[]>();

  const subcategories = categories.flatMap((cat) =>
    cat.subcategories.map((sub) => ({
      id: sub._id.toString(),
      name: sub.name,
    }))
  );

  if (subcategories.length === 0) return null;

  // Classify with AI
  const classification = await classifyWithAI(
    [description],
    subcategories,
    userId,
    periodId?.toString(),
    familyId.toString()
  );

  const subcategoryId = classification.get(description) ?? subcategories.find((s) => s.name.toLowerCase().includes("outros"))?.id ?? subcategories[0].id;
  const subcategoryName = subcategories.find((s) => s.id === subcategoryId)?.name ?? "Outros";

  return {
    description,
    value,
    purchase_type: "debit",
    subcategory_name: subcategoryName,
    subcategory_id: subcategoryId,
  };
}

/**
 * Save a parsed expense as a Purchase.
 */
export async function saveExpense(
  expense: ParsedExpense,
  userId: string,
  familyId: mongoose.Types.ObjectId,
  userPeriodId?: mongoose.Types.ObjectId
): Promise<{ success: boolean; message: string }> {
  await connectDB();

  const period = await getCurrentPeriod(familyId, userPeriodId);
  if (!period) {
    return {
      success: false,
      message: "Nenhum periodo encontrado. Crie um periodo no app primeiro.",
    };
  }

  const now = new Date();
  const fingerprint = createHash("md5")
    .update(`${now.toISOString().split("T")[0]}|${expense.value}|${expense.description}|whatsapp`)
    .digest("hex");

  try {
    await Purchase.create({
      value: expense.value,
      purchase_date: now,
      purchase_type: expense.purchase_type,
      description: expense.description,
      subcategory_name: expense.subcategory_name,
      subcategory_id: new mongoose.Types.ObjectId(expense.subcategory_id),
      period_id: period._id,
      family_id: familyId,
      fingerprint,
    });

    return {
      success: true,
      message: `${expense.description} - R$ ${expense.value.toFixed(2)} (${expense.subcategory_name})`,
    };
  } catch (error) {
    // Duplicate fingerprint
    if ((error as { code?: number }).code === 11000) {
      return {
        success: false,
        message: "Essa despesa ja foi registrada.",
      };
    }
    throw error;
  }
}
