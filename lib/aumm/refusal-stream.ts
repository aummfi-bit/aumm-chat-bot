import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";

/**
 * Zero-cost deterministic assistant stream for heuristic refusals.
 */
export function refusalUiStreamResponse(
  originalMessages: UIMessage[],
  refusalBody: string,
): Response {
  const stream = createUIMessageStream({
    originalMessages,
    execute: ({ writer }) => {
      const id = crypto.randomUUID();
      const textPartId = "refusal-" + id;
      writer.write({ type: "start", messageId: id });
      writer.write({ type: "text-start", id: textPartId });
      writer.write({ type: "text-delta", id: textPartId, delta: refusalBody });
      writer.write({ type: "text-end", id: textPartId });
      writer.write({ type: "finish" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
