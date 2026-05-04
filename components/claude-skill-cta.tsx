"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

const INSTALL_COMMAND =
  "git clone https://github.com/aummfi-bit/aumm-skill.git ~/.claude/skills/aumm-aureum";

/** Standalone prompt for any AI chat when no local skill or MCP is used. */
const STANDALONE_PROMPT =
  "Answer my questions about Project Aureum (Aureum Protocol). Ground answers in https://aumm.fi and canonical material at https://github.com/aummfi-bit/aumm-skill. Prefer facts from those sources; say when you are uncertain.";

const GITMCP_SKILL_URL = "https://gitmcp.io/aummfi-bit/aumm-skill";

const MCP_JSON_CURSOR = `{
  "mcpServers": {
    "aumm-skill Docs": {
      "url": "${GITMCP_SKILL_URL}"
    }
  }
}`;

const MCP_JSON_CLAUDE_DESKTOP = `{
  "mcpServers": {
    "aumm-skill Docs": {
      "command": "npx",
      "args": ["mcp-remote", "${GITMCP_SKILL_URL}"]
    }
  }
}`;

async function copyText(text: string, successToast: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successToast);
  } catch {
    toast.error("Could not copy — check browser permissions.");
  }
}

export function ClaudeSkillCTA() {
  const [open, setOpen] = useState(false);
  const rootId = useId();
  const panelId = `${rootId}-aureum-panel`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstCopyRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(() => {
      firstCopyRef.current?.focus();
    });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-block shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs sm:text-sm uppercase tracking-wide rounded border border-border px-2 py-2 hover:bg-secondary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none text-foreground whitespace-nowrap"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="sm:hidden">+ Aureum (AI)</span>
        <span className="hidden sm:inline">Do you use AI? Try here</span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={`${panelId}-title`}
          className="absolute right-0 mt-2 w-[min(92vw,480px)] rounded-md border border-border bg-popover text-popover-foreground shadow-md p-4 z-50 normal-case tracking-normal font-sans font-normal max-h-[70vh] overflow-y-auto overflow-x-hidden text-left"
        >
          <h2
            id={`${panelId}-title`}
            className="text-sm font-semibold text-foreground mb-2"
          >
            Use Aureum in your AI assistant
          </h2>
          <p className="text-xs text-muted-foreground mb-4 leading-snug">
            Pick the approach that fits your setup — you do not need to use
            everything below.
          </p>

          <div className="space-y-4">
            <section aria-labelledby={`${panelId}-option-a`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span
                  id={`${panelId}-option-a`}
                  className="text-xs font-medium text-foreground"
                >
                  Option A: Install the local Claude skill
                </span>
                <Button
                  ref={firstCopyRef}
                  size="sm"
                  variant="default"
                  type="button"
                  onClick={() => copyText(INSTALL_COMMAND, "Command copied")}
                >
                  Copy command
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2 leading-snug">
                Paste into your terminal (Claude Desktop / CLI).
              </p>
              <pre
                className="font-mono text-xs sm:text-sm bg-secondary border border-border rounded-md p-3 select-all break-all whitespace-pre-wrap"
                translate="no"
              >
                {INSTALL_COMMAND}
              </pre>
              <p className="text-xs text-muted-foreground mt-3 leading-snug">
                After install, mention{" "}
                <code className="font-mono">aumm-aureum</code> when you want
                canon-grounded answers. Full repo:&nbsp;
                <a
                  href="https://github.com/aummfi-bit/aumm-skill"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  aummfi-bit/aumm-skill
                </a>
              </p>
              <p className="text-xs text-muted-foreground/90 mt-2 leading-snug">
                Local skills load from{" "}
                <code className="font-mono">~/.claude/skills/</code> in Claude
                Desktop / CLI. Claude on the web cannot read local files.
              </p>
            </section>

            <section
              aria-labelledby={`${panelId}-option-b`}
              className="border-t border-border pt-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span
                  id={`${panelId}-option-b`}
                  className="text-xs font-medium text-foreground"
                >
                  Option B: Paste a standalone prompt
                </span>
                <Button
                  size="sm"
                  variant="default"
                  type="button"
                  onClick={() =>
                    copyText(STANDALONE_PROMPT, "Prompt copied")
                  }
                >
                  Copy prompt
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2 leading-snug">
                Use this in any AI chat when you are not using a local skill or
                MCP tools.
              </p>
              <pre
                className="font-mono text-xs sm:text-sm bg-secondary border border-border rounded-md p-3 select-all break-all whitespace-pre-wrap"
                translate="no"
              >
                {STANDALONE_PROMPT}
              </pre>
            </section>

            <section
              aria-labelledby={`${panelId}-option-c`}
              className="border-t border-border pt-4"
            >
              <span
                id={`${panelId}-option-c`}
                className="text-xs font-medium text-foreground block mb-2"
              >
                Option C: MCP documentation server (Cursor, Claude Desktop,
                …)
              </span>
              <p className="text-xs text-muted-foreground mb-3 leading-snug">
                Adds Aureum skill docs into your assistant via MCP. This is not
                a replacement for Option A&apos;s full local clone. If tools do
                not show up, restart the app or reload MCP.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-foreground">
                      Cursor (<code className="font-mono">~/.cursor/mcp.json</code>{" "}
                      or <code className="font-mono">.cursor/mcp.json</code>)
                    </span>
                    <Button
                      size="sm"
                      variant="default"
                      type="button"
                      onClick={() =>
                        copyText(MCP_JSON_CURSOR, "Cursor config copied")
                      }
                    >
                      Copy JSON
                    </Button>
                  </div>
                  <pre
                    className="font-mono text-[11px] sm:text-xs bg-secondary border border-border rounded-md p-3 select-all break-all whitespace-pre-wrap"
                    translate="no"
                  >
                    {MCP_JSON_CURSOR}
                  </pre>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-foreground">
                      Claude Desktop (
                      <code className="font-mono">
                        claude_desktop_config.json
                      </code>
                      )
                    </span>
                    <Button
                      size="sm"
                      variant="default"
                      type="button"
                      onClick={() =>
                        copyText(
                          MCP_JSON_CLAUDE_DESKTOP,
                          "Claude Desktop config copied"
                        )
                      }
                    >
                      Copy JSON
                    </Button>
                  </div>
                  <pre
                    className="font-mono text-[11px] sm:text-xs bg-secondary border border-border rounded-md p-3 select-all break-all whitespace-pre-wrap"
                    translate="no"
                  >
                    {MCP_JSON_CLAUDE_DESKTOP}
                  </pre>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 leading-snug">
                Instructions for VS Code, Windsurf, and others:&nbsp;
                <a
                  href={GITMCP_SKILL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  {GITMCP_SKILL_URL}
                </a>
              </p>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
