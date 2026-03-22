export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const raw = typeof date === "string" ? date : date.toISOString();
  const d = new Date(raw.includes("T") ? raw : raw + "T12:00:00");
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(d);
}

export function parseBRLValue(value: string): number {
  return parseFloat(
    value.replace("R$", "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  );
}
