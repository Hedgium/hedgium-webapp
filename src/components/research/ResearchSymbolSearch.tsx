"use client";

import { Search } from "lucide-react";

const QUICK_SYMBOLS = ["TCS", "INFY", "RELIANCE", "HDFCBANK", "ICICIBANK"] as const;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSearch: (symbol: string) => void;
  loading?: boolean;
};

export default function ResearchSymbolSearch({
  value,
  onChange,
  onSearch,
  loading = false,
}: Props) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (!ticker) return;
    onSearch(ticker);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label className="input input-bordered flex flex-1 items-center gap-2 bg-base-100">
          <Search className="h-4 w-4 shrink-0 text-base-content/50" aria-hidden />
          <input
            type="text"
            className="grow uppercase"
            placeholder="NSE ticker (e.g. TCS)"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            aria-label="Stock symbol"
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary sm:min-w-28"
          disabled={loading || !value.trim()}
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Search"
          )}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-base-content/55">Quick pick:</span>
        {QUICK_SYMBOLS.map((sym) => (
          <button
            key={sym}
            type="button"
            className="btn btn-xs btn-ghost border border-base-300/60 font-mono"
            onClick={() => {
              onChange(sym);
              onSearch(sym);
            }}
            disabled={loading}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}
