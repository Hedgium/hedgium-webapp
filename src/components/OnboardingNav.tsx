"use client";

import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";

interface OnboardingNavProps {
  backHref: string;
  backLabel?: string;
  /** Destination for the home shortcut (default: app home). */
  homeHref?: string;
  homeLabel?: string;
}

const linkClass =
  "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export default function OnboardingNav({
  backHref,
  backLabel = "Back",
  homeHref = "/hedgium/home",
  homeLabel = "Home",
}: OnboardingNavProps) {
  return (
    <nav
      className="flex w-full flex-nowrap items-stretch justify-between gap-1 rounded-xl border border-base-300 bg-base-100 px-1.5 py-1 shadow-sm sm:gap-2 sm:px-3 sm:py-1.5"
      aria-label="Onboarding navigation"
    >
      <Link href={backHref} className={linkClass}>
        <ChevronLeft className="size-4 shrink-0 opacity-80" aria-hidden />
        {backLabel}
      </Link>
      <span className="my-2 w-px shrink-0 self-stretch bg-base-300" aria-hidden />
      <Link href={homeHref} className={linkClass}>
        <Home className="size-4 shrink-0 opacity-80" aria-hidden />
        {homeLabel}
      </Link>
    </nav>
  );
}
