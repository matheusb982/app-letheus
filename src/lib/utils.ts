import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export utilities for convenience
export { formatCurrency, formatDate, parseBRLValue } from "./utils/format";
export { getMonthName, MONTH_NAMES } from "./utils/months";
