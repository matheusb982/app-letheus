/**
 * Sanitization utilities for AI prompts.
 * Prevents prompt injection, controls input size, and validates AI output.
 */

const MAX_CHAT_MESSAGE_LENGTH = 2000;
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_CSV_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TEXT_IMPORT_LENGTH = 50_000; // 50KB

/**
 * Remove caracteres de controle e sequências que podem ser usadas para prompt injection.
 * Preserva acentos, emojis e pontuação normal.
 */
function stripControlChars(input: string): string {
  // Remove caracteres de controle (exceto newline e tab)
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Sanitiza mensagem de chat do usuário.
 * Limita tamanho e remove caracteres perigosos.
 */
export function sanitizeChatMessage(message: string): string {
  const cleaned = stripControlChars(message).trim();
  if (cleaned.length > MAX_CHAT_MESSAGE_LENGTH) {
    return cleaned.slice(0, MAX_CHAT_MESSAGE_LENGTH);
  }
  return cleaned;
}

/**
 * Sanitiza descrição de despesa para uso em prompt de classificação.
 * Limita tamanho e remove caracteres que podem quebrar o formato do prompt.
 */
export function sanitizeDescription(description: string): string {
  const cleaned = stripControlChars(description)
    .replace(/[\r\n]+/g, " ") // remove quebras de linha (evita injection via newline)
    .trim();
  if (cleaned.length > MAX_DESCRIPTION_LENGTH) {
    return cleaned.slice(0, MAX_DESCRIPTION_LENGTH);
  }
  return cleaned;
}

/**
 * Valida tamanho de arquivo CSV.
 */
export function validateCSVFileSize(size: number): string | null {
  if (size > MAX_CSV_FILE_SIZE) {
    return `Arquivo muito grande (${(size / 1024 / 1024).toFixed(1)}MB). Limite: 5MB.`;
  }
  return null;
}

/**
 * Valida tamanho de texto importado.
 */
export function validateTextImportSize(text: string): string | null {
  if (text.length > MAX_TEXT_IMPORT_LENGTH) {
    return `Texto muito grande (${(text.length / 1024).toFixed(0)}KB). Limite: 50KB.`;
  }
  return null;
}

/**
 * Valida que IDs retornados pela IA existem na lista de subcategorias válidas.
 * Retorna apenas os mapeamentos com IDs válidos.
 */
export function validateSubcategoryIds(
  parsed: Record<string, string>,
  validIds: Set<string>,
  fallbackId?: string
): Record<string, string> {
  const validated: Record<string, string> = {};
  for (const [key, subcatId] of Object.entries(parsed)) {
    if (validIds.has(subcatId)) {
      validated[key] = subcatId;
    } else if (fallbackId) {
      validated[key] = fallbackId;
    }
  }
  return validated;
}
