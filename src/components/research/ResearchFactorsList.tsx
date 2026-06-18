"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";

type Props = {
  positives: string[];
  risks: string[];
};

export default function ResearchFactorsList({ positives, risks }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <ThumbsUp className="h-5 w-5 text-success" aria-hidden />
          <h3 className="text-lg font-semibold">Key positives</h3>
        </div>
        {positives.length === 0 ? (
          <p className="text-sm text-base-content/55">No positive factors identified yet.</p>
        ) : (
          <ul className="space-y-2">
            {positives.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm text-base-content/85 before:mt-1.5 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-success"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <ThumbsDown className="h-5 w-5 text-error" aria-hidden />
          <h3 className="text-lg font-semibold">Risk factors</h3>
        </div>
        {risks.length === 0 ? (
          <p className="text-sm text-base-content/55">No risk factors flagged.</p>
        ) : (
          <ul className="space-y-2">
            {risks.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm text-base-content/85 before:mt-1.5 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-error"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
