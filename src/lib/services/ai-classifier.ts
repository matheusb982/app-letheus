import { generateTextWithFallback } from "./ai-provider";
import { matchRules, getFewShotExamples } from "./classification-rules";

interface SubcategoryOption {
  id: string;
  name: string;
}

export async function classifyWithAI(
  descriptions: string[],
  subcategories: SubcategoryOption[],
  userId?: string,
  periodId?: string,
  familyId?: string
): Promise<Map<string, string>> {
  const mapping = new Map<string, string>();

  if (descriptions.length === 0 || subcategories.length === 0) {
    return mapping;
  }

  const fallbackId = subcategories.find((s) =>
    s.name.toLowerCase().includes("outros")
  )?.id;

  // Step 1: Tentar match por regras manuais
  let remaining = [...descriptions];

  if (userId) {
    const ruleMatches = await matchRules(descriptions, userId, familyId);
    for (const [desc, match] of ruleMatches) {
      // Verificar se a subcategoria da regra ainda existe
      const valid = subcategories.find((s) => s.id === match.subcategoryId);
      if (valid) {
        mapping.set(desc, match.subcategoryId);
        remaining = remaining.filter((d) => d !== desc);
      }
    }
  }

  // Se todas foram classificadas por regras, retorna
  if (remaining.length === 0) {
    return mapping;
  }

  // Step 2: Buscar exemplos few-shot do histórico
  let fewShotBlock = "";
  if (userId && periodId) {
    const examples = await getFewShotExamples(userId, periodId, familyId);
    if (examples.length > 0) {
      fewShotBlock = `\nExemplos de classificações anteriores deste usuário (use como referência):
${examples.map((e) => `- "${e.description}" → ${e.subcategory_name}`).join("\n")}
`;
    }
  }

  // Step 3: Classificar o restante com IA
  const subcatList = subcategories
    .map((s) => `${s.id}: ${s.name}`)
    .join("\n");

  const descList = remaining
    .map((d, i) => `${i}: ${d}`)
    .join("\n");

  const prompt = `Você é um classificador de despesas financeiras pessoais.

Subcategorias disponíveis (ID: Nome):
${subcatList}
${fewShotBlock}
Despesas para classificar (índice: categoria_csv|descrição):
${descList}

REGRAS IMPORTANTES (siga na ordem de prioridade):
1. Use SEMPRE o nome da subcategoria mais específica que corresponda à despesa.
2. Restaurantes, churrascarias, pizzarias, bistrôs, bares, pubs, casas noturnas, baladas, cervejarias → Bares/Festas/Restaurantes.
3. Delivery e apps de comida (iFood, Rappi, Uber Eats, Zé Delivery) → subcategoria de Delivery se existir, senão Refeição.
4. Comércios de comida (COMERCIO DE, empório, rotisserie, marmitaria, quentinha) → Refeição, NÃO Bares/Restaurantes.
5. Lanchonetes, fast-food, espetinhos, food trucks → Refeição.
6. UBER, 99, taxi, Cabify → Transporte.
7. Supermercado, mercado, atacadão, atacadista → Supermercado/Mercado.
8. Padaria, panificadora, confeitaria → subcategoria de Padaria ou Alimentação.
9. Farmácia, drogaria, drogas → Saúde/Farmácia.
10. Gasolina, combustível, posto, Shell, Ipiranga, BR → Combustível.
11. Estacionamento, parking, estapar → Estacionamento.
12. Se já existir um exemplo anterior idêntico ou muito similar, use a MESMA subcategoria.
13. Se não souber classificar com certeza, use "Outros".

Responda APENAS com um JSON no formato: {"0": "subcategory_id", "1": "subcategory_id", ...}
Onde a chave é o índice da despesa e o valor é o ID da subcategoria correspondente.`;

  try {
    const { text } = await generateTextWithFallback("google", {
      prompt,
      temperature: 0.1,
      maxOutputTokens: 4096,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return applyFallback(remaining, mapping, fallbackId);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;

    for (const [indexStr, subcatId] of Object.entries(parsed)) {
      const index = parseInt(indexStr);
      if (index >= 0 && index < remaining.length) {
        mapping.set(remaining[index], subcatId);
      }
    }

    return mapping;
  } catch {
    return applyFallback(remaining, mapping, fallbackId);
  }
}

function applyFallback(
  descriptions: string[],
  mapping: Map<string, string>,
  fallbackId?: string
): Map<string, string> {
  if (fallbackId) {
    for (const desc of descriptions) {
      if (!mapping.has(desc)) {
        mapping.set(desc, fallbackId);
      }
    }
  }
  return mapping;
}
