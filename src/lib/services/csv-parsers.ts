import Papa from "papaparse";

export interface ParsedRow {
  date: string;
  card_holder?: string;
  card_last_digits?: string;
  csv_category: string;
  csv_description: string;
  installment?: string;
  value: number;
}

const IGNORED_DESCRIPTIONS = [
  "anuidade diferenciada",
  "estorno tarifa",
  "pagamento fatura",
  "pagamentos validos",
  "encerramento de dívida",
  "juros de dívida",
];

export function parseBRLValue(raw: string): number {
  const cleaned = raw.replace("R$", "").replace(/\s/g, "");
  // If has comma, it's BRL format (1.234,56) — remove dots, replace comma with dot
  if (cleaned.includes(",")) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  }
  // Otherwise it's already decimal format (65.78)
  return parseFloat(cleaned);
}

export function removeBOM(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

export function parseCSVDebito(csvText: string): ParsedRow[] {
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

export function parseISODate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function parseCSVNubank(csvText: string): ParsedRow[] {
  const cleaned = removeBOM(csvText);
  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    delimiter: ",",
    skipEmptyLines: true,
  });

  return result.data
    .filter((row) => row["date"] && row["amount"])
    .map((row) => ({
      date: parseISODate(row["date"]),
      csv_category: "-",
      csv_description: row["title"] ?? "",
      value: parseFloat(row["amount"]),
    }));
}

export function parseCSVCredito(csvText: string): ParsedRow[] {
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

export function isIgnored(description: string): boolean {
  const lower = description.toLowerCase();
  return IGNORED_DESCRIPTIONS.some((ignored) => lower.includes(ignored));
}

export function buildFingerprint(row: ParsedRow): string {
  return `${row.date}|${row.value}|${row.csv_description}`;
}

export function detectFormat(csvText: string): "nubank" | "debito" | "credito" {
  if (csvText.startsWith("date,") || csvText.includes("\ndate,")) return "nubank";
  if (csvText.includes("Estabelecimento")) return "debito";
  return "credito";
}

export function parseCSV(csvText: string): { rows: ParsedRow[]; format: "nubank" | "debito" | "credito" } {
  const format = detectFormat(csvText);
  const rows = format === "nubank"
    ? parseCSVNubank(csvText)
    : format === "debito"
      ? parseCSVDebito(csvText)
      : parseCSVCredito(csvText);
  return { rows, format };
}
