import type { GatewayModelId } from "@ai-sdk/gateway";
import { createGateway } from "@ai-sdk/gateway";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export const META_LLAMA_4_SCOUT = "meta-llama/llama-4-scout-17b-16e-instruct" as const;
export const LLAMA_3_3_70B_VERSATILE = "llama-3.3-70b-versatile" as const;
export const GEMINI_2_5_FLASH_LITE = "gemini-2.5-flash-lite" as const;

export const OPENROUTER_GEMMA_4_31B = "openrouter-google-gemma-4-31b" as const;
export const OPENROUTER_GPT_OSS_120B = "openrouter-openai-gpt-oss-120b" as const;
export const OPENROUTER_NEMOTRON_3_SUPER = "openrouter-nvidia-nemotron-3-super" as const;
export const OPENROUTER_MINIMAX_M25 = "openrouter-minimax-m2.5" as const;

export const GATEWAY_OPENAI_GPT54 = "gateway-openai-gpt-5.4" as const;
export const GATEWAY_ANTHROPIC_HAIKU =
  "gateway-anthropic-claude-3.5-haiku" as const;

export type CoreModelId =
  | typeof LLAMA_3_3_70B_VERSATILE
  | typeof META_LLAMA_4_SCOUT
  | typeof GEMINI_2_5_FLASH_LITE;

const OPENROUTER_LOOKUP = {
  [OPENROUTER_GEMMA_4_31B]: "google/gemma-4-31b-it:free",
  [OPENROUTER_GPT_OSS_120B]: "openai/gpt-oss-120b:free",
  [OPENROUTER_NEMOTRON_3_SUPER]: "nvidia/nemotron-3-super-120b-a12b:free",
  [OPENROUTER_MINIMAX_M25]: "minimax/minimax-m2.5:free",
} as const;

export type OpenRouterFreeModelId = keyof typeof OPENROUTER_LOOKUP;

export type PremiumGatewayBucketId =
  | typeof GATEWAY_OPENAI_GPT54
  | typeof GATEWAY_ANTHROPIC_HAIKU;

export type modelID = CoreModelId | OpenRouterFreeModelId | PremiumGatewayBucketId;

const GATEWAY_LOOKUP = {
  [GATEWAY_OPENAI_GPT54]: "openai/gpt-5.4",
  [GATEWAY_ANTHROPIC_HAIKU]: "anthropic/claude-3.5-haiku",
} as const satisfies Record<PremiumGatewayBucketId, GatewayModelId>;

let memoizedGateway:
  | ReturnType<typeof createGateway>
  | null
  | "missing" = null;

export function gatewayProvider(): ReturnType<typeof createGateway> | undefined {
  if (memoizedGateway === "missing") return undefined;
  if (memoizedGateway) return memoizedGateway;

  const hasCred =
    Boolean(process.env.AI_GATEWAY_API_KEY?.trim()) ||
    Boolean(process.env.VERCEL_OIDC_TOKEN?.trim());

  if (!hasCred) {
    memoizedGateway = "missing";
    return undefined;
  }

  memoizedGateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });
  return memoizedGateway;
}

let memoizedOpenRouter:
  | ReturnType<typeof createOpenAI>
  | null
  | "missing" = null;

/** OpenAI-compatible client pointed at OpenRouter (`@ai-sdk/openai` + baseURL). */
export function openRouterProvider(): ReturnType<typeof createOpenAI> | undefined {
  if (memoizedOpenRouter === "missing") return undefined;
  if (memoizedOpenRouter) return memoizedOpenRouter;

  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    memoizedOpenRouter = "missing";
    return undefined;
  }

  const referer = process.env.OPENROUTER_HTTP_REFERER?.trim();
  const title = process.env.OPENROUTER_APP_TITLE?.trim() ?? "Aureum Chat";

  memoizedOpenRouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
    headers: {
      ...(referer ? { "HTTP-Referer": referer } : {}),
      "X-Title": title,
    },
  });
  return memoizedOpenRouter;
}

