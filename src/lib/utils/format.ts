export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function parseBRLValue(value: string): number {
  return parseFloat(
    value.replace("R$", "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  );
}
