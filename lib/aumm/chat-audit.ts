import { appendFile, mkdir } from "fs/promises";
import path from "path";

type ReadToolOutput = {
  path?: unknown;
  error?: unknown;
  content?: unknown;
};

type LooseToolStep = {
  text?: string;
  toolResults?: unknown;
};

/** Successful readAummReference paths aggregated across agent steps. */
export function pathsFromReferenceSteps(steps: ReadonlyArray<LooseToolStep>): string[] {
  const set = new Set<string>();
  for (const step of steps) {
    const results =
      Array.isArray(step.toolResults) && step.toolResults
        ? (step.toolResults as { toolName?: string; output?: unknown }[])
        : [];
    for (const tr of results) {
      if (tr.toolName !== "readAummReference") continue;
      const o = tr.output as ReadToolOutput | undefined;
      if (typeof o?.path !== "string" || o?.error !== undefined) continue;
      set.add(o.path as string);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function aggregatedAssistantPlainText(
  steps: ReadonlyArray<{ text?: string | undefined }>,
): string {
  return steps.map((s) => (s.text ?? "").trim()).filter(Boolean).join("\n\n");
}

/** Developer warning + optional NDJSON audit when we emitted text without any successful canon read. */
export async function logPotentiallyUngroundedResponse(options: {
  steps: ReadonlyArray<LooseToolStep>;
  aggregatedTextLength: number;
  successfulCanonPathsCount: number;
}): Promise<void> {
  const toolHits = options.successfulCanonPathsCount;
  const txtLen = options.aggregatedTextLength;
  if (toolHits > 0 || txtLen <= 200) return;

  const detail =
    `[chat-audit] assistant finished with ~${txtLen} chars text and ZERO successful readAummReference calls — likely hallucination.`;
  console.warn(detail);

  if (process.env.NODE_ENV !== "development") return;

  try {
    const dir = path.join(process.cwd(), "data");
    const file = path.join(dir, "hallucination-audit.jsonl");
    await mkdir(dir, { recursive: true });
    await appendFile(
      file,
      JSON.stringify({
        at: new Date().toISOString(),
        aggregatedTextChars: txtLen,
      }) + "\n",
      "utf8",
    );
  } catch {
    /* best-effort */
  }
}
