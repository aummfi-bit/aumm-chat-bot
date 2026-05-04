"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = ["au", "day", "night"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="grid w-full max-w-[220px] grid-cols-3 rounded border border-border overflow-hidden h-9 shrink-0"
        aria-hidden
      />
    );
  }

  const active =
    theme && THEMES.includes(theme as (typeof THEMES)[number])
      ? theme
      : "au";

  return (
    <div
      className="grid w-full max-w-[220px] grid-cols-3 rounded border border-border overflow-hidden shrink-0"
      role="group"
      aria-label="Theme"
    >
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          className={`min-w-0 px-1.5 py-2 text-center text-[11px] uppercase tracking-wide transition-colors border-r border-border last:border-r-0 ${
            active === t
              ? "bg-primary text-primary-foreground"
              : "bg-transparent text-muted-foreground hover:text-primary"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
