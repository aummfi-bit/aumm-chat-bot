import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import {
  aggregatedAssistantPlainText,
} from "@/lib/aumm/chat-audit";

/** Minimal structural hooks so we avoid fighting strict StepResult generics. */
type LooseToolStep = {
  text?: string;
  toolResults?: unknown;
};

/**
 * Best-effort post-hoc check (does not mutate the streamed user response).
 * Enable with \`AUMM_VERIFIER=1\` and \`GOOGLE_GENERATIVE_AI_API_KEY\`.
 */
export function scheduleCanonGroundingVerifier(options: {
  steps: ReadonlyArray<LooseToolStep>;
  modelLabel: string;
}): void {
  if (process.env.AUMM_VERIFIER !== "1") return;
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    console.warn(
      "[verifier] AUMM_VERIFIER=1 set but GOOGLE_GENERATIVE_AI_API_KEY missing — skipping.",
    );
    return;
  }

  void (async () => {
    try {
      await runVerifier(options.steps, options.modelLabel);
    } catch (e) {
      console.warn(
        "[verifier] failed:",
        e instanceof Error ? e.message : String(e),
      );
    }
  })();
}

async function runVerifier(
  steps: ReadonlyArray<LooseToolStep>,
  modelLabel: string,
): Promise<void> {
  const assistant = aggregatedAssistantPlainText(steps).trim();
  if (assistant.length < 120) return;

  let canonEvidence = "";
  const resultsFlat = flattenToolResults(steps);
  for (const item of resultsFlat) {
    if (item.toolName !== "readAummReference") continue;
    const o = item.output as
      | { path?: unknown; content?: unknown; error?: unknown }
      | undefined;
    if (
      typeof o?.path !== "string" ||
      o.error !== undefined ||
      typeof o.content !== "string"
    ) {
      continue;
    }

    canonEvidence += `\n\n--- SOURCE ${o.path} ---\n${o.content}`;
  }

  if (canonEvidence.length < 120) return;

  const { text } = await generateText({
    model: google("gemini-2.5-flash-lite"),
    temperature: 0,
    prompt: `
You audit whether an assistant paragraph is FULLY grounded in SOURCE markdown.

Rules:
- List concrete sentences or factual claims present in ASSISTANT that are NOT explicitly supported by SOURCE (paraphrasing is OK ONLY if verbatim meaning exists in SOURCE).
- Ignore boilerplate disclaimers directing users to https://aumm.fi if they avoid extra facts.
- If everything substantive is grounded, reply EXACTLY: OK

MODEL used: ${modelLabel}

SOURCES:${canonEvidence}

ASSISTANT:
${assistant}
`.trim(),
  });

  const verdict = text.trim();
  if (verdict === "OK" || /\bOK\b/.test(verdict)) return;
  console.warn("[verifier] possible unsupported claims detected:\n", verdict);
}

function flattenToolResults(
  steps: ReadonlyArray<LooseToolStep>,
): { toolName?: string; output?: unknown }[] {
  const out: { toolName?: string; output?: unknown }[] = [];
  for (const step of steps) {
    const trs = Array.isArray(step.toolResults)
      ? (step.toolResults as { toolName?: string; output?: unknown }[])
      : [];
    for (const item of trs) {
      out.push(item);
    }
  }
  return out;
}
