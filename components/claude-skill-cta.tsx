"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

const INSTALL_COMMAND =
  "git clone https://github.com/aummfi-bit/aumm-skill.git ~/.claude/skills/aumm-aureum";

const CLAUDE_PROMPT =
  "Use the aumm-aureum skill to answer my next questions about Project Aureum (https://aumm.fi).";

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
  const panelId = `${rootId}-claude-panel`;
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
        <span className="sm:hidden">+ Aureum (Claude)</span>
        <span className="hidden sm:inline">
          Use Claude? Add Aureum skill
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={`${panelId}-title`}
          className="absolute right-0 mt-2 w-[min(92vw,420px)] rounded-md border border-border bg-popover text-popover-foreground shadow-md p-4 z-50 normal-case tracking-normal font-sans font-normal max-h-[70vh] overflow-y-auto text-left"
        >
          <h2
            id={`${panelId}-title`}
            className="text-sm font-semibold text-foreground mb-2"
          >
            Install the Aureum skill in Claude
          </h2>
          <p className="text-xs text-muted-foreground mb-4 leading-snug">
            Run the Aureum protocol assistant inside your own Claude with the
            canonical aumm-skill.
          </p>

          <div className="space-y-4">
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-foreground">
                  1. Paste into your terminal
                </span>
                <Button
                  ref={firstCopyRef}
                  size="sm"
                  variant="default"
                  type="button"
                  onClick={() =>
                    copyText(INSTALL_COMMAND, "Command copied")
                  }
                >
                  Copy command
                </Button>
              </div>
              <pre
                className="font-mono text-xs sm:text-sm bg-secondary border border-border rounded-md p-3 select-all break-all whitespace-pre-wrap"
                translate="no"
              >
                {INSTALL_COMMAND}
              </pre>
            </section>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-foreground">
                  2. Paste into a Claude chat
                </span>
                <Button
                  size="sm"
                  variant="default"
                  type="button"
                  onClick={() =>
                    copyText(CLAUDE_PROMPT, "Prompt copied")
                  }
                >
                  Copy prompt
                </Button>
              </div>
              <pre
                className="font-mono text-xs sm:text-sm bg-secondary border border-border rounded-md p-3 select-all break-all whitespace-pre-wrap"
                translate="no"
              >
                {CLAUDE_PROMPT}
              </pre>
            </section>
          </div>

          <p className="text-xs text-muted-foreground mt-4 leading-snug">
            Then mention <code className="font-mono">aumm-aureum</code> whenever you
            want canon-grounded answers. Full repo:&nbsp;
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
            Skills load from <code className="font-mono">~/.claude/skills/</code> —
            Claude Desktop / CLI; Claude on the web cannot read local files.
          </p>
        </div>
      ) : null}
    </div>
  );
}
