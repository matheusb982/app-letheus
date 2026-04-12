import { connectDB } from "@/lib/db/connection";
import { Purchase } from "@/lib/db/models/purchase";
import { Category, type ICategory } from "@/lib/db/models/category";
import { classifyWithAI } from "./ai-classifier";
import { parseCSV, isIgnored, buildFingerprint, type ParsedRow } from "./csv-parsers";

export type { ParsedRow } from "./csv-parsers";

export interface ImportedItem {
  description: string;
  subcategory: string;
  value: number;
  date: string;
  status: "created" | "skipped" | "error";
  error?: string;
}

export interface ImportResult {
  success: boolean;
  created: number;
  skipped: number;
  total: number;
  errors: string[];
  items: ImportedItem[];
}

export async function importCSV(
  csvText: string,
  periodId: string,
  purchaseType: "debit" | "credit" = "credit",
  userId?: string,
  familyId?: string
): Promise<ImportResult> {
  await connectDB();

  // Detect format and parse (format = parser selection, NOT purchase type)
  const { rows } = parseCSV(csvText);

  // Filter
  const validRows = rows.filter((row: ParsedRow) => row.value > 0 && !isIgnored(row.csv_description));

  // Load subcategories
  const categories = await Category.find({ category_type: "purchase", ...(familyId ? { family_id: familyId } : {}) }).lean<ICategory[]>();
  const subcategories = categories.flatMap((c) =>
    c.subcategories.map((s) => ({
      id: s._id.toString(),
      name: s.name,
    }))
  );

  // AI classification
  const uniqueDescriptions = [...new Set(validRows.map((r: ParsedRow) => `${r.csv_category}|${r.csv_description}`))];
  const mapping = await classifyWithAI(uniqueDescriptions, subcategories, userId, periodId, familyId);

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const items: ImportedItem[] = [];

  for (const row of validRows) {
    const fingerprint = buildFingerprint(row);

    // Build description
    let description = row.csv_description;
    if (row.installment && row.installment !== "-") {
      description += ` (${row.installment})`;
    }
    if (row.card_last_digits) {
      description += ` [Cartão ${row.card_last_digits}]`;
    }

    let subcatName = "";
    try {
      const descKey = `${row.csv_category}|${row.csv_description}`;
      const subcatId = mapping.get(descKey);
      subcatName = subcatId
        ? subcategories.find((s) => s.id === subcatId)?.name ?? ""
        : "";

      // Parse date (DD/MM/YYYY or DD/MM/YY)
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
            purchase_type: purchaseType,
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
      errors.push(`Erro ao criar: ${description} - ${(err as Error).message}`);
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
