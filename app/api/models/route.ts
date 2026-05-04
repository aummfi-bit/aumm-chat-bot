import {
  GATEWAY_ANTHROPIC_HAIKU,
  GATEWAY_OPENAI_GPT54,
  GEMINI_2_5_FLASH_LITE,
  isGeminiModelAvailable,
  LLAMA_3_3_70B_VERSATILE,
  META_LLAMA_4_SCOUT,
  MODEL_OPTIONS_UI,
  OPENROUTER_GEMMA_4_31B,
  OPENROUTER_GPT_OSS_120B,
  OPENROUTER_MINIMAX_M25,
  OPENROUTER_NEMOTRON_3_SUPER,
  openRouterReady,
  type modelID,
} from "@/ai/providers";

import type { ModelsApiPayload, ModelsApiOption } from "@/lib/models-contract";

export const dynamic = "force-dynamic";

function groqReady(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

/** Server-side provisioning truth for picker + disabled `<SelectItem>`. */
function describeModel(id: modelID): Pick<
  ModelsApiOption,
  "available" | "selectable" | "requirement" | "note"
> {
  switch (id) {
    case LLAMA_3_3_70B_VERSATILE:
    case META_LLAMA_4_SCOUT: {
      const ok = groqReady();
      return ok
        ? { available: true, note: "Groq" }
        : {
            available: false,
            requirement: "GROQ_API_KEY",
          };
    }
    case GEMINI_2_5_FLASH_LITE: {
      const ok = isGeminiModelAvailable();
      return ok
        ? {
            available: true,
            note: "Google Generative AI (`GOOGLE_GENERATIVE_AI_API_KEY` present)",
          }
        : {
            available: false,
            requirement: "GOOGLE_GENERATIVE_AI_API_KEY",
          };
    }
    case OPENROUTER_GEMMA_4_31B:
    case OPENROUTER_GPT_OSS_120B:
    case OPENROUTER_NEMOTRON_3_SUPER:
    case OPENROUTER_MINIMAX_M25: {
      const ok = openRouterReady();
      return ok
        ? {
            available: true,
            note: "OpenRouter (`OPENROUTER_API_KEY` present)",
          }
        : {
            available: false,
            requirement: "OPENROUTER_API_KEY",
          };
    }
    case GATEWAY_OPENAI_GPT54:
    case GATEWAY_ANTHROPIC_HAIKU:
      return {
        available: false,
        selectable: false,
        note: "Premium (AI Gateway) — not selectable in this app",
      };
  }
}

export async function GET(): Promise<Response> {
  const payload: ModelsApiPayload = {
    options: MODEL_OPTIONS_UI().map(({ id, label }) => ({
      id,
      label,
      ...describeModel(id),
    })),
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
