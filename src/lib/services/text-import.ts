import { connectDB } from "@/lib/db/connection";
import { Purchase } from "@/lib/db/models/purchase";
import { Category, type ICategory } from "@/lib/db/models/category";
import { classifyWithAI } from "./ai-classifier";

interface ParsedRow {
  date: string;
  csv_category: string;
  csv_description: string;
  installment?: string;
  value: number;
}

import type { ImportedItem, ImportResult } from "./csv-import";
export type { ImportedItem, ImportResult };

const IGNORED_DESCRIPTIONS = [
  "anuidade diferenciada",
  "estorno tarifa",
  "pagamento fatura",
  "pagamentos validos",
];

// Aceita vários formatos de data:
// "segunda-feira, 23/03/2026" | "Hoje, 23/03/26" | "Ontem, 22/03/26" | "23/03/2026" | "23/03/26"
const DATE_PATTERNS = [
  /^(?:segunda|terça|quarta|quinta|sexta|sábado|domingo)[\w-]*,?\s*(\d{2}\/\d{2}\/\d{2,4})/i,
  /^(?:hoje|ontem),?\s*(\d{2}\/\d{2}\/\d{2,4})/i,
  /^(\d{2}\/\d{2}\/\d{2,4})$/,
];
const VALUE_REGEX = /^-?\s*R\$\s*([\d.,]+)$/;
const INSTALLMENT_REGEX = /^Em\s+(\d+)x$/i;

function matchDate(line: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function parseTextLines(text: string): ParsedRow[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: ParsedRow[] = [];

  let currentDate = "";
  let currentCategory = "";
  let currentDescription = "";
  let expectingDescription = false;
  let lastWasValue = false;

  for (const line of lines) {
    // Date line
    const dateStr = matchDate(line);
    if (dateStr) {
      currentDate = dateStr;
      expectingDescription = false;
      lastWasValue = false;
      continue;
    }

    // Value line
    const valueMatch = line.match(VALUE_REGEX);
    if (valueMatch && currentDate) {
      // Skip duplicate value line (apps show value twice)
      if (lastWasValue) {
        lastWasValue = false;
        continue;
      }

      const rawValue = valueMatch[1].replace(/\./g, "").replace(",", ".");
      const value = parseFloat(rawValue);

      if (value > 0 && currentDescription) {
        rows.push({
          date: currentDate,
          csv_category: currentCategory,
          csv_description: currentDescription,
          value,
        });
      }
      currentCategory = "";
      currentDescription = "";
      expectingDescription = false;
      lastWasValue = true;
      continue;
    }

    lastWasValue = false;

    // Installment line
    const installMatch = line.match(INSTALLMENT_REGEX);
    if (installMatch) {
      if (rows.length > 0) {
        rows[rows.length - 1].installment = `Em ${installMatch[1]}x`;
      }
      continue;
    }

    // Category or description
    if (!expectingDescription) {
      currentCategory = line;
      expectingDescription = true;
    } else {
      currentDescription = line;
      expectingDescription = false;
    }
  }

  return rows;
}

export async function importText(
  text: string,
  periodId: string,
  userId?: string,
  familyId?: string
): Promise<ImportResult> {
  await connectDB();

  const rows = parseTextLines(text);
  const validRows = rows.filter(
    (row) =>
      row.value > 0 &&
      !IGNORED_DESCRIPTIONS.some((ignored) =>
        row.csv_description.toLowerCase().includes(ignored)
      )
  );

  // Load subcategories
  const categories = await Category.find({ category_type: "purchase", ...(familyId ? { family_id: familyId } : {}) }).lean<ICategory[]>();
  const subcategories = categories.flatMap((c) =>
    c.subcategories.map((s) => ({
      id: s._id.toString(),
      name: s.name,
    }))
  );

  // AI classification
  const uniqueDescriptions = [...new Set(validRows.map((r) => `${r.csv_category}|${r.csv_description}`))];
  const mapping = await classifyWithAI(uniqueDescriptions, subcategories, userId, periodId, familyId);

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const items: ImportedItem[] = [];

  for (const row of validRows) {
    let description = row.csv_description;
    if (row.installment) {
      description += ` (${row.installment})`;
    }

    const fingerprint = `${row.date}|${row.value}|${description}`;

    let subcatName = "";
    try {
      const descKey = `${row.csv_category}|${row.csv_description}`;
      const subcatId = mapping.get(descKey);
      subcatName = subcatId
        ? subcategories.find((s) => s.id === subcatId)?.name ?? ""
        : "";

      const parts = row.date.split("/");
      let year = parseInt(parts[2]);
      if (year < 100) year += 2000;
      const dateObj = new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]), 12, 0, 0);

      // Atomic upsert: unique index on (family_id, period_id, fingerprint) prevents duplicates
      const result = await Purchase.findOneAndUpdate(
        {
          family_id: familyId || undefined,
          period_id: periodId,
          fingerprint,
        },
        {
          $setOnInsert: {
            value: row.value,
            purchase_date: dateObj,
            purchase_type: "credit",
            description,
            subcategory_id: subcatId || undefined,
            subcategory_name: subcatName,
            period_id: periodId,
            fingerprint,
            ...(familyId ? { family_id: familyId } : {}),
          },
        },
        { upsert: true, new: true, rawResult: true }
      );

      if (result.lastErrorObject?.updatedExisting) {
        skipped++;
        items.push({ description, subcategory: subcatName, value: row.value, date: row.date, status: "skipped" });
      } else {
        created++;
        items.push({ description, subcategory: subcatName, value: row.value, date: row.date, status: "created" });
      }
    } catch (err) {
      errors.push(`Erro: ${description} - ${(err as Error).message}`);
      items.push({ description, subcategory: subcatName, value: row.value, date: row.date, status: "error", error: (err as Error).message });
    }
  }

  return {
    success: errors.length === 0,
    created,
    skipped,
    total: validRows.length,
    errors,
    items,
  };
}
