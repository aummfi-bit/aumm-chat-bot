import type { ToolCallRepairFunction } from "ai";
import { createReadAummReferenceTool } from "@/ai/aumm-tools";

type AummTools = {
  readAummReference: ReturnType<typeof createReadAummReferenceTool>;
};

/**
 * Groq / Llama sometimes emit the function name and JSON args concatenated into
 * `toolName`, which makes Groq reject the call ("not in request.tools").
 * Split and normalize so the SDK can execute `readAummReference`.
 */
export const repairReadAummReferenceToolCall: ToolCallRepairFunction<
  AummTools
> = async ({ toolCall }) => {
  const raw = toolCall.toolName;
  if (typeof raw !== "string") return null;
  if (!raw.startsWith("readAummReference")) return null;

  const brace = raw.indexOf("{");
  if (brace !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(brace)) as { path?: unknown };
      if (typeof parsed.path === "string") {
        return {
          type: "tool-call",
          toolCallId: toolCall.toolCallId,
          toolName: "readAummReference",
          input: JSON.stringify({ path: parsed.path }),
        };
      }
    } catch {
      return null;
    }
  }

  return null;
};
