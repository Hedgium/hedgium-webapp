"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { isDemoUser } from "@/lib/demo";

export default function DemoModeBanner() {
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoUser(user) || dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-info/30 bg-info/10 px-4 py-2 md:px-8"
    >
      <div className="flex items-start gap-3">
        <Info className="h-4 w-4 shrink-0 text-info mt-0.5" aria-hidden="true" />
        <p className="flex-1 text-sm text-base-content">
          <span className="font-semibold">Preview mode.</span>{" "}
          You are viewing synthetic sample data. No real trades or broker
          connections are used.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="btn btn-ghost btn-xs btn-square shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Dismiss preview mode notice"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
