import { APICallError } from "ai";

/**
 * Human-readable SSE error string for UI toasts (`toUIMessageStreamResponse` → `error.message`).
 */
export function formatStreamChatError(error: unknown, modelHint?: string): string {
  const dev = process.env.NODE_ENV === "development";
  const slice = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

  const baseMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return String(error);
            }
          })();

  if (APICallError.isInstance(error)) {
    const tagParts = [...providerTagPieces(error.url), httpStatusPiece(error)].filter(
      Boolean,
    );
    if (modelHint?.includes("gemini")) tagParts.unshift("gemini.route");
    if (modelHint?.startsWith?.("gateway-")) tagParts.unshift("gateway.route");
    const tag = tagParts.filter(Boolean).join(".") || "provider";

    const bodyHint = shortenResponseBodySnippet(error.responseBody);
    const devBundle = `${tag} ${error.message}${bodyHint ? ` | body: ${bodyHint}` : ""}`;
    const prodPieces = [`[${tag}]`, slice(error.message, 220)];
    if (bodyHint) prodPieces.push(slice(bodyHint, 120));

    return dev ? slice(devBundle, 1200) : prodPieces.filter(Boolean).join(" — ");
  }

  const lower = baseMessage.toLowerCase();
  if (lower.includes("rate limit"))
    return "Rate limit exceeded. Please try again later.";
  if (lower.includes("failed to call a function")) {
    return dev
      ? slice(baseMessage, 800)
      : "Tool-calling upstream error (`failed to call a function`). Retry or switch model.";
  }
  if (lower.includes("tool call validation failed")) {
    return dev
      ? slice(baseMessage, 800)
      : "Tool schema rejected by provider (`tool call validation`). Try Groq Llama 3.3.";
  }

  return dev ? slice(baseMessage, 1200) : slice(baseMessage, 360);
}

function httpStatusPiece(e: APICallError): string {
  const sc = e.statusCode;
  if (sc === 402) return "billing";
  if (sc === 401 || sc === 403) return "auth";
  if (sc === 429) return "rate_limit";
  if (typeof sc === "number") return String(sc);
  return "";
}

function providerTagPieces(url: string): string[] {
  const u = url.toLowerCase();
  const tags: string[] = [];
  if (/generativelanguage|googleapis.*generative/.test(u)) tags.push("google");
  if (/groq/i.test(u)) tags.push("groq");
  if (/ai-gateway|vercel\.sh\/v1\/ai/i.test(u)) tags.push("gateway");
  return tags;
}

function shortenResponseBodySnippet(body: string | undefined): string | undefined {
  if (!body) return undefined;
  const trimmed = body.trim();
  if (!trimmed) return undefined;
  try {
    const j = JSON.parse(trimmed) as {
      error?: { code?: number; message?: string; status?: string };
    };
    const msg = j.error?.message;
    const code = j.error?.code ?? j.error?.status;
    if (msg || code) return [code, msg].filter(Boolean).join(": ");
  } catch {
    /* fall through */
  }
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}
