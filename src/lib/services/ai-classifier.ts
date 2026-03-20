import { generateText } from "ai";
import { google } from "@ai-sdk/google";

interface SubcategoryOption {
  id: string;
  name: string;
}

export async function classifyWithAI(
  descriptions: string[],
  subcategories: SubcategoryOption[]
): Promise<Map<string, string>> {
  const mapping = new Map<string, string>();

  if (descriptions.length === 0 || subcategories.length === 0) {
    return mapping;
  }

  const fallbackId = subcategories.find((s) =>
    s.name.toLowerCase().includes("outros")
  )?.id;

  const subcatList = subcategories
    .map((s) => `${s.id}: ${s.name}`)
    .join("\n");

  const descList = descriptions
    .map((d, i) => `${i}: ${d}`)
    .join("\n");

  const prompt = `Você é um classificador de despesas financeiras.

Subcategorias disponíveis:
${subcatList}

Despesas para classificar (índice: categoria|descrição):
${descList}

Regras de classificação:
- UBER, 99, taxi = Transporte
- Supermercado, mercado, atacadão = Supermercado/Mercado
- Padaria, panificadora = Alimentação
- Restaurante, lanchonete, ifood, rappi = Alimentação/Delivery
- Farmácia, drogaria = Saúde
- Gasolina, combustível, posto = Combustível
- Estacionamento = Estacionamento
- Se não souber classificar, use "Outros"

Responda APENAS com um JSON no formato: {"0": "subcategory_id", "1": "subcategory_id", ...}
Onde a chave é o índice da despesa e o valor é o ID da subcategoria correspondente.`;

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
      temperature: 0.1,
      maxOutputTokens: 16384,
    });

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return applyFallback(descriptions, mapping, fallbackId);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;

    for (const [indexStr, subcatId] of Object.entries(parsed)) {
      const index = parseInt(indexStr);
      if (index >= 0 && index < descriptions.length) {
        mapping.set(descriptions[index], subcatId);
      }
    }

    return mapping;
  } catch {
    return applyFallback(descriptions, mapping, fallbackId);
  }
}

function applyFallback(
  descriptions: string[],
  mapping: Map<string, string>,
  fallbackId?: string
): Map<string, string> {
  if (fallbackId) {
    for (const desc of descriptions) {
      mapping.set(desc, fallbackId);
    }
  }
  return mapping;
}
