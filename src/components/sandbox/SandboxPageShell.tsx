"use client";

import type { ReactNode } from "react";

type MaxWidth = "3xl" | "6xl" | "7xl";

/**
 * Visual shell aligned with main app pages: ambient gradient, grid texture, constrained content width.
 */
export default function SandboxPageShell({
  children,
  maxWidth = "7xl",
  className = "",
  contentClassName = "",
}: {
  children: ReactNode;
  maxWidth?: MaxWidth;
  /** Extra classes on the outer relative wrapper */
  className?: string;
  /** Extra classes on the inner max-width container */
  contentClassName?: string;
}) {
  const mw =
    maxWidth === "3xl"
      ? "max-w-3xl"
      : maxWidth === "6xl"
        ? "max-w-6xl"
        : "max-w-7xl";

  return (
    <div className={`relative min-h-full flex-1 flex flex-col ${className}`}>
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-base-200 via-base-200 to-base-300/80" />
        <div className="absolute -top-24 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[22rem] w-[22rem] rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-accent/10 blur-2xl opacity-70" />
        <div
          className="absolute inset-0 opacity-[0.35] bg-[linear-gradient(to_right,oklch(var(--bc)/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--bc)/0.04)_1px,transparent_1px)] bg-[size:32px_32px]"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
          }}
        />
      </div>
      <div
        className={`relative mx-auto w-full flex-1 px-4 py-6 md:px-8 md:py-8 ${mw} ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
