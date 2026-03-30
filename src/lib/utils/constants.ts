export const DAILY_CHAT_LIMIT = 50;

export const CACHE_TTL_HOURS = 3;

export const DEFAULT_REVENUES = [
  { name: "Herospark", value: 14500 },
  { name: "Prefeitura", value: 4000 },
] as const;

// Legacy hardcoded aporte subcategory IDs (production)
export const APORTE_SUBCATEGORY_IDS = [
  "674f65d9e182e26ad80cc636",
  "674f65d9e182e26ad80cc635",
] as const;

// Category name used to identify aporte subcategories for new families
export const APORTE_CATEGORY_NAME = "APORTE";

export const FINANCEIRAS_CATEGORY_NAME = "FINANCEIRAS";

export const ADMIN_EMAIL = "matheusb982@gmail.com";
