"use client";

import { usePathname } from "next/navigation";

/** Must match HedgiumApp1 `scheme` + expo-router home route. */
export const HEDGIUM_APP_HOME_DEEP_LINK = "hedgiumapp:///(tabs)/home";

/**
 * Banner on /hedgium/* to open the native app. True “if installed” detection needs Universal Links.
 */
export default function HedgiumNativeOpenBar() {
  const pathname = usePathname();

  if (!pathname?.startsWith("/hedgium")) return null;

  return (
    <div className="shrink-0 bg-primary/10 border-b border-primary/20 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
      <span className="text-base-content/80">
        Prefer the Hedgium app? Continue where you left off.
      </span>
      <a
        href={HEDGIUM_APP_HOME_DEEP_LINK}
        className="btn btn-primary btn-xs sm:btn-sm normal-case shrink-0"
      >
        Open in app
      </a>
    </div>
  );
}
