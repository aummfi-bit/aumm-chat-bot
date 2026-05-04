"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/** Maps Au/Night to Tailwind's `dark` class while keeping `data-theme` from next-themes. */
export function ThemeClassSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "day") {
      root.classList.remove("dark");
    } else if (
      resolvedTheme === "au" ||
      resolvedTheme === "night" ||
      resolvedTheme === undefined
    ) {
      root.classList.add("dark");
    }
  }, [resolvedTheme]);

  return null;
}
