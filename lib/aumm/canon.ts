import { existsSync, readFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

const SKILL_ROOT = path.join(process.cwd(), "vendor", "aumm-skill");
const REFERENCES_DIR = path.join(SKILL_ROOT, "references");
const CANON_JSON_PATH = path.join(REFERENCES_DIR, "_canon.json");
/** Repo-owned supplementary snapshots (never removed by submodule updates). */
const EXTRAS_ROOT = path.join(process.cwd(), "corpus", "extras");
const EXTRAS_JSON_PATH = path.join(EXTRAS_ROOT, "_extras.json");

type CanonLockfile = {
  canon_sha: string;
  generated_at: string;
  source_repo: string;
  files: string[];
};

type ExtrasManifest = {
  description?: string;
  files?: string[];
};

let canonCache: {
  allowlist: Set<string>;
  lockfile: CanonLockfile;
  extraPaths: readonly string[];
} | null = null;

function submoduleMissingMessage(): string {
  return "vendor/aumm-skill missing or uninitialized. Run: git submodule update --init --recursive";
}

export function normalizeCanonPath(relativePath: string): string | null {
  const trimmed = relativePath.trim();
  if (!trimmed || trimmed.includes("..")) return null;
  const posix = trimmed.replace(/\\/g, "/");
  if (posix.startsWith("/")) return null;
  return posix;
}

function loadExtraPathsSync(): readonly string[] {
  if (!existsSync(EXTRAS_JSON_PATH)) {
    return [];
  }
  const raw = readFileSync(EXTRAS_JSON_PATH, "utf8");
  const manifest = JSON.parse(raw) as ExtrasManifest;
  if (!Array.isArray(manifest.files)) {
    return [];
  }
  const out: string[] = [];
  for (const entry of manifest.files) {
    const n = normalizeCanonPath(String(entry ?? ""));
    if (
      !n ||
      !n.startsWith("extras/") ||
      n === "extras" ||
      n.includes("/../") ||
      n.endsWith("/_extras.json")
    ) {
      continue;
    }
    out.push(n);
  }
  return [...new Set(out)];
}

function mergedCanonPathsOrdered(lockfilePaths: readonly string[]): string[] {
  const { extraPaths } = canonCache!;
  const merged = [...lockfilePaths, ...extraPaths];
  return [...new Set(merged)].sort((a, b) => a.localeCompare(b));
}

function loadCanonMetaSync(): {
  allowlist: Set<string>;
  lockfile: CanonLockfile;
  extraPaths: readonly string[];
} {
  if (canonCache) return canonCache;
  if (!existsSync(CANON_JSON_PATH)) {
    throw new Error(submoduleMissingMessage());
  }
  const raw = readFileSync(CANON_JSON_PATH, "utf8");
  const lockfile = JSON.parse(raw) as CanonLockfile;
  if (!Array.isArray(lockfile.files)) {
    throw new Error("Invalid _canon.json: missing files array");
  }

  cachedCanonPathEnum = null;
  const extraPaths = loadExtraPathsSync();

  canonCache = {
    allowlist: new Set([...lockfile.files, ...extraPaths]),
    lockfile,
    extraPaths,
  };
  return canonCache;
}

let cachedCanonPathEnum: [string, ...string[]] | null = null;

/** Paths from merged `_canon.json` + `corpus/extras/_extras.json` (strict tool schema when used). */
export function getCanonPathsEnum(): [string, ...string[]] {
  if (cachedCanonPathEnum) return cachedCanonPathEnum;
  const { lockfile } = loadCanonMetaSync();
  const files = mergedCanonPathsOrdered(lockfile.files);
  if (files.length === 0) {
    throw new Error("Canon lockfile has no files");
  }
  cachedCanonPathEnum = files as [string, ...string[]];
  return cachedCanonPathEnum;
}

export function isCanonPathAllowed(relativePath: string): boolean {
  const n = normalizeCanonPath(relativePath);
  if (!n) return false;
  try {
    const { allowlist } = loadCanonMetaSync();
    return allowlist.has(n);
  } catch {
    return false;
  }
}

function assertResolvedUnderReferences(resolvedFile: string): void {
  const refRoot = path.resolve(REFERENCES_DIR);
  const resolved = path.resolve(resolvedFile);
  const rel = path.relative(refRoot, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Path traversal blocked");
  }
}

function assertResolvedUnderExtras(resolvedFile: string): void {
  const root = path.resolve(EXTRAS_ROOT);
  const resolved = path.resolve(resolvedFile);
  const rel = path.relative(root, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Path traversal blocked (extras)");
  }
}

function resolveCanonReadPath(canonicalPath: string): string {
  if (canonicalPath.startsWith("extras/")) {
    const sub = canonicalPath.slice("extras/".length);
    const full = path.join(EXTRAS_ROOT, sub);
    assertResolvedUnderExtras(full);
    return full;
  }
  const full = path.join(REFERENCES_DIR, canonicalPath);
  assertResolvedUnderReferences(full);
  return full;
}

export async function readCanon(
  relativePath: string,
): Promise<{ path: string; content: string }> {
  const n = normalizeCanonPath(relativePath);
  if (!n) {
    throw new Error("Invalid path");
  }
  const { allowlist } = loadCanonMetaSync();
  if (!allowlist.has(n)) {
    throw new Error(`Path not in canon allowlist: ${relativePath}`);
  }
  const full = resolveCanonReadPath(n);
  if (!existsSync(full)) {
    throw new Error(`Canon file missing on disk: ${n}`);
  }
  const content = await readFile(full, "utf8");
  return { path: n, content };
}

/** SKILL.md body without YAML frontmatter (Cursor skill format). */
export function loadSkillMarkdownBody(): string {
  const skillPath = path.join(SKILL_ROOT, "SKILL.md");
  if (!existsSync(skillPath)) {
    throw new Error(submoduleMissingMessage());
  }
  const text = readFileSync(skillPath, "utf8");
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return (m ? m[1] : text).trimStart();
}

/** One-line routing hints keyed by corpus path — optional entries fall back to generic line. */
const CANON_PATH_HINTS: Partial<Record<string, string>> = {
  "02_mental_model.md":
    "Mental model; AuMM issuance schedule vs BTC; “mining is LP”.",
  "03_theoretical_foundation.md":
    "Theoretical grounding (immutable allocation / CCC framing).",
  "04_tokenomics.md": "Tokenomics; governance deposits; issuance.",
  "05_miliarium_aureum.md": "28 Miliarium pools; curated registry rationale.",
  "06_miliarium_manifest.md": "Miliarium manifest / registry wording.",
  "07_miliarium_sectors.md": "Sector / pool classification detail.",
  "07a_tokens.md":
    "Token inventory; dual universal connectors **svZCHF** + **ixEDEL** (cross-pool routing rails).",
  "08_bootstrap.md": "Bootstrap sequence and rollout.",
  "09_transitions.md": "Transitions between protocol phases.",
  "10_constitution.md": "Constitution; § headings; governance actions; Bodensee parameters.",
  "11_formulas.md": "F-* formulas (fees, EMA emissions, skim math).",
  "12_aureum_glossary.md": "Glossary definitions (CCC, CCB, Miliarium, ix-pools…).",
  "13_appendices.md": "Appendices and supplemental tables.",
  "14_ux_ui.md": "UX copy / glossary cross-links surfaced on the site.",
  "15_overview.md": "High-level protocol overview.",
  "16_team.md": "Contributors / stewardship (non-financial biography).",
  "17_faq.md":
    "**Official FAQ** — use whenever the user asks for FAQ, perguntas frequentes, or to list FAQs.",
};

function hintForCanonPath(canonicalPath: string): string {
  if (
    canonicalPath.startsWith("sagix/") ||
    canonicalPath.startsWith("extras/sagix/")
  ) {
    return "Sagix Apothecary (mirrored via aumm-skill) — interpretive / DDD context; canonical source URL in file header. Prefer numbered **aumm** refs for immutable protocol mechanics.";
  }
  if (canonicalPath.startsWith("extras/")) {
    return "Supplementary corpus (chatbot-managed); cite path + heading verbatim.";
  }
  if (canonicalPath.startsWith("miliarium_profiles/")) {
    return "Single Miliarium pool profile — weights, rationale, ticker.";
  }
  return CANON_PATH_HINTS[canonicalPath] ?? "Canon reference markdown.";
}

/** Bullet list used in the system prompt so the model always knows corpus filenames. */
export function buildCanonTocMarkdown(): string {
  const { lockfile } = loadCanonMetaSync();
  const lines = mergedCanonPathsOrdered(lockfile.files).map(
    (p) => `- \`${p}\` — ${hintForCanonPath(p)}`,
  );
  return [
    "## Canon file index\n",
    "Call **readAummReference** with exactly one \`path\` from below when you need text not already in retrieved output this turn:",
    "",
    ...lines,
  ].join("\n");
}

/** Full concatenated references (slow system prompt growth). Toggle with \`AUMM_EMBED_CANON=1\`. */
export function loadEmbeddedCanonBlockSync(): string {
  if (process.env.AUMM_EMBED_CANON !== "1") {
    return "";
  }
  const { allowlist, lockfile } = loadCanonMetaSync();
  const sorted = mergedCanonPathsOrdered(lockfile.files).filter((p) =>
    allowlist.has(p),
  );
  let out = "";

  // Keep deterministic ordering; cap at ~850k chars to avoid pathological payloads.
  const MAX_EMBED_CHARS = 850_000;
  for (const rel of sorted) {
    let full: string;
    try {
      full = resolveCanonReadPath(rel);
    } catch {
      continue;
    }
    if (!existsSync(full)) continue;
    const slice = readFileSync(full, "utf8");
    const header = `\n\n<!-- embedded: ${rel} -->\n\n`;
    const next = `${header}${slice}`;
    if (out.length + next.length > MAX_EMBED_CHARS) {
      out += `${header}[…truncated corpus at ${MAX_EMBED_CHARS} chars — call readAummReference for full text]\n`;
      break;
    }
    out += next;
  }
  return `\n\n## Embedded canon (\`AUMM_EMBED_CANON=1\`)\nThe following duplicate bundled corpus files (**references/** plus **extras/**). Prefer citing section ids (§, F-) and file paths.${out}`;
}

const ROLE_PREFIX = `You are the Project Aureum documentation assistant for https://aumm.fi.

## Mandatory grounding contract
1. Every **protocol claim** (numbers, formulas, governance action types, pool rules, skim routing, FAQs, glossary entries, comparisons) MUST come from canon text retrieved via **readAummReference** in this turn—or from the Embedded canon block ONLY if that section is visibly present below. Paths under \`extras/…\` are **chatbot-only supplements** when listed. **Sagix** essays appear in the canon index as \`sagix/*.md\` (from \`vendor/aumm-skill\`); cite them for DDD / framing when retrieval applies—for **immutable protocol mechanics** prioritize numbered aumm corpus files (e.g. \`04_tokenomics.md\`, \`10_constitution.md\`).
2. For each substantive answer, cite the **file path** (e.g. \`17_faq.md\`, \`sagix/decentralized_money.md\`, or \`extras/…\` when used) and **canonical section ids** wherever they appear (e.g. §xxix, F-11). If the corpus has no §/F marker for that sentence, cite the nearest heading verbatim.
3. If the corpus does NOT contain information to answer safely, refuse in ONE short paragraph and link https://aumm.fi — **do not** invent FAQs, formulas, Discord/Telegram “support desks”, proofs-of-stake comparisons, external protocol claims, APYs, or live on-chain metrics.
4. **No cross-protocol hype**: do NOT argue why AuMM is “better” than Uniswap, Curve, Balancer, or others unless another protocol is **explicitly quoted verbatim inside retrieved canon**.
5. **Language**: Respond in the same language as the user’s latest message for prose, BUT keep proper nouns exactly as canon spells them (**Miliarium Aureum**, **der Bodensee**, **Aequilibrium**, **ix‑** prefixed pools, ticker symbols).

## Forbidden content
- Financial, legal, or tax advice; guaranteed returns or “investment guidance”.
- Mediation scripts for scams, interpersonal disputes, or political discourse.
- Speculation about live TVL, votes, gauges, APRs unless read from authoritative on-chain/UI sources (you do NOT have MCP here).

## Operational rule
Prefer **narrow** retrieves: FAQ questions → often \`17_faq.md\`; definitions → \`12_aureum_glossary.md\`; maths → \`11_formulas.md\`; immutable parameters → \`10_constitution.md\`. For risk / routing / liquidity-design essays, Sagix mirrors under \`sagix/…\` may apply—retrieve and quote them rather than improvising external claims.

`;

/** True when corpus is inlined and the gateway may disable mandatory first-tool retrieval for cost/latency. */
export function isEmbedCanonEnabled(): boolean {
  return process.env.AUMM_EMBED_CANON === "1";
}

/** Validates corpus via _canon.json load, then returns strict role + TOC + SKILL + optional embedded snapshot. */
export function buildAummSystemPrompt(opts?: { suffix?: string }): string {
  loadCanonMetaSync();

  let prompt =
    ROLE_PREFIX +
    "\n\n" +
    buildCanonTocMarkdown() +
    "\n\n" +
    loadSkillMarkdownBody();

  prompt += loadEmbeddedCanonBlockSync();

  const extra = opts?.suffix?.trim();
  if (extra) {
    prompt += "\n\n" + extra + "\n";
  }
  return prompt;
}
