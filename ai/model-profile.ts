import {
  GATEWAY_ANTHROPIC_HAIKU,
  GATEWAY_OPENAI_GPT54,
  GEMINI_2_5_FLASH_LITE,
  LLAMA_3_3_70B_VERSATILE,
  META_LLAMA_4_SCOUT,
  type modelID,
} from "@/ai/providers";
import type { ProviderOptions } from "@ai-sdk/provider-utils";
import { stepCountIs, type StopCondition } from "ai";

/** Appended for Gemini Flash-Lite; reduces early summarisation without naming specific corpus paths. */
export const GEMINI_RETRIEVAL_DISCIPLINE_SUFFIX = `
## RETRIEVAL DISCIPLINE
Before writing any user-facing prose, call \`readAummReference\` at least TWICE
on DIFFERENT files from the Canon file index above. If your retrieved files
do not directly state the answer, retrieve more — do NOT fall back to general
DeFi knowledge. When the question names protocol-specific terms (token tickers,
section ids, immutable parameters), the index entry mentioning that term is
authoritative.
`.trim();

export type ToolChoiceSchedule =
  | "auto"
  | { type: "tool"; toolName: "readAummReference" };

export type ModelProfile = {
  id: modelID;
  /** Passed through to streamText.providerOptions when set. */
  providerOptions?: ProviderOptions;
  stopWhen: StopCondition<any>;
  toolChoiceForStep: (
    stepNumber: number,
    embedCanon: boolean,
  ) => ToolChoiceSchedule;
  systemPromptSuffix?: string;
};

const forcedReadAummTool: Extract<
  ToolChoiceSchedule,
  { type: "tool" }
> = {
  type: "tool",
  toolName: "readAummReference",
};

function defaultToolChoiceForStep(
  stepNumber: number,
  embedCanon: boolean,
): ToolChoiceSchedule {
  if (embedCanon) return "auto";
  return stepNumber === 0 ? forcedReadAummTool : "auto";
}

function geminiToolChoiceForStep(
  stepNumber: number,
  embedCanon: boolean,
): ToolChoiceSchedule {
  if (embedCanon) return "auto";
  if (stepNumber === 0 || stepNumber === 1) return forcedReadAummTool;
  return "auto";
}

const GEMINI_PROVIDER_OPTIONS = {
  google: {
    thinkingConfig: { thinkingBudget: 1024, includeThoughts: false },
    toolConfig: {
      functionCallingConfig: { mode: "AUTO" as const },
    },
  },
} satisfies ProviderOptions;

/** Per-model knobs for streamText — expand here instead of branching in route.ts. */
export function getModelProfile(id: modelID): ModelProfile {
  switch (id) {
    case GEMINI_2_5_FLASH_LITE:
      return {
        id,
        providerOptions: GEMINI_PROVIDER_OPTIONS,
        stopWhen: stepCountIs(12),
        toolChoiceForStep: geminiToolChoiceForStep,
        systemPromptSuffix: GEMINI_RETRIEVAL_DISCIPLINE_SUFFIX,
      };
    case META_LLAMA_4_SCOUT:
      return {
        id,
        providerOptions: { groq: { parallelToolCalls: false as const } },
        stopWhen: stepCountIs(8),
        toolChoiceForStep: defaultToolChoiceForStep,
      };
    case LLAMA_3_3_70B_VERSATILE:
      return {
        id,
        providerOptions: { groq: { parallelToolCalls: true as const } },
        stopWhen: stepCountIs(8),
        toolChoiceForStep: defaultToolChoiceForStep,
      };
    case GATEWAY_OPENAI_GPT54:
    case GATEWAY_ANTHROPIC_HAIKU:
      return {
        id,
        stopWhen: stepCountIs(8),
        toolChoiceForStep: defaultToolChoiceForStep,
      };
    default: {
      const _exhaustive: never = id;
      throw new Error(`UNHANDLED_MODEL — ${String(_exhaustive)}`);
    }
  }
}