export function openRouterReady(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

function isGroqModelId(id: modelID): id is Exclude<CoreModelId, typeof GEMINI_2_5_FLASH_LITE> {
  return id === META_LLAMA_4_SCOUT || id === LLAMA_3_3_70B_VERSATILE;
}

function isPremiumGatewayBucket(id: modelID): id is PremiumGatewayBucketId {
  return (
    id === GATEWAY_OPENAI_GPT54 || id === GATEWAY_ANTHROPIC_HAIKU
  );
}

export function isOpenRouterModelId(id: modelID): id is OpenRouterFreeModelId {
  return Object.prototype.hasOwnProperty.call(OPENROUTER_LOOKUP, id);
}

/** AI Gateway slots stay in the list for transparency but cannot be chosen in the UI. */
export function isGatewayPickerSlot(id: modelID): boolean {
  return isPremiumGatewayBucket(id);
}

export function isGeminiModelAvailable(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

export interface ModelChoiceUI {
  id: modelID;
  label: string;
  subtitle?: string;
}

/**
 * Stable union — the API route rejects misconfigured premium slots with a 503
 * explaining which env vars to set, so hiding them client-side caused drift.
 */
export function MODEL_OPTIONS_UI(): ModelChoiceUI[] {
  return [
    {
      id: GEMINI_2_5_FLASH_LITE,
      label: "Gemini 2.5 · Flash‑Lite (default)",
      subtitle: "Google · live status loads from `/api/models`",
    },
    {
      id: OPENROUTER_GEMMA_4_31B,
      label: "Gemma 4 · 31B (free, OpenRouter)",
      subtitle: "OpenRouter · see `/api/models`",
    },
    {
      id: OPENROUTER_GPT_OSS_120B,
      label: "OpenAI gpt‑oss‑120b (free, OpenRouter)",
      subtitle: "OpenRouter · see `/api/models`",
    },
    {
      id: OPENROUTER_NEMOTRON_3_SUPER,
      label: "NVIDIA Nemotron 3 Super (free, OpenRouter)",
      subtitle: "OpenRouter · see `/api/models`",
    },
    {
      id: META_LLAMA_4_SCOUT,
      label: "Llama 4 · Scout · 17B (Groq)",
      subtitle: "Groq · high TPM quota",
    },
    {
      id: LLAMA_3_3_70B_VERSATILE,
      label: "Llama 3.3 · 70B (Groq)",
      subtitle: "Groq · status from `/api/models`",
    },
    {
      id: OPENROUTER_MINIMAX_M25,
      label: "MiniMax M2.5 (free, OpenRouter)",
      subtitle: "OpenRouter · see `/api/models`",
    },
    {
      id: GATEWAY_OPENAI_GPT54,
      label: "OpenAI GPT‑5.4 · AI Gateway",
      subtitle: "Premium · not selectable here",
    },
    {
      id: GATEWAY_ANTHROPIC_HAIKU,
      label: "Anthropic Claude 3.5 Haiku · AI Gateway",
      subtitle: "Premium · not selectable here",
    },
  ];
}

export const MODELS: modelID[] = MODEL_OPTIONS_UI().map((choice) => choice.id);

export function parseModelSelection(raw: string | undefined | null): modelID {
  const ids = MODELS as string[];
  if (typeof raw === "string" && ids.includes(raw)) {
    return raw as modelID;
  }
  return GEMINI_2_5_FLASH_LITE;
}

export const defaultModel: modelID = GEMINI_2_5_FLASH_LITE;

export function resolveLanguageModel(id: modelID): LanguageModel {
  if (isGroqModelId(id)) {
    return groq(id);
  }
  if (id === GEMINI_2_5_FLASH_LITE) {
    if (!isGeminiModelAvailable()) {
      throw new Error(
        "GEMINI_CHAT_MODEL_UNAVAILABLE — set GOOGLE_GENERATIVE_AI_API_KEY in `.env.local` or switch models.",
      );
    }
    return google(id);
  }
  if (isOpenRouterModelId(id)) {
    const client = openRouterProvider();
    if (!client) {
      throw new Error(
        "OPENROUTER_MODEL_UNAVAILABLE — set OPENROUTER_API_KEY or pick another model.",
      );
    }
    const slug = OPENROUTER_LOOKUP[id];
    return client.chat(slug);
  }
  if (!isPremiumGatewayBucket(id)) {
    throw new Error(`UNSUPPORTED_MODEL — ${String(id)}`);
  }

  const gw = gatewayProvider();
  if (!gw) {
    throw new Error(
      "AI_GATEWAY_MODEL_UNAVAILABLE — set AI_GATEWAY_API_KEY or authenticate AI Gateway/OIDC.",
    );
  }

  const gatewayModelId = GATEWAY_LOOKUP[id];
  return gw(gatewayModelId);
}
