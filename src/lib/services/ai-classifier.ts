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

  const prompt = `Você é um classificador de despesas financeiras pessoais.

Subcategorias disponíveis (ID: Nome):
${subcatList}

Despesas para classificar (índice: categoria_csv|descrição):
${descList}

REGRAS IMPORTANTES (siga na ordem de prioridade):
1. Use SEMPRE o nome da subcategoria mais específica que corresponda à despesa.
2. Restaurantes (LTDA, ME, EIRELI com nomes de restaurantes, churrascarias, pizzarias, bistrôs) → se existir subcategoria com "Restaurante" no nome, use ela. Caso contrário, use "Refeição" ou similar.
3. Delivery e apps de comida (iFood, Rappi, Uber Eats, Zé Delivery) → subcategoria de Delivery se existir, senão Refeição.
4. Comércios de comida (COMERCIO DE, empório, rotisserie, marmitaria, quentinha) → Refeição, NÃO Bares/Restaurantes.
5. Bares, baladas, casas noturnas, cervejarias artesanais → Bares/Festas/Restaurantes.
6. UBER, 99, taxi, Cabify → Transporte.
7. Supermercado, mercado, atacadão, atacadista → Supermercado/Mercado.
8. Padaria, panificadora, confeitaria → subcategoria de Padaria ou Alimentação.
9. Farmácia, drogaria, drogas → Saúde/Farmácia.
10. Gasolina, combustível, posto, Shell, Ipiranga, BR → Combustível.
11. Estacionamento, parking, estapar → Estacionamento.
12. Se não souber classificar com certeza, use "Outros".

Responda APENAS com um JSON no formato: {"0": "subcategory_id", "1": "subcategory_id", ...}
Onde a chave é o índice da despesa e o valor é o ID da subcategoria correspondente.`;

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      providerOptions: {
        google: { thinkingConfig: { thinkingBudget: 0 } },
      },
      prompt,
      temperature: 0.1,
      maxOutputTokens: 4096,
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
