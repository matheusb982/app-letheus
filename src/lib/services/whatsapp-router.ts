/**
 * WhatsApp message router — classifies user intent and routes to appropriate handler.
 * Uses regex heuristics first, falling back to AI for ambiguous messages.
 */

import { generateTextWithFallback } from "@/lib/services/ai-provider";

export type MessageIntent =
  | "expense_add"
  | "financial_question"
  | "confirm_yes"
  | "confirm_no"
  | "greeting"
  | "help"
  | "unknown";

// Patterns that strongly indicate an expense
const EXPENSE_PATTERNS = [
  /R\$\s*[\d.,]+/i,                          // R$ 15,00
  /\d+[.,]\d{2}\s*(reais|real)/i,            // 15,00 reais
  /\d+\s*(reais|real|conto|contos)/i,        // 15 reais
  /^[a-záàãâéêíóôõúç\s]+(r\$|reais|\d)/i,   // "Café R$15" or "Café 15"
];

// Patterns for value extraction (used to confirm it's an expense)
const VALUE_PATTERN = /(?:R\$\s*)?(\d{1,6}[.,]\d{2})|\b(\d{1,6})\s*(?:reais|real)/i;

// Confirmation patterns
const YES_PATTERNS = [/^s(im)?$/i, /^ok$/i, /^isso$/i, /^confirma/i, /^pode/i, /^salva/i];
const NO_PATTERNS = [/^n(ao|ão)?$/i, /^cancela/i, /^nope$/i, /^errado/i, /^corrig/i];

// Greeting patterns
const GREETING_PATTERNS = [/^(oi|ola|olá|hey|eai|e ai|bom dia|boa tarde|boa noite|fala)\b/i];

// Help patterns
const HELP_PATTERNS = [/^(ajuda|help|menu|comandos|como funciona|o que voce faz)\b/i];

/**
 * Classify message intent using regex heuristics.
 * Returns null if ambiguous (needs AI classification).
 */
function classifyByRegex(text: string): MessageIntent | null {
  const trimmed = text.trim();

  // Check confirmations first (short messages)
  if (trimmed.length <= 20) {
    if (YES_PATTERNS.some((p) => p.test(trimmed))) return "confirm_yes";
    if (NO_PATTERNS.some((p) => p.test(trimmed))) return "confirm_no";
  }

  // Greetings
  if (GREETING_PATTERNS.some((p) => p.test(trimmed))) return "greeting";

  // Help
  if (HELP_PATTERNS.some((p) => p.test(trimmed))) return "help";

  // Check expense patterns — must also have a value-like number
  const hasExpensePattern = EXPENSE_PATTERNS.some((p) => p.test(trimmed));
  const hasValue = VALUE_PATTERN.test(trimmed);

  if (hasExpensePattern && hasValue && trimmed.length < 100) {
    return "expense_add";
  }

  // Question patterns (interrogative words, question marks)
  const isQuestion =
    /\?/.test(trimmed) ||
    /^(quanto|qual|quais|como|onde|quando|por ?que|quem)\b/i.test(trimmed) ||
    /\b(gastei|gasto|sobrou|saldo|receita|despesa|meta|patrimonio|balanco)\b/i.test(trimmed);

  if (isQuestion) return "financial_question";

  return null;
}

/**
 * Classify message intent using AI (fallback for ambiguous messages).
 */
async function classifyByAI(text: string): Promise<MessageIntent> {
  try {
    const { text: response } = await generateTextWithFallback("openai", {
      prompt: `Classifique a intencao desta mensagem de WhatsApp em um app financeiro.
Opcoes: expense_add (usuario quer registrar um gasto), financial_question (pergunta sobre financas), greeting (saudacao), help (pede ajuda), unknown (outro).

Mensagem: "${text}"

Responda APENAS com uma das opcoes acima, sem explicacao.`,
      temperature: 0,
      maxOutputTokens: 20,
    });

    const intent = response.trim().toLowerCase() as MessageIntent;
    const validIntents: MessageIntent[] = ["expense_add", "financial_question", "greeting", "help", "unknown"];
    return validIntents.includes(intent) ? intent : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Classify a WhatsApp message's intent.
 * Uses regex first for speed/cost, then AI for ambiguous messages.
 */
export async function classifyIntent(text: string): Promise<MessageIntent> {
  const regexResult = classifyByRegex(text);
  if (regexResult) return regexResult;

  return classifyByAI(text);
}
