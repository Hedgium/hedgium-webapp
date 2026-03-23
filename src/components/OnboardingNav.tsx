"use client";

import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";

interface OnboardingNavProps {
  backHref: string;
  backLabel?: string;
}

export default function OnboardingNav({ backHref, backLabel = "Back" }: OnboardingNavProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mb-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-base-content/70 hover:text-primary transition-colors"
      >
        <ChevronLeft className="size-4" />
        {backLabel}
      </Link>
      <Link
        href="/hedgium/dashboard"
        className="inline-flex items-center gap-1 text-sm text-base-content/70 hover:text-primary transition-colors"
      >
        <Home className="size-4" />
        Go to home
      </Link>
    </div>
  );
}
