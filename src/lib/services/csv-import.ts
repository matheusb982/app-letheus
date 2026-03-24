import Papa from "papaparse";
import { connectDB } from "@/lib/db/connection";
import { Purchase } from "@/lib/db/models/purchase";
import { Category, type ICategory } from "@/lib/db/models/category";
import { classifyWithAI } from "./ai-classifier";

interface ParsedRow {
  date: string;
  card_holder?: string;
  card_last_digits?: string;
  csv_category: string;
  csv_description: string;
  installment?: string;
  value: number;
}

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

const IGNORED_DESCRIPTIONS = [
  "anuidade diferenciada",
  "estorno tarifa",
  "pagamento fatura",
  "pagamentos validos",
];

function parseBRLValue(raw: string): number {
  return parseFloat(
    raw
      .replace("R$", "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
}

function removeBOM(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

function parseCSVDebito(csvText: string): ParsedRow[] {
  const cleaned = removeBOM(csvText);
  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
  });

  return result.data
    .filter((row) => row["Data"] && row["Valor"])
    .map((row) => ({
      date: row["Data"],
      card_holder: row["Portador"] ?? "",
      csv_category: "-",
      csv_description: row["Estabelecimento"] ?? "",
      installment: row["Parcela"] ?? "",
      value: parseBRLValue(row["Valor"]),
    }));
}

function parseCSVCredito(csvText: string): ParsedRow[] {
  const cleaned = removeBOM(csvText);
  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
  });

  return result.data
    .filter((row) => row["Data de Compra"] && row["Valor (em R$)"])
    .map((row) => ({
      date: row["Data de Compra"],
      card_holder: row["Nome no Cartão"] ?? "",
      card_last_digits: row["Final do Cartão"] ?? "",
      csv_category: row["Categoria"] ?? "",
      csv_description: row["Descrição"] ?? "",
      installment: row["Parcela"] ?? "",
      value: parseBRLValue(row["Valor (em R$)"]),
    }));
}

function isIgnored(description: string): boolean {
  const lower = description.toLowerCase();
  return IGNORED_DESCRIPTIONS.some((ignored) => lower.includes(ignored));
}

function buildFingerprint(row: ParsedRow): string {
  return `${row.date}|${row.value}|${row.csv_description}`;
}

export async function importCSV(
  csvText: string,
  periodId: string,
  purchaseType: "debit" | "credit" = "credit",
  userId?: string,
  familyId?: string
): Promise<ImportResult> {
  await connectDB();

  // Detect format
  const isDebito = csvText.includes("Estabelecimento");
  const rows = isDebito ? parseCSVDebito(csvText) : parseCSVCredito(csvText);
  const detectedType = isDebito ? "debit" as const : purchaseType;

  // Filter
  const validRows = rows.filter((row) => row.value > 0 && !isIgnored(row.csv_description));

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
  const mapping = await classifyWithAI(uniqueDescriptions, subcategories, userId, periodId);

  // Load existing fingerprints for dedup
  const existingPurchases = await Purchase.find({
    period_id: periodId,
    purchase_type: detectedType,
    ...(familyId ? { family_id: familyId } : {}),
  }).lean();

  const existingFingerprints = new Set(
    existingPurchases.map((p: Record<string, unknown>) => {
      const d = p.purchase_date as Date;
      const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
      return `${dateStr}|${p.value}|${p.description}`;
    })
  );

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

    if (existingFingerprints.has(fingerprint)) {
      skipped++;
      items.push({ description, subcategory: "", value: row.value, date: row.date, status: "skipped" });
      continue;
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

      await Purchase.create({
        value: row.value,
        purchase_date: dateObj,
        purchase_type: detectedType,
        description,
        subcategory_id: subcatId || undefined,
        subcategory_name: subcatName,
        period_id: periodId,
        ...(familyId ? { family_id: familyId } : {}),
      });

      created++;
      items.push({ description, subcategory: subcatName, value: row.value, date: row.date, status: "created" });
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
