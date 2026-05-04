import { isCanonPathAllowed, readCanon } from "@/lib/aumm/canon";
import { tool } from "ai";
import { z } from "zod";

/** Keeps follow-up Groq requests smaller (still enough for precise cites). */
const MAX_TOOL_CONTENT_CHARS = 14_000;

/**
 * Use a plain string for `path`, not a huge z.enum of every corpus file.
 * Gemini and other providers often reject oversize function-call JSON schemas;
 * allowlist enforcement stays in `execute` via `isCanonPathAllowed` / `readCanon`.
 */
export function createReadAummReferenceTool() {
  return tool({
    description:
      "Load Aureum markdown from bundled corpus (vendor `references/` from submodule + optional repo `extras/…`). Set `path` to the exact string from the system prompt canon index (e.g. `10_constitution.md`, `sagix/decentralized_money.md`). Invalid paths return an error.",
    inputSchema: z.object({
      path: z
        .string()
        .min(1)
        .max(512)
        .describe(
          "Path as in canon index (`_canon.json` refs or `extras/…` supplementary files). Not a disk absolute path.",
        ),
    }),
    execute: async ({ path: relativePath }) => {
      if (!isCanonPathAllowed(relativePath)) {
        return {
          error:
            "Path not in merged canon allowlist — copy an exact `path` from the Canon file index in the system prompt (numbered refs, `sagix/…`, or `extras/…`).",
          path: relativePath.trim(),
        };
      }
      try {
        const { path: canonicalPath, content } = await readCanon(relativePath);
        if (content.length > MAX_TOOL_CONTENT_CHARS) {
          return {
            path: canonicalPath,
            content:
              content.slice(0, MAX_TOOL_CONTENT_CHARS) +
              "\n\n<!-- …truncated for context limit; ask for a narrower section or another path -->",
          };
        }
        return { path: canonicalPath, content };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {
          error: message,
          path: relativePath,
        };
      }
    },
  });
}
