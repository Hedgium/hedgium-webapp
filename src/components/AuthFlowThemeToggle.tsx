"use client";

import { useEffect, useState } from "react";
import { SunMoon } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Theme toggle for auth flows. Uses SunMoon (not Sun/Moon) and descriptive labels
 * for screen readers — WCAG 2.1 name + purpose.
 */
export default function AuthFlowThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      className="btn btn-ghost btn-circle btn-sm h-11 w-11 min-h-11 min-w-11 border border-base-300/70 text-base-content hover:bg-base-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      disabled={!mounted}
    >
      <SunMoon className="h-5 w-5" aria-hidden />
    </button>
  );
}
