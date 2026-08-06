"use client";

import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import {
  CandlestickChart,
  Eye,
  FileText,
  Package,
  Pencil,
  Plus,
  Ruler,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ResearchReportHtmlModal from "@/components/admin/ResearchReportHtmlModal";

type StrikeCsvUploadResponse = {
  message: string;
  total_records: number;
  created?: number;
  updated?: number;
  unchanged?: number;
  updated_symbols?: string[];
};

type StrikeStep = {
  id: number;
  symbol: string;
  strike_step: number | string;
};

type ContractLot = {
  id: number;
  symbol: string;
  exchange: string;
  lot_size: number;
};

type ResearchReport = {
  id: number;
  symbol: string;
  report_html: string | null;
  research_required: boolean;
  research_until: string | null;
  updated_at: string;
};

const REPORT_ORDERING_OPTIONS = [
  { value: "-updated_at", label: "Updated (newest)" },
  { value: "updated_at", label: "Updated (oldest)" },
  { value: "symbol", label: "Symbol (A–Z)" },
  { value: "-symbol", label: "Symbol (Z–A)" },
] as const;

type MarketTabId = "strike-steps" | "contract-lots" | "research-reports";

const MARKET_TABS: {
  id: MarketTabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Ruler;
}[] = [
  {
    id: "strike-steps",
    label: "Strike steps",
    shortLabel: "Steps",
    description: "Tick size per underlying. Upload a CSV to create or update by symbol.",
    icon: Ruler,
  },
  {
    id: "contract-lots",
    label: "Contract lots",
    shortLabel: "Lots",
    description:
      "Economic lot sizes per underlying and exchange. Used when broker CSV reports incorrect values.",
    icon: Package,
  },
  {
    id: "research-reports",
    label: "Research reports",
    shortLabel: "Reports",
    description:
      "HTML research reports per underlying. One report per symbol; saving again updates the existing row.",
    icon: FileText,
  },
];

const EXCHANGE_OPTIONS = ["MCX", "NFO", "BFO", "CDS", "NCDEX"] as const;

function normalizeNext(next: string | null): string | null {
  if (!next) return null;
  return next.includes("api/") ? next.split("api/")[1] : next;
}

export default function AdminMarketPage() {
  const [activeTab, setActiveTab] = useState<MarketTabId>("strike-steps");
  const activeTabMeta = MARKET_TABS.find((t) => t.id === activeTab)!;

  const [strikeRows, setStrikeRows] = useState<StrikeStep[]>([]);
  const [strikeNextPage, setStrikeNextPage] = useState<string | null>(null);
  const [strikeLoading, setStrikeLoading] = useState(true);
  const [strikeSearchQuery, setStrikeSearchQuery] = useState("");
  const [strikeDebouncedSearch, setStrikeDebouncedSearch] = useState("");
  const [strikeModalOpen, setStrikeModalOpen] = useState(false);
  const [strikeEditing, setStrikeEditing] = useState<StrikeStep | null>(null);
  const [strikeSaving, setStrikeSaving] = useState(false);
  const [strikeSymbol, setStrikeSymbol] = useState("");
  const [strikeStep, setStrikeStep] = useState("");
  const [strikeCsvModalOpen, setStrikeCsvModalOpen] = useState(false);
  const [strikeCsvFile, setStrikeCsvFile] = useState<File | null>(null);
  const [strikeCsvUploading, setStrikeCsvUploading] = useState(false);
  const strikeCsvInputRef = useRef<HTMLInputElement>(null);

  const [contractRows, setContractRows] = useState<ContractLot[]>([]);
  const [contractNextPage, setContractNextPage] = useState<string | null>(null);
  const [contractLoading, setContractLoading] = useState(true);
  const [contractSearchQuery, setContractSearchQuery] = useState("");
  const [contractDebouncedSearch, setContractDebouncedSearch] = useState("");
  const [contractExchangeFilter, setContractExchangeFilter] = useState("");
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [contractEditing, setContractEditing] = useState<ContractLot | null>(null);
  const [contractSaving, setContractSaving] = useState(false);
  const [contractSymbol, setContractSymbol] = useState("");
  const [contractExchange, setContractExchange] = useState("MCX");
  const [contractLotSize, setContractLotSize] = useState("");

  const [reportRows, setReportRows] = useState<ResearchReport[]>([]);
  const [reportNextPage, setReportNextPage] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportDebouncedSearch, setReportDebouncedSearch] = useState("");
  const [reportOrdering, setReportOrdering] = useState<string>("-updated_at");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportEditing, setReportEditing] = useState<ResearchReport | null>(null);
  const [reportSaving, setReportSaving] = useState(false);
  const [reportSymbol, setReportSymbol] = useState("");
  const [reportHtml, setReportHtml] = useState("");
  const [reportRequired, setReportRequired] = useState(false);
  const [reportUntil, setReportUntil] = useState("");
  const [reportViewing, setReportViewing] = useState<ResearchReport | null>(null);

  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  useEffect(() => {
    const t = setTimeout(() => setStrikeDebouncedSearch(strikeSearchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [strikeSearchQuery]);

  useEffect(() => {
    const t = setTimeout(() => setContractDebouncedSearch(contractSearchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [contractSearchQuery]);

  useEffect(() => {
    const t = setTimeout(() => setReportDebouncedSearch(reportSearchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [reportSearchQuery]);

  const fetchStrikeRows = useCallback(
    async (nextPageUrl?: string) => {
      setStrikeLoading(true);
      try {
        let endpoint: string;
        if (nextPageUrl) {
          if (/^https?:\/\//i.test(nextPageUrl)) {
            try {
              const parsed = new URL(nextPageUrl);
              const q = parsed.search ? parsed.search.slice(1) : "";
              endpoint = q ? `market/strike-steps/?${q}` : "market/strike-steps/";
            } catch {
              endpoint = "market/strike-steps/";
            }
          } else {
            endpoint = nextPageUrl;
          }
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "50");
          if (strikeDebouncedSearch) params.set("search", strikeDebouncedSearch);
          endpoint = `market/strike-steps/?${params.toString()}`;
        }

        const res = await authFetch(endpoint);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Failed to fetch strike steps");
        }
        const data = await res.json();
        const resultRows = (data.results || []) as StrikeStep[];

        if (nextPageUrl) {
          setStrikeRows((prev) => [...prev, ...resultRows]);
        } else {
          setStrikeRows(resultRows);
        }
        setStrikeNextPage(normalizeNext(data.next as string | null));
      } catch (e) {
        console.error(e);
        alertRef.current.error(
          e instanceof Error ? e.message : "Failed to fetch strike steps"
        );
      } finally {
        setStrikeLoading(false);
      }
    },
    [strikeDebouncedSearch]
  );

  const fetchContractRows = useCallback(
    async (nextPageUrl?: string) => {
      setContractLoading(true);
      try {
        let endpoint: string;
        if (nextPageUrl) {
          if (/^https?:\/\//i.test(nextPageUrl)) {
            try {
              const parsed = new URL(nextPageUrl);
              const q = parsed.search ? parsed.search.slice(1) : "";
              endpoint = q ? `market/contract-lots/?${q}` : "market/contract-lots/";
            } catch {
              endpoint = "market/contract-lots/";
            }
          } else {
            endpoint = nextPageUrl;
          }
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "50");
          if (contractDebouncedSearch) params.set("search", contractDebouncedSearch);
          if (contractExchangeFilter) params.set("exchange", contractExchangeFilter);
          endpoint = `market/contract-lots/?${params.toString()}`;
        }

        const res = await authFetch(endpoint);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Failed to fetch contract lots");
        }
        const data = await res.json();
        const resultRows = (data.results || []) as ContractLot[];

        if (nextPageUrl) {
          setContractRows((prev) => [...prev, ...resultRows]);
        } else {
          setContractRows(resultRows);
        }
        setContractNextPage(normalizeNext(data.next as string | null));
      } catch (e) {
        console.error(e);
        alertRef.current.error(
          e instanceof Error ? e.message : "Failed to fetch contract lots"
        );
      } finally {
        setContractLoading(false);
      }
    },
    [contractDebouncedSearch, contractExchangeFilter]
  );

  const fetchReportRows = useCallback(
    async (nextPageUrl?: string) => {
      setReportLoading(true);
      try {
        let endpoint: string;
        if (nextPageUrl) {
          if (/^https?:\/\//i.test(nextPageUrl)) {
            try {
              const parsed = new URL(nextPageUrl);
              const q = parsed.search ? parsed.search.slice(1) : "";
              endpoint = q ? `market/research-reports/?${q}` : "market/research-reports/";
            } catch {
              endpoint = "market/research-reports/";
            }
          } else {
            endpoint = nextPageUrl;
          }
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "50");
          if (reportDebouncedSearch) params.set("search", reportDebouncedSearch);
          if (reportOrdering) params.set("ordering", reportOrdering);
          endpoint = `market/research-reports/?${params.toString()}`;
        }

        const res = await authFetch(endpoint);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { detail?: string }).detail || "Failed to fetch research reports"
          );
        }
        const data = await res.json();
        const resultRows = (data.results || []) as ResearchReport[];

        if (nextPageUrl) {
          setReportRows((prev) => [...prev, ...resultRows]);
        } else {
          setReportRows(resultRows);
        }
        setReportNextPage(normalizeNext(data.next as string | null));
      } catch (e) {
        console.error(e);
        alertRef.current.error(
          e instanceof Error ? e.message : "Failed to fetch research reports"
        );
      } finally {
        setReportLoading(false);
      }
    },
    [reportDebouncedSearch, reportOrdering]
  );

  useEffect(() => {
    if (activeTab === "strike-steps") {
      void fetchStrikeRows();
    }
  }, [activeTab, fetchStrikeRows]);

  useEffect(() => {
    if (activeTab === "contract-lots") {
      void fetchContractRows();
    }
  }, [activeTab, fetchContractRows]);

  useEffect(() => {
    if (activeTab === "research-reports") {
      void fetchReportRows();
    }
  }, [activeTab, fetchReportRows]);

  const openStrikeCreate = () => {
    setStrikeEditing(null);
    setStrikeSymbol("");
    setStrikeStep("");
    setStrikeModalOpen(true);
  };

  const openStrikeEdit = (row: StrikeStep) => {
    setStrikeEditing(row);
    setStrikeSymbol(row.symbol);
    setStrikeStep(String(row.strike_step));
    setStrikeModalOpen(true);
  };

  const closeStrikeModal = () => {
    setStrikeModalOpen(false);
    setStrikeEditing(null);
  };

  const handleStrikeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSymbol = strikeSymbol.trim().toUpperCase();
    const parsedStep = Number(strikeStep);
    if (!cleanSymbol) {
      alert.error("Symbol is required");
      return;
    }
    if (!Number.isFinite(parsedStep) || parsedStep <= 0) {
      alert.error("Strike step must be a positive number");
      return;
    }

    setStrikeSaving(true);
    try {
      const body = JSON.stringify({
        symbol: cleanSymbol,
        strike_step: parsedStep,
      });

      if (strikeEditing) {
        const res = await authFetch(`market/strike-steps/${strikeEditing.id}/`, {
          method: "PATCH",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Update failed");
        }
        const updated = (await res.json()) as StrikeStep;
        setStrikeRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        alert.success("Strike step updated");
      } else {
        const res = await authFetch("market/strike-steps/", {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Create failed");
        }
        const created = (await res.json()) as StrikeStep;
        setStrikeRows((prev) => [created, ...prev]);
        alert.success("Strike step created");
      }

      closeStrikeModal();
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setStrikeSaving(false);
    }
  };

  const handleStrikeDelete = async (row: StrikeStep) => {
    if (!confirm(`Delete strike step for ${row.symbol}?`)) return;
    try {
      const res = await authFetch(`market/strike-steps/${row.id}/`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Delete failed");
      }
      setStrikeRows((prev) => prev.filter((r) => r.id !== row.id));
      alert.success("Strike step deleted");
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const openStrikeCsvModal = () => {
    setStrikeCsvFile(null);
    if (strikeCsvInputRef.current) strikeCsvInputRef.current.value = "";
    setStrikeCsvModalOpen(true);
  };

  const closeStrikeCsvModal = () => {
    setStrikeCsvModalOpen(false);
    setStrikeCsvFile(null);
    if (strikeCsvInputRef.current) strikeCsvInputRef.current.value = "";
  };

  const handleStrikeCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strikeCsvFile) {
      alert.error("Please select a CSV file");
      return;
    }
    const name = strikeCsvFile.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".txt")) {
      alert.error("Invalid file type. Please upload a CSV/TSV text file.");
      return;
    }
    setStrikeCsvUploading(true);
    try {
      const body = new FormData();
      body.append("file", strikeCsvFile);
      const res = await authFetch("market/upload-csv/", {
        method: "POST",
        body,
      });
      const data = (await res.json().catch(() => ({}))) as Partial<StrikeCsvUploadResponse> & {
        detail?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || data.detail || "CSV upload failed");
      }
      const updatedCount = data.updated ?? 0;
      if (updatedCount > 0) {
        alert.success(data.message || `Updated ${updatedCount} strike steps`);
      } else if ((data.created ?? 0) > 0) {
        alert.success(data.message || `Created ${data.created} strike steps`);
      } else {
        alert.success(data.message || "No strike step values changed");
      }
      closeStrikeCsvModal();
      await fetchStrikeRows();
    } catch (err) {
      console.error(err);
      alert.error(err instanceof Error ? err.message : "CSV upload failed");
    } finally {
      setStrikeCsvUploading(false);
    }
  };

  const openContractCreate = () => {
    setContractEditing(null);
    setContractSymbol("");
    setContractExchange("MCX");
    setContractLotSize("");
    setContractModalOpen(true);
  };

  const openContractEdit = (row: ContractLot) => {
    setContractEditing(row);
    setContractSymbol(row.symbol);
    setContractExchange(row.exchange);
    setContractLotSize(String(row.lot_size));
    setContractModalOpen(true);
  };

  const closeContractModal = () => {
    setContractModalOpen(false);
    setContractEditing(null);
  };

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSymbol = contractSymbol.trim().toUpperCase();
    const cleanExchange = contractExchange.trim().toUpperCase();
    const parsedLotSize = Number(contractLotSize);
    if (!cleanSymbol) {
      alert.error("Symbol is required");
      return;
    }
    if (!cleanExchange) {
      alert.error("Exchange is required");
      return;
    }
    if (!Number.isFinite(parsedLotSize) || parsedLotSize <= 0 || !Number.isInteger(parsedLotSize)) {
      alert.error("Lot size must be a positive whole number");
      return;
    }

    setContractSaving(true);
    try {
      const body = JSON.stringify({
        symbol: cleanSymbol,
        exchange: cleanExchange,
        lot_size: parsedLotSize,
      });

      if (contractEditing) {
        const res = await authFetch(`market/contract-lots/${contractEditing.id}/`, {
          method: "PATCH",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Update failed");
        }
        const updated = (await res.json()) as ContractLot;
        setContractRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        alert.success("Contract lot updated");
      } else {
        const res = await authFetch("market/contract-lots/", {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Create failed");
        }
        const created = (await res.json()) as ContractLot;
        setContractRows((prev) => [created, ...prev]);
        alert.success("Contract lot created");
      }

      closeContractModal();
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setContractSaving(false);
    }
  };

  const handleContractDelete = async (row: ContractLot) => {
    if (!confirm(`Delete contract lot for ${row.exchange}:${row.symbol}?`)) return;
    try {
      const res = await authFetch(`market/contract-lots/${row.id}/`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Delete failed");
      }
      setContractRows((prev) => prev.filter((r) => r.id !== row.id));
      alert.success("Contract lot deleted");
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const openReportCreate = () => {
    setReportEditing(null);
    setReportSymbol("");
    setReportHtml("");
    setReportRequired(false);
    setReportUntil("");
    setReportModalOpen(true);
  };

  const openReportEdit = (row: ResearchReport) => {
    setReportEditing(row);
    setReportSymbol(row.symbol);
    setReportHtml(row.report_html || "");
    setReportRequired(Boolean(row.research_required));
    setReportUntil(row.research_until || "");
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportEditing(null);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSymbol = reportSymbol.trim().toUpperCase();
    if (!cleanSymbol) {
      alert.error("Symbol is required");
      return;
    }

    setReportSaving(true);
    try {
      const body = JSON.stringify({
        symbol: cleanSymbol,
        report_html: reportHtml.trim() ? reportHtml : null,
        research_required: reportRequired,
        research_until: reportUntil.trim() ? reportUntil.trim() : null,
      });

      if (reportEditing) {
        const res = await authFetch(`market/research-reports/${reportEditing.id}/`, {
          method: "PATCH",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Update failed");
        }
        const updated = (await res.json()) as ResearchReport;
        setReportRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        alert.success("Research report updated");
      } else {
        const res = await authFetch("market/research-reports/", {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Create failed");
        }
        const created = (await res.json()) as ResearchReport;
        setReportRows((prev) => {
          const withoutDup = prev.filter((r) => r.symbol !== created.symbol);
          return [created, ...withoutDup];
        });
        alert.success("Research report saved");
      }

      closeReportModal();
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setReportSaving(false);
    }
  };

  const handleReportDelete = async (row: ResearchReport) => {
    if (!confirm(`Delete research report for ${row.symbol}?`)) return;
    try {
      const res = await authFetch(`market/research-reports/${row.id}/`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Delete failed");
      }
      setReportRows((prev) => prev.filter((r) => r.id !== row.id));
      alert.success("Research report deleted");
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const formatUpdatedAt = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto lg:px-8">
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-xl bg-primary/10 p-2.5">
            <CandlestickChart className="size-6 text-primary" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-base-content">
              Market
            </h1>
            <p className="mt-1 text-sm text-base-content/55">
              {activeTabMeta.description}
            </p>
          </div>
        </div>
      </header>

      <div
        className="mb-5 inline-flex w-full flex-col gap-1 rounded-xl border border-base-300/80 bg-base-200/40 p-1 sm:w-auto sm:flex-row"
        role="tablist"
        aria-label="Market configuration"
      >
        {MARKET_TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`market-tab-${tab.id}`}
              aria-controls={`market-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors sm:min-w-[10.5rem] ${
                selected
                  ? "bg-base-100 text-base-content ring-1 ring-base-300/60"
                  : "cursor-pointer text-base-content/65 hover:bg-base-100/60 hover:text-base-content"
              }`}
            >
              <Icon
                className={`size-4 shrink-0 ${selected ? "text-primary" : "opacity-80"}`}
                aria-hidden
              />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <section
        id={`market-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`market-tab-${activeTab}`}
      >
      {activeTab === "strike-steps" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 min-w-[12rem] max-w-md">
              <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
              <input
                type="search"
                placeholder="Search symbol..."
                aria-label="Search strike step symbols"
                className="input input-bordered input-sm w-full pl-9"
                value={strikeSearchQuery}
                onChange={(e) => setStrikeSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm gap-2"
                onClick={openStrikeCsvModal}
              >
                <Upload className="size-4" />
                Upload CSV
              </button>
              <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openStrikeCreate}>
                <Plus className="size-4" />
                Add strike step
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200">
                  <th>ID</th>
                  <th>Symbol</th>
                  <th>Strike step</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {strikeLoading && strikeRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-base-content/60">
                      Loading strike steps...
                    </td>
                  </tr>
                ) : strikeRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-base-content/60">
                      No strike steps found.
                    </td>
                  </tr>
                ) : (
                  strikeRows.map((r) => (
                    <tr key={r.id} className="hover">
                      <td className="font-mono">{r.id}</td>
                      <td className="font-semibold">{r.symbol}</td>
                      <td>{r.strike_step}</td>
                      <td className="text-end">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            title="Edit"
                            onClick={() => openStrikeEdit(r)}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            title="Delete"
                            onClick={() => void handleStrikeDelete(r)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {strikeNextPage && (
            <div className="flex justify-center mt-4">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => void fetchStrikeRows(strikeNextPage)}
                disabled={strikeLoading}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === "contract-lots" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[12rem]">
              <div className="relative flex-1 min-w-[12rem] max-w-md">
                <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
                <input
                  type="search"
                  placeholder="Search symbol..."
                  aria-label="Search contract lot symbols"
                  className="input input-bordered input-sm w-full pl-9"
                  value={contractSearchQuery}
                  onChange={(e) => setContractSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="select select-bordered select-sm"
                aria-label="Filter by exchange"
                value={contractExchangeFilter}
                onChange={(e) => setContractExchangeFilter(e.target.value)}
              >
                <option value="">All exchanges</option>
                {EXCHANGE_OPTIONS.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openContractCreate}>
              <Plus className="size-4" />
              Add contract lot
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200">
                  <th>ID</th>
                  <th>Symbol</th>
                  <th>Exchange</th>
                  <th>Lot size</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contractLoading && contractRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-base-content/60">
                      Loading contract lots...
                    </td>
                  </tr>
                ) : contractRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-base-content/60">
                      No contract lots found.
                    </td>
                  </tr>
                ) : (
                  contractRows.map((r) => (
                    <tr key={r.id} className="hover">
                      <td className="font-mono">{r.id}</td>
                      <td className="font-semibold">{r.symbol}</td>
                      <td>{r.exchange}</td>
                      <td>{r.lot_size}</td>
                      <td className="text-end">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            title="Edit"
                            onClick={() => openContractEdit(r)}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            title="Delete"
                            onClick={() => void handleContractDelete(r)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {contractNextPage && (
            <div className="flex justify-center mt-4">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => void fetchContractRows(contractNextPage)}
                disabled={contractLoading}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === "research-reports" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

            <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[12rem] max-w-md">
              <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
              <input
                type="search"
                placeholder="Search symbol..."
                aria-label="Search research report symbols"
                className="input input-bordered input-sm w-full pl-9"
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
              />
            </div>

            <label className="form-control">
              <select
                className="select select-bordered select-sm"
                aria-label="Sort research reports"
                value={reportOrdering}
                onChange={(e) => setReportOrdering(e.target.value)}
              >
                {REPORT_ORDERING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            
            </div>

            
            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openReportCreate}>
              <Plus className="size-4" />
              Add research report
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200">
                  <th>ID</th>
                  <th>Symbol</th>
                  <th>Required</th>
                  <th>Until</th>
                  <th>Updated</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportLoading && reportRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-base-content/60">
                      Loading research reports...
                    </td>
                  </tr>
                ) : reportRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-base-content/60">
                      No research reports found.
                    </td>
                  </tr>
                ) : (
                  reportRows.map((r) => (
                    <tr key={r.id} className="hover">
                      <td className="font-mono">{r.id}</td>
                      <td className="font-semibold">{r.symbol}</td>
                      <td>{r.research_required ? "Yes" : "No"}</td>
                      <td className="text-sm text-base-content/70">
                        {r.research_until || "—"}
                      </td>
                      <td className="text-sm text-base-content/70">{formatUpdatedAt(r.updated_at)}</td>
                      <td className="text-end">
                        <div className="flex justify-end gap-1">
                          {r.report_html?.trim() ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              title="View HTML"
                              onClick={() => setReportViewing(r)}
                            >
                              <Eye className="size-3.5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            title="Edit"
                            onClick={() => openReportEdit(r)}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            title="Delete"
                            onClick={() => void handleReportDelete(r)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {reportNextPage && (
            <div className="flex justify-center mt-4">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => void fetchReportRows(reportNextPage)}
                disabled={reportLoading}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
      </section>

      {strikeCsvModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-2">Upload strike step CSV</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Creates missing symbols and updates existing ones. CSV/TSV data rows start from
              line 3. Column 1 = symbol, column 4 = strike step (min per symbol is kept).
            </p>
            <form onSubmit={(e) => void handleStrikeCsvUpload(e)} className="space-y-3">
              <label className="form-control w-full">
                <span className="label-text text-sm">CSV file</span>
                <input
                  ref={strikeCsvInputRef}
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="file-input file-input-bordered file-input-sm w-full"
                  onChange={(e) => setStrikeCsvFile(e.target.files?.[0] ?? null)}
                  required
                />
              </label>
              {strikeCsvFile ? (
                <p className="text-xs text-base-content/60 truncate">
                  Selected: {strikeCsvFile.name}
                </p>
              ) : null}
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeStrikeCsvModal}
                  disabled={strikeCsvUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary gap-2"
                  disabled={strikeCsvUploading || !strikeCsvFile}
                >
                  {strikeCsvUploading ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="size-4" />
                      Upload &amp; update
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-black/50"
            aria-label="Close"
            onClick={() => {
              if (!strikeCsvUploading) closeStrikeCsvModal();
            }}
          />
        </div>
      )}

      {strikeModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">
              {strikeEditing ? `Edit strike step #${strikeEditing.id}` : "Add strike step"}
            </h3>
            <form onSubmit={(e) => void handleStrikeSubmit(e)} className="space-y-3">
              <label className="form-control w-full">
                <span className="label-text text-sm">Symbol</span>
                <input
                  className="input input-bordered input-sm w-full"
                  value={strikeSymbol}
                  onChange={(e) => setStrikeSymbol(e.target.value)}
                  placeholder="e.g. NIFTY"
                  required
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Strike step</span>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  className="input input-bordered input-sm w-full"
                  value={strikeStep}
                  onChange={(e) => setStrikeStep(e.target.value)}
                  required
                />
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={closeStrikeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={strikeSaving}>
                  {strikeSaving ? "Saving..." : strikeEditing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-black/50"
            aria-label="Close"
            onClick={closeStrikeModal}
          />
        </div>
      )}

      {contractModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">
              {contractEditing ? `Edit contract lot #${contractEditing.id}` : "Add contract lot"}
            </h3>
            <form onSubmit={(e) => void handleContractSubmit(e)} className="space-y-3">
              <label className="form-control w-full">
                <span className="label-text text-sm">Symbol</span>
                <input
                  className="input input-bordered input-sm w-full"
                  value={contractSymbol}
                  onChange={(e) => setContractSymbol(e.target.value)}
                  placeholder="e.g. CRUDEOIL"
                  required
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Exchange</span>
                <select
                  className="select select-bordered select-sm w-full"
                  value={contractExchange}
                  onChange={(e) => setContractExchange(e.target.value)}
                  required
                >
                  {EXCHANGE_OPTIONS.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Lot size</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="input input-bordered input-sm w-full"
                  value={contractLotSize}
                  onChange={(e) => setContractLotSize(e.target.value)}
                  placeholder="e.g. 100"
                  required
                />
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={closeContractModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={contractSaving}>
                  {contractSaving ? "Saving..." : contractEditing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-black/50"
            aria-label="Close"
            onClick={closeContractModal}
          />
        </div>
      )}

      {reportModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">
              {reportEditing
                ? `Edit research report #${reportEditing.id}`
                : "Add research report"}
            </h3>
            <form onSubmit={(e) => void handleReportSubmit(e)} className="flex flex-col space-y-2">
              <label className="form-control w-full">
                <span className="label-text text-sm">Symbol</span>
                <input
                  className="input input-bordered input-sm w-full"
                  value={reportSymbol}
                  onChange={(e) => setReportSymbol(e.target.value)}
                  placeholder="e.g. NIFTY"
                  required
                />
              </label>
              
              <label className="label cursor-pointer justify-start gap-3 pt-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={reportRequired}
                  onChange={(e) => setReportRequired(e.target.checked)}
                />
                <span className="label-text text-sm">Research required (include in stream underlyings)</span>
              </label>

              <label className="form-control w-full">
                <span className="label-text text-sm">Research until (optional)</span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={reportUntil}
                  onChange={(e) => setReportUntil(e.target.value)}
                />
              </label>


              <label className="form-control w-full">
                <span className="label-text text-sm">Report HTML (optional)</span>
                <textarea
                  className="textarea textarea-bordered w-full font-mono text-xs min-h-64"
                  value={reportHtml}
                  onChange={(e) => setReportHtml(e.target.value)}
                  placeholder="Paste full HTML report..."
                />
              </label>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={closeReportModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={reportSaving}>
                  {reportSaving ? "Saving..." : reportEditing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-black/50"
            aria-label="Close"
            onClick={closeReportModal}
          />
        </div>
      )}

      {reportViewing && reportViewing.report_html && (
        <ResearchReportHtmlModal
          symbols={[reportViewing.symbol]}
          htmlBySymbol={{ [reportViewing.symbol]: reportViewing.report_html }}
          onClose={() => setReportViewing(null)}
        />
      )}
    </div>
  );
}
