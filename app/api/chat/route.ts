import { createReadAummReferenceTool } from "@/ai/aumm-tools";
import { getModelProfile } from "@/ai/model-profile";
import { parseModelSelection, resolveLanguageModel } from "@/ai/providers";
import {
  aggregatedAssistantPlainText,
  logPotentiallyUngroundedResponse,
  pathsFromReferenceSteps,
} from "@/lib/aumm/chat-audit";
import { buildAummSystemPrompt, isEmbedCanonEnabled } from "@/lib/aumm/canon";
import { scheduleCanonGroundingVerifier } from "@/lib/aumm/grounding-verifier";
import { repairReadAummReferenceToolCall } from "@/lib/aumm/repair-malformed-tool-call";
import { refusalUiStreamResponse } from "@/lib/aumm/refusal-stream";
import { evaluateTopicGate, extractLastUserText } from "@/lib/aumm/topic-gate";
import { formatStreamChatError } from "@/lib/format-stream-chat-error";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

/** Allow streamed multi-step retrieves + verifier headroom across slower providers */
export const maxDuration = 60;

function prefersPortugueseUi(sample: string): boolean {
  if (!sample.trim()) return false;
  return /você|\bvocês\b|\bn[aã]o\b|[áàâãéêíóôõúç]/i.test(sample);
}

export async function POST(req: Request) {
  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = bodyUnknown as {
    messages?: UIMessage[];
    selectedModel?: unknown;
  };

  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: "messages[] required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = body.messages;

  /** Heuristic refusal before touching the corpus filesystem. */
  const lastPrompt = extractLastUserText(messages);
  const gate = evaluateTopicGate(lastPrompt);
  if (!gate.allowed) {
    const refusalBody = prefersPortugueseUi(lastPrompt)
      ? gate.messagePt
      : gate.messageEn;
    return refusalUiStreamResponse(messages, refusalBody);
  }

  const embedCanon = isEmbedCanonEnabled();
  const selectedModel = parseModelSelection(
    body.selectedModel as string | undefined,
  );
  const profile = getModelProfile(selectedModel);

  let systemPrompt: string;
  try {
    systemPrompt = buildAummSystemPrompt({
      suffix: profile.systemPromptSuffix,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AUMM skill corpus unavailable";
    console.error("[chat] Failed to load aumm-skill:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let languageModel;
  try {
    languageModel = resolveLanguageModel(selectedModel);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: detail }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tools = {
    readAummReference: createReadAummReferenceTool(),
  };

  const result = streamText({
    model: languageModel,
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    stopWhen: profile.stopWhen,
    maxRetries: 2,
    activeTools: ["readAummReference"],
    prepareStep: async ({ stepNumber }) => ({
      activeTools: ["readAummReference"],
      toolChoice: profile.toolChoiceForStep(stepNumber, embedCanon),
    }),
    ...(profile.providerOptions
      ? { providerOptions: profile.providerOptions }
      : {}),
    temperature: 0,
    tools,
    experimental_repairToolCall: repairReadAummReferenceToolCall,
    experimental_telemetry: {
      isEnabled: false,
    },
    async onFinish({ steps }) {
      const canonPathsUsed = pathsFromReferenceSteps(steps);
      await logPotentiallyUngroundedResponse({
        steps,
        aggregatedTextLength: aggregatedAssistantPlainText(steps).length,
        successfulCanonPathsCount: canonPathsUsed.length,
      });
      scheduleCanonGroundingVerifier({
        steps,
        modelLabel: selectedModel,
      });
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    sendReasoning: false,
    onError: (error: unknown) => {
      console.error("[chat] stream error (raw):", error);
      return formatStreamChatError(error, selectedModel);
    },
  });
}
