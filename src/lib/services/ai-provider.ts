import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

type Provider = "openai" | "google";

const MODELS = {
  openai: () => openai("gpt-4o"),
  google: () => google("gemini-2.5-flash"),
} as const;

const GOOGLE_OPTIONS = {
  google: { thinkingConfig: { thinkingBudget: 0 } },
};

function getModels(primary: Provider) {
  const fallback: Provider = primary === "openai" ? "google" : "openai";
  return { primary: MODELS[primary](), fallback: MODELS[fallback]() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenerateTextOptions = Parameters<typeof generateText>[0] & { providerOptions?: any };

export async function generateTextWithFallback(
  primary: Provider,
  options: Omit<GenerateTextOptions, "model">
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const models = getModels(primary);
  const fallbackProvider: Provider = primary === "openai" ? "google" : "openai";

  try {
    return await generateText({
      ...options,
      model: models.primary,
      providerOptions: primary === "google" ? GOOGLE_OPTIONS : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  } catch (err) {
    console.warn(`[AI] ${primary} falhou, tentando ${fallbackProvider}...`, (err as Error).message);
    return await generateText({
      ...options,
      model: models.fallback,
      providerOptions: fallbackProvider === "google" ? GOOGLE_OPTIONS : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StreamTextOptions = Parameters<typeof streamText>[0] & { providerOptions?: any };

export async function streamTextWithFallback(
  primary: Provider,
  options: Omit<StreamTextOptions, "model">
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const models = getModels(primary);
  const fallbackProvider: Provider = primary === "openai" ? "google" : "openai";

  try {
    const result = streamText({
      ...options,
      model: models.primary,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    // Test if stream is working by awaiting the first response header
    return result;
  } catch (err) {
    console.warn(`[AI] ${primary} falhou no stream, tentando ${fallbackProvider}...`, (err as Error).message);
    return streamText({
      ...options,
      model: models.fallback,
      providerOptions: fallbackProvider === "google" ? GOOGLE_OPTIONS : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
}
