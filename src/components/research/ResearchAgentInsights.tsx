"use client";

import { useState } from "react";
import { Bot, ChevronDown, ChevronUp } from "lucide-react";
import type { AgentBlock, AgentInsights } from "@/types/research";

const AGENT_SECTIONS = [
  { key: "technical" as const, label: "Technical analyst" },
  { key: "fundamental" as const, label: "Fundamental analyst" },
  { key: "news" as const, label: "News analyst" },
  { key: "governance" as const, label: "Governance analyst" },
  { key: "master" as const, label: "Master synthesis" },
];

function AgentSection({
  label,
  block,
  defaultOpen = false,
}: {
  label: string;
  block: AgentBlock;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const summary =
    (typeof block.summary === "string" && block.summary) ||
    (typeof block.raw_summary === "string" && block.raw_summary) ||
    null;
  const signals = Array.isArray(block.signals) ? block.signals : [];
  const concerns = Array.isArray(block.concerns) ? block.concerns : [];

  return (
    <div className="rounded-xl border border-base-300/50 bg-base-200/20">
      <button
        type="button"
        className="flex w-full items-center cursor-pointer justify-between gap-2 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-medium">{label}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
        )}
      </button>

      {open ? (
        <div className="space-y-3 border-t border-base-300/40 px-4 py-3 text-sm">
          {summary ? (
            <p className="text-base-content/85 whitespace-pre-wrap">{summary}</p>
          ) : (
            <p className="text-base-content/55">No summary available.</p>
          )}
          {signals.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-base-content/50">
                Signals
              </p>
              <ul className="space-y-1">
                {signals.map((s) => (
                  <li key={s} className="text-base-content/80">
                    · {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {concerns.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-base-content/50">
                Concerns
              </p>
              <ul className="space-y-1">
                {concerns.map((c) => (
                  <li key={c} className="text-base-content/80">
                    · {c}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  insights: AgentInsights;
};

export default function ResearchAgentInsights({ insights }: Props) {
  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="text-lg font-semibold">AI agent insights</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/55">
          <span className="rounded-full border border-base-300/60 px-2 py-0.5">
            {insights.provider}
          </span>
          <span>{insights.elapsed_ms}ms</span>
          {insights.fallback_used ? (
            <span className="text-warning">fallback used</span>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        {AGENT_SECTIONS.map(({ key, label }, i) => (
          <AgentSection
            key={key}
            label={label}
            block={insights[key]}
            defaultOpen={i === AGENT_SECTIONS.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
