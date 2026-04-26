import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

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
type StreamTextOptions = Parameters<typeof streamText>[0] & { providerOptions?: any; onFinish?: (args: { text: string }) => Promise<void> | void };

async function tryStreamToController(
  model: LanguageModel,
  provider: Provider,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: Omit<StreamTextOptions, "model" | "onFinish"> & { [key: string]: any },
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
): Promise<string> {
  const result = streamText({
    ...options,
    model,
    providerOptions: provider === "google" ? GOOGLE_OPTIONS : undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  let fullText = "";
  for await (const chunk of result.textStream) {
    fullText += chunk;
    controller.enqueue(encoder.encode(chunk));
  }
  return fullText;
}

// Returns a streaming Response directly.
// streamText() does not throw synchronously on API errors — errors only surface
// when consuming the stream. This wrapper reads both providers' streams manually
// so the fallback actually fires on failure.
export async function streamTextWithFallback(
  primary: Provider,
  options: Omit<StreamTextOptions, "model">
): Promise<Response> {
  const models = getModels(primary);
  const fallbackProvider: Provider = primary === "openai" ? "google" : "openai";
  const { onFinish, ...streamOptions } = options;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = "";
      try {
        fullText = await tryStreamToController(models.primary, primary, streamOptions, controller, encoder);
      } catch (primaryErr) {
        console.warn(`[AI] ${primary} falhou, tentando ${fallbackProvider}...`, (primaryErr as Error).message);
        try {
          fullText = await tryStreamToController(models.fallback, fallbackProvider, streamOptions, controller, encoder);
        } catch (fallbackErr) {
          console.error(`[AI] ${fallbackProvider} também falhou:`, (fallbackErr as Error).message);
          controller.error(fallbackErr);
          return;
        }
      }

      if (onFinish && fullText) {
        try {
          await onFinish({ text: fullText });
        } catch (err) {
          console.error("[AI] onFinish falhou:", (err as Error).message);
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
