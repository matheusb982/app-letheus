import { ClassificationRule } from "@/lib/db/models/classification-rule";
import { Purchase } from "@/lib/db/models/purchase";
import { connectDB } from "@/lib/db/connection";

/**
 * Normaliza uma descrição para matching:
 * - Uppercase
 * - Remove números soltos e códigos
 * - Remove nomes de cidades comuns (últimas palavras com 3-5 chars)
 * - Trim espaços extras
 */
export function normalizeDescription(desc: string): string {
  return desc
    .toUpperCase()
    .replace(/\b\d{2}\/\d{2}\b/g, "") // remove datas dd/mm
    .replace(/\b\d+[.,]\d+\b/g, "")   // remove valores
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Busca regras de classificação para as descrições dadas.
 * Retorna um Map<descrição_original, subcategory_id> para as que encontrou match.
 */
export async function matchRules(
  descriptions: string[],
  userId: string
): Promise<Map<string, { subcategoryId: string; subcategoryName: string }>> {
  await connectDB();
  const result = new Map<string, { subcategoryId: string; subcategoryName: string }>();

  const rules = await ClassificationRule.find({ user_id: userId }).lean();
  if (rules.length === 0) return result;

  for (const desc of descriptions) {
    const normalized = normalizeDescription(desc);
    for (const rule of rules) {
      if (normalized.includes(rule.pattern) || rule.pattern.includes(normalized)) {
        result.set(desc, {
          subcategoryId: rule.subcategory_id.toString(),
          subcategoryName: rule.subcategory_name,
        });
        break;
      }
    }
  }

  return result;
}

/**
 * Busca exemplos de classificações anteriores do usuário para few-shot.
 * Retorna as últimas N classificações distintas.
 */
export async function getFewShotExamples(
  userId: string,
  periodId: string,
  limit = 30
): Promise<Array<{ description: string; subcategory_name: string }>> {
  await connectDB();

  // Busca purchases recentes que tenham subcategory_name preenchido
  const purchases = await Purchase.find({
    period_id: periodId,
    subcategory_name: { $exists: true, $ne: "" },
    description: { $exists: true, $ne: "" },
  })
    .sort({ updated_at: -1 })
    .limit(limit * 2) // pega mais para deduplicar
    .lean();

  // Deduplica por descrição normalizada
  const seen = new Set<string>();
  const examples: Array<{ description: string; subcategory_name: string }> = [];

  for (const p of purchases) {
    const key = normalizeDescription(p.description || "");
    if (!seen.has(key) && key.length > 2) {
      seen.add(key);
      examples.push({
        description: p.description || "",
        subcategory_name: p.subcategory_name || "",
      });
      if (examples.length >= limit) break;
    }
  }

  return examples;
}

/**
 * Salva ou atualiza uma regra de classificação quando o usuário corrige uma despesa.
 */
export async function saveClassificationRule(
  description: string,
  subcategoryId: string,
  subcategoryName: string,
  userId: string
): Promise<void> {
  if (!description || !subcategoryId) return;

  const pattern = normalizeDescription(description);
  if (pattern.length < 3) return;

  await connectDB();
  await ClassificationRule.findOneAndUpdate(
    { user_id: userId, pattern },
    {
      user_id: userId,
      pattern,
      subcategory_id: subcategoryId,
      subcategory_name: subcategoryName,
    },
    { upsert: true }
  );
}
