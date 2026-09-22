"use client";

import { useCallback, useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import type { StylesConfig } from "react-select";
import {
  CheckCircle,
  Copy,
  FileText,
  IndianRupee,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import useAlert from "@/hooks/useAlert";
import {
  deleteInvoice,
  fetchCurrentQuarter,
  generateInvoices,
  generateOneInvoice,
  issueDrafts,
  issueInvoice,
  listBillingClients,
  listInvoices,
  rejectInvoice,
  sendInvoiceEmail,
  sendInvoiceWhatsApp,
  updateBillingClientFee,
  updateInvoice,
  verifyInvoice,
  voidInvoice,
} from "@/services/billing";
import type { BillingClient, Invoice, LastQuarterPaid } from "@/types/billing";
import { formatMoneyIN } from "@/utils/formatNumber";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

type BillingTab = "invoices" | "clients";

const BILLING_TABS: {
  id: BillingTab;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof FileText;
}[] = [
  {
    id: "invoices",
    label: "Invoices",
    shortLabel: "Invoices",
    description: "FY-quarter drafts, issue, pay links, and payment verification.",
    icon: FileText,
  },
  {
    id: "clients",
    label: "Clients",
    shortLabel: "Clients",
    description: "Billable clients and per-user fee type, percent, or fixed fee.",
    icon: Users,
  },
];

function buildFyOptions(around: Date = new Date()): string[] {
  // Indian FY starts in April: Apr 2026 → FY 2026-27
  const startYear = around.getMonth() >= 3 ? around.getFullYear() : around.getFullYear() - 1;
  const years: string[] = [];
  for (let y = startYear - 2; y <= startYear + 1; y++) {
    years.push(`${y}-${String(y + 1).slice(-2)}`);
  }
  return years;
}

const FY_OPTIONS = buildFyOptions();

type UserOption = {
  value: number;
  label: string;
  email: string | null;
  client_type: string;
};

const userSelectStyles: StylesConfig<UserOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 36,
    backgroundColor: "var(--color-base-100)",
    borderColor: state.isFocused ? "var(--color-primary)" : "var(--color-base-300)",
    boxShadow: state.isFocused ? "0 0 0 1px var(--color-primary)" : "none",
    "&:hover": { borderColor: "var(--color-base-content)" },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-base-100)",
    border: "1px solid var(--color-base-300)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--color-primary)"
      : state.isFocused
        ? "var(--color-base-200)"
        : "transparent",
    color: state.isSelected
      ? "var(--color-primary-content)"
      : "var(--color-base-content)",
    cursor: "pointer",
  }),
  singleValue: (base) => ({ ...base, color: "var(--color-base-content)" }),
  input: (base) => ({ ...base, color: "var(--color-base-content)" }),
  placeholder: (base) => ({
    ...base,
    color: "color-mix(in oklch, var(--color-base-content) 45%, transparent)",
  }),
};

function clientToOption(c: BillingClient): UserOption {
  const email = c.email || c.username;
  const type = c.client_type === "saas" ? "SaaS" : "RA";
  return {
    value: c.id,
    label: `${email} (#${c.id}, ${type})`,
    email: c.email,
    client_type: c.client_type,
  };
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-ghost",
  ISSUED: "badge-info",
  PENDING_VERIFICATION: "badge-warning",
  PAID: "badge-success",
  VOID: "badge-error",
};

const LAST_Q_LABEL: Record<LastQuarterPaid, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  NO_INVOICE: "No invoice",
};

export default function AdminBillingPage() {
  const alert = useAlert();
  const [fy, setFy] = useState("");
  const [quarter, setQuarter] = useState<string>("Q1");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("");
  const [lastQFilter, setLastQFilter] = useState<string>("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [oneUser, setOneUser] = useState<UserOption | null>(null);
  const [oneAsOf, setOneAsOf] = useState("");
  const [oneFy, setOneFy] = useState("");
  const [oneQuarter, setOneQuarter] = useState("Q1");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editInv, setEditInv] = useState<Invoice | null>(null);
  const [editFeeAmount, setEditFeeAmount] = useState("");
  const [editFeeBase, setEditFeeBase] = useState("");
  const [editPeriodEnd, setEditPeriodEnd] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editIsFinal, setEditIsFinal] = useState(false);
  const [viewTab, setViewTab] = useState<BillingTab>("invoices");
  const activeTabMeta = BILLING_TABS.find((t) => t.id === viewTab)!;
  const [clients, setClients] = useState<BillingClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientTypeClientFilter, setClientTypeClientFilter] = useState("");
  const [feeClient, setFeeClient] = useState<BillingClient | null>(null);
  const [feeMode, setFeeMode] = useState("default");
  const [feeAnnualPct, setFeeAnnualPct] = useState("");
  const [feeFixed, setFeeFixed] = useState("");

  const loadQuarterDefaults = useCallback(async () => {
    try {
      const cur = await fetchCurrentQuarter();
      // Default to previous quarter (billing in arrears)
      setFy(cur.previous_fy);
      setQuarter(cur.previous_quarter);
    } catch {
      const y = new Date().getFullYear();
      setFy(`${y}-${String(y + 1).slice(-2)}`);
      setQuarter("Q1");
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    if (!fy || !quarter) return;
    setLoading(true);
    try {
      const data = await listInvoices({
        fy,
        quarter,
        status: statusFilter || undefined,
        client_type: clientTypeFilter || undefined,
        last_quarter_paid: lastQFilter || undefined,
        page: 1,
        page_size: 200,
      });
      setInvoices(data.results || []);
    } catch (e) {
      console.error(e);
      alert.error("Failed to load invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alert is stable enough; avoid refetch loops
  }, [fy, quarter, statusFilter, clientTypeFilter, lastQFilter]);

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const data = await listBillingClients({
        q: clientSearch.trim() || undefined,
        client_type: clientTypeClientFilter || undefined,
        page: 1,
        page_size: 200,
      });
      setClients(data.results || []);
    } catch (e) {
      console.error(e);
      alert.error("Failed to load clients");
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientTypeClientFilter, clientSearch]);

  useEffect(() => {
    void loadQuarterDefaults();
  }, [loadQuarterDefaults]);

  useEffect(() => {
    if (viewTab === "invoices" && fy && quarter) void loadInvoices();
  }, [viewTab, fy, quarter, statusFilter, clientTypeFilter, lastQFilter, loadInvoices]);

  useEffect(() => {
    if (viewTab !== "clients") return;
    void loadClients();
    // Intentionally omit clientSearch so typing doesn't refetch until Refresh / Enter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewTab, clientTypeClientFilter]);

  async function withBusy(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerate() {
    await withBusy("generate", async () => {
      const res = await generateInvoices(fy, quarter);
      alert.success(`Created ${res.created}, skipped ${res.skipped}`);
      await loadInvoices();
    });
  }

  async function handleIssueAll() {
    await withBusy("issue-all", async () => {
      const res = await issueDrafts(fy, quarter);
      alert.success(`Issued ${res.issued} invoice(s)`);
      await loadInvoices();
    });
  }

  async function handleGenerateOne() {
    if (!oneUser) {
      alert.error("Select a client");
      return;
    }
    if (!oneFy.trim() || !oneQuarter) {
      alert.error("Enter FY and quarter");
      return;
    }
    const genFy = oneFy.trim();
    const genQ = oneQuarter;
    await withBusy("generate-one", async () => {
      const inv = await generateOneInvoice({
        user_id: oneUser.value,
        fy: genFy,
        quarter: genQ,
        as_of: oneAsOf || undefined,
      });
      alert.success(
        inv.is_final
          ? `Final draft ${inv.invoice_no} created`
          : `Draft ${inv.invoice_no} created`
      );
      setShowGenerateModal(false);
      setOneUser(null);
      setOneAsOf("");
      setFy(genFy);
      setQuarter(genQ);
      setLoading(true);
      try {
        const data = await listInvoices({
          fy: genFy,
          quarter: genQ,
          status: statusFilter || undefined,
          client_type: clientTypeFilter || undefined,
          last_quarter_paid: lastQFilter || undefined,
          page: 1,
          page_size: 200,
        });
        setInvoices(data.results || []);
      } finally {
        setLoading(false);
      }
    });
  }

  function openGenerateModal() {
    setOneFy(fy || "");
    setOneQuarter(quarter || "Q1");
    setOneUser(null);
    setOneAsOf("");
    setShowGenerateModal(true);
  }

  async function loadUserOptions(input: string): Promise<UserOption[]> {
    const data = await listBillingClients({
      q: input.trim() || undefined,
      page: 1,
      page_size: 25,
    });
    return (data.results || []).map(clientToOption);
  }

  function feeModeLabel(inv: Invoice): string {
    if (inv.fee_mode === "percent" && inv.fee_rate != null) {
      return `${(inv.fee_rate * 400).toFixed(2)}% p.a.`;
    }
    if (inv.fee_mode === "fixed" && inv.fixed_fee_amount != null) {
      return `Fixed ₹${formatMoneyIN(inv.fixed_fee_amount)}`;
    }
    return inv.client_type === "saas" ? "SaaS slab" : "2% p.a.";
  }

  function openEdit(inv: Invoice) {
    setEditInv(inv);
    setEditFeeAmount(String(inv.fee_amount));
    setEditFeeBase(String(inv.fee_base));
    setEditPeriodEnd(inv.period_end);
    setEditNotes(inv.notes || "");
    setEditIsFinal(Boolean(inv.is_final));
  }

  async function handleSaveEdit() {
    if (!editInv) return;
    const feeAmount = Number(editFeeAmount);
    const feeBase = Number(editFeeBase);
    if (!Number.isFinite(feeAmount) || feeAmount < 0) {
      alert.error("Enter a valid fee amount");
      return;
    }
    if (!Number.isFinite(feeBase) || feeBase < 0) {
      alert.error("Enter a valid fee base");
      return;
    }
    await withBusy(`edit-${editInv.id}`, async () => {
      await updateInvoice(editInv.id, {
        fee_amount: feeAmount,
        fee_base: feeBase,
        period_end: editPeriodEnd || undefined,
        notes: editNotes,
        is_final: editIsFinal,
      });
      alert.success("Invoice updated");
      setEditInv(null);
      await loadInvoices();
    });
  }

  async function handleDelete(inv: Invoice) {
    if (
      !window.confirm(
        `Delete invoice ${inv.invoice_no}? This cannot be undone.`
      )
    ) {
      return;
    }
    await withBusy(`delete-${inv.id}`, async () => {
      await deleteInvoice(inv.id);
      alert.success("Deleted");
      await loadInvoices();
    });
  }

  function copyLink(inv: Invoice) {
    const url = inv.pay_url || (inv.public_token ? `/pay/${inv.public_token}` : "");
    if (!url) {
      alert.error("No pay link — issue the invoice first");
      return;
    }
    void navigator.clipboard.writeText(url).then(
      () => alert.success("Link copied"),
      () => alert.error("Could not copy")
    );
  }

  function clientFeeLabel(c: BillingClient): string {
    if (c.billing_fee_mode === "percent" && c.billing_annual_rate != null) {
      return `${(c.billing_annual_rate * 100).toFixed(2)}% p.a.`;
    }
    if (c.billing_fee_mode === "fixed" && c.billing_fixed_quarterly != null) {
      return `Fixed ₹${formatMoneyIN(c.billing_fixed_quarterly)}/qtr`;
    }
    return c.client_type === "saas" ? "Default (SaaS slab)" : "Default (2% p.a.)";
  }

  function openFeeEdit(c: BillingClient) {
    setFeeClient(c);
    setFeeMode(c.billing_fee_mode || "default");
    setFeeAnnualPct(
      c.billing_annual_rate != null
        ? String(Number((c.billing_annual_rate * 100).toFixed(4)))
        : ""
    );
    setFeeFixed(
      c.billing_fixed_quarterly != null ? String(c.billing_fixed_quarterly) : ""
    );
  }

  async function handleSaveClientFee() {
    if (!feeClient) return;
    const mode = feeMode;
    let annual: number | null = null;
    let fixed: number | null = null;
    if (mode === "percent") {
      const pct = Number(feeAnnualPct);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        alert.error("Enter annual percent between 0 and 100");
        return;
      }
      annual = pct / 100;
    } else if (mode === "fixed") {
      const amt = Number(feeFixed);
      if (!Number.isFinite(amt) || amt < 0) {
        alert.error("Enter a valid fixed quarterly fee");
        return;
      }
      fixed = amt;
    }
    await withBusy(`fee-${feeClient.id}`, async () => {
      await updateBillingClientFee(feeClient.id, {
        billing_fee_mode: mode,
        billing_annual_rate: annual,
        billing_fixed_quarterly: fixed,
      });
      alert.success("Fee settings saved");
      setFeeClient(null);
      await loadClients();
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto lg:px-8">
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-xl bg-primary/10 p-2.5">
            <IndianRupee className="size-6 text-primary" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-base-content">
              Client billing
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
        aria-label="Billing views"
      >
        {BILLING_TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = viewTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`billing-tab-${tab.id}`}
              aria-controls={`billing-panel-${tab.id}`}
              onClick={() => setViewTab(tab.id)}
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
        id={`billing-panel-${viewTab}`}
        role="tabpanel"
        aria-labelledby={`billing-tab-${viewTab}`}
      >
      {viewTab === "clients" ? (
        <>
          <div className="flex flex-wrap gap-3 items-end mb-6">
            <label className="form-control">
              <span className="label-text text-xs">Search</span>
              <input
                className="input input-bordered input-sm w-64"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void loadClients();
                }}
                placeholder="Email, name, mobile"
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs">Client type</span>
              <select
                className="select select-bordered select-sm"
                value={clientTypeClientFilter}
                onChange={(e) => setClientTypeClientFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="ra_client">RA</option>
                <option value="saas">SaaS</option>
              </select>
            </label>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => void loadClients()}
              disabled={clientsLoading}
            >
              {clientsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Refresh
            </button>
          </div>

          {clientsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : clients.length === 0 ? (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body items-center text-center py-12">
                <p className="text-base-content/70">No billable clients found.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto card bg-base-100 border border-base-300">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Fee</th>
                    <th>Mobile</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td className="text-xs">
                        <div>{c.email || c.username}</div>
                        <div className="text-base-content/50">#{c.id}</div>
                      </td>
                      <td className="text-xs">
                        {c.client_type === "saas" ? "SaaS" : "RA"}
                      </td>
                      <td className="text-xs">{clientFeeLabel(c)}</td>
                      <td className="text-xs">{c.mobile || "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost"
                          title="Edit fee"
                          onClick={() => openFeeEdit(c)}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit fee
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
      <>
      <div className="flex flex-wrap gap-3 items-end mb-6">
        <label className="form-control">
          <span className="label-text text-xs">FY</span>
          <select
            className="select select-bordered select-sm"
            value={fy}
            onChange={(e) => setFy(e.target.value)}
          >
            {!fy || FY_OPTIONS.includes(fy) ? null : (
              <option value={fy}>{fy}</option>
            )}
            {FY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text text-xs">Quarter</span>
          <select
            className="select select-bordered select-sm"
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
          >
            {QUARTERS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text text-xs">Status</span>
          <select
            className="select select-bordered select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PENDING_VERIFICATION">Pending verification</option>
            <option value="PAID">Paid</option>
            <option value="VOID">Void</option>
          </select>
        </label>
        <label className="form-control">
          <span className="label-text text-xs">Client type</span>
          <select
            className="select select-bordered select-sm"
            value={clientTypeFilter}
            onChange={(e) => setClientTypeFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="ra_client">RA</option>
            <option value="saas">SaaS</option>
          </select>
        </label>
        <label className="form-control">
          <span className="label-text text-xs">Last quarter</span>
          <select
            className="select select-bordered select-sm"
            value={lastQFilter}
            onChange={(e) => setLastQFilter(e.target.value)}
          >
            <option value="">Any</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="NO_INVOICE">No invoice</option>
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => void handleGenerate()}
          disabled={busy !== null}
        >
          {busy === "generate" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Generate drafts
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => void handleIssueAll()}
          disabled={busy !== null}
        >
          {busy === "issue-all" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Issue all drafts
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={openGenerateModal}
        >
          Generate for user
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body items-center text-center py-12">
            <p className="text-base-content/70">
              No invoices for {fy} {quarter}. Generate drafts to start.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto card bg-base-100 border border-base-300">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Type</th>
                <th>Fee</th>
                <th>Fee base</th>
                <th>Total</th>
                <th>Status</th>
                <th>Last Q</th>
                <th>Proof</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <div className="font-mono text-xs">{inv.invoice_no}</div>
                    <div className="text-xs text-base-content/50">
                      {inv.billing_days}/{inv.quarter_days}d
                      {inv.sebi_cap_applied ? " · SEBI cap" : ""}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium text-sm">
                      {inv.user_email || `User #${inv.user_id}`}
                    </div>
                    {inv.user_mobile && (
                      <div className="text-xs text-base-content/50">{inv.user_mobile}</div>
                    )}
                  </td>
                  <td className="text-xs uppercase">
                    {inv.client_type === "ra_client" ? "RA" : "SaaS"}
                    {inv.is_final ? (
                      <div className="badge badge-xs badge-warning mt-1">Final</div>
                    ) : null}
                  </td>
                  <td className="text-xs">{feeModeLabel(inv)}</td>
                  <td className="text-sm">
                    ₹{formatMoneyIN(inv.fee_base)}
                    <div className="text-xs text-base-content/50">
                      {inv.fee_base_source}
                    </div>
                  </td>
                  <td className="font-medium">₹{formatMoneyIN(inv.total_amount)}</td>
                  <td>
                    <span className={`badge badge-sm ${STATUS_BADGE[inv.status] || ""}`}>
                      {inv.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>
                    {inv.last_quarter_paid ? (
                      <span
                        className={`badge badge-sm ${
                          inv.last_quarter_paid === "PAID"
                            ? "badge-success"
                            : inv.last_quarter_paid === "UNPAID"
                              ? "badge-warning"
                              : "badge-ghost"
                        }`}
                      >
                        {LAST_Q_LABEL[inv.last_quarter_paid]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-xs">
                    {inv.submitted_txn_last4 && (
                      <div className="font-mono">****{inv.submitted_txn_last4}</div>
                    )}
                    {inv.screenshot ? (
                      <a
                        href={inv.screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary"
                      >
                        Screenshot
                      </a>
                    ) : null}
                    {!inv.submitted_txn_last4 && !inv.screenshot && "—"}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {inv.status === "DRAFT" && (
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          disabled={busy === `issue-${inv.id}`}
                          onClick={() =>
                            void withBusy(`issue-${inv.id}`, async () => {
                              await issueInvoice(inv.id);
                              alert.success("Issued");
                              await loadInvoices();
                            })
                          }
                        >
                          Issue
                        </button>
                      )}
                      {(inv.status === "DRAFT" || inv.status === "ISSUED") && (
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost"
                          title="Edit"
                          onClick={() => openEdit(inv)}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      {inv.status !== "PAID" && (
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost text-error"
                          title="Delete"
                          disabled={busy === `delete-${inv.id}`}
                          onClick={() => void handleDelete(inv)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                      {inv.public_token && inv.status !== "VOID" && (
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost"
                          title="Copy pay link"
                          onClick={() => copyLink(inv)}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                      {inv.status !== "DRAFT" && inv.status !== "VOID" && (
                        <>
                          <button
                            type="button"
                            className="btn btn-xs btn-ghost"
                            title="Send email"
                            disabled={busy === `email-${inv.id}`}
                            onClick={() =>
                              void withBusy(`email-${inv.id}`, async () => {
                                await sendInvoiceEmail(inv.id);
                                alert.success("Email queued");
                                await loadInvoices();
                              })
                            }
                          >
                            <Mail className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-ghost"
                            title="Send WhatsApp"
                            disabled={busy === `wa-${inv.id}`}
                            onClick={() =>
                              void withBusy(`wa-${inv.id}`, async () => {
                                await sendInvoiceWhatsApp(inv.id);
                                alert.success("WhatsApp queued");
                                await loadInvoices();
                              })
                            }
                          >
                            <MessageCircle className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      {inv.status === "PENDING_VERIFICATION" && (
                        <>
                          <button
                            type="button"
                            className="btn btn-xs btn-success"
                            disabled={busy === `verify-${inv.id}`}
                            onClick={() =>
                              void withBusy(`verify-${inv.id}`, async () => {
                                await verifyInvoice(inv.id);
                                alert.success("Marked paid");
                                await loadInvoices();
                              })
                            }
                          >
                            <CheckCircle className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-error"
                            onClick={() => {
                              setRejectId(inv.id);
                              setRejectNotes("");
                            }}
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      {inv.status !== "PAID" && inv.status !== "VOID" && (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline btn-error"
                          disabled={busy === `void-${inv.id}`}
                          onClick={() =>
                            void withBusy(`void-${inv.id}`, async () => {
                              await voidInvoice(inv.id, "Voided by admin");
                              alert.success("Voided");
                              await loadInvoices();
                            })
                          }
                        >
                          Void
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}
      </section>

      {rejectId !== null && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Reject payment proof</h3>
            <p className="py-2 text-sm text-base-content/70">
              Invoice returns to Issued so the client can resubmit.
            </p>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Reason (optional)"
            />
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRejectId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={() =>
                  void withBusy(`reject-${rejectId}`, async () => {
                    await rejectInvoice(rejectId, rejectNotes);
                    setRejectId(null);
                    alert.success("Rejected");
                    await loadInvoices();
                  })
                }
              >
                Reject
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setRejectId(null)}>
              close
            </button>
          </form>
        </dialog>
      )}

      {editInv !== null && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">Edit {editInv.invoice_no}</h3>
            <p className="text-xs text-base-content/60 mb-4 leading-relaxed">
              {editInv.gst_amount > 0 || editInv.gst_rate > 0
                ? "Total and GST recalculate from the fee amount."
                : "Total recalculates from the fee amount."}
              {editInv.status === "ISSUED"
                ? " UPI QR amount updates too."
                : ""}
            </p>
            <div className="grid gap-3">
              <label className="form-control w-full">
                <span className="label-text text-xs mb-1">Fee amount</span>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered input-sm w-full"
                  value={editFeeAmount}
                  onChange={(e) => setEditFeeAmount(e.target.value)}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-xs mb-1">Fee base (AUM)</span>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered input-sm w-full"
                  value={editFeeBase}
                  onChange={(e) => setEditFeeBase(e.target.value)}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-xs mb-1">Period end</span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={editPeriodEnd}
                  onChange={(e) => setEditPeriodEnd(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={editIsFinal}
                  onChange={(e) => setEditIsFinal(e.target.checked)}
                />
                <span className="text-sm">Final / early termination</span>
              </label>
              <label className="form-control w-full">
                <span className="label-text text-xs mb-1">Notes</span>
                <textarea
                  className="textarea textarea-bordered textarea-sm w-full"
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </label>
            </div>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditInv(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy === `edit-${editInv.id}`}
                onClick={() => void handleSaveEdit()}
              >
                {busy === `edit-${editInv.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setEditInv(null)}>
              close
            </button>
          </form>
        </dialog>
      )}

      {feeClient !== null && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg break-words">
              Edit fee — {feeClient.email || feeClient.username}
            </h3>
            <p className="text-xs text-base-content/60 mb-4 leading-relaxed">
              Applies to future invoice generation for this client.
            </p>
            <div className="grid gap-3">
              <label className="form-control w-full">
                <span className="label-text text-xs mb-1">Fee type</span>
                <select
                  className="select select-bordered select-sm w-full"
                  value={feeMode}
                  onChange={(e) => setFeeMode(e.target.value)}
                >
                  <option value="default">
                    Default (RA 2% p.a. / SaaS slab)
                  </option>
                  <option value="percent">Custom annual percent</option>
                  <option value="fixed">Fixed quarterly fee</option>
                </select>
              </label>
              {feeMode === "percent" && (
                <label className="form-control w-full">
                  <span className="label-text text-xs mb-1">
                    Annual % (e.g. 2 = 2% p.a.)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    className="input input-bordered input-sm w-full"
                    value={feeAnnualPct}
                    onChange={(e) => setFeeAnnualPct(e.target.value)}
                  />
                </label>
              )}
              {feeMode === "fixed" && (
                <label className="form-control w-full">
                  <span className="label-text text-xs mb-1">
                    Fixed quarterly fee (₹)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    className="input input-bordered input-sm w-full"
                    value={feeFixed}
                    onChange={(e) => setFeeFixed(e.target.value)}
                  />
                </label>
              )}
            </div>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setFeeClient(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy === `fee-${feeClient.id}`}
                onClick={() => void handleSaveClientFee()}
              >
                {busy === `fee-${feeClient.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setFeeClient(null)}>
              close
            </button>
          </form>
        </dialog>
      )}

      {showGenerateModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">Generate for user</h3>
            <p className="text-xs text-base-content/60 mb-4">
              Creates or refreshes a draft invoice. Optional leave date ends the
              billing window early (pro-rated).
            </p>
            <div className="space-y-3">
              <label className="form-control">
                <span className="label-text text-xs">Client</span>
                <AsyncSelect<UserOption, false>
                  cacheOptions
                  defaultOptions
                  loadOptions={loadUserOptions}
                  value={oneUser}
                  onChange={(opt) => setOneUser(opt)}
                  placeholder="Search email, name, mobile…"
                  styles={userSelectStyles}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : null
                  }
                  classNamePrefix="billing-user"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-control">
                  <span className="label-text text-xs">FY</span>
                  <select
                    className="select select-bordered select-sm"
                    value={oneFy}
                    onChange={(e) => setOneFy(e.target.value)}
                  >
                    {!oneFy || FY_OPTIONS.includes(oneFy) ? null : (
                      <option value={oneFy}>{oneFy}</option>
                    )}
                    {FY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-control">
                  <span className="label-text text-xs">Quarter</span>
                  <select
                    className="select select-bordered select-sm"
                    value={oneQuarter}
                    onChange={(e) => setOneQuarter(e.target.value)}
                  >
                    {QUARTERS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="form-control">
                <span className="label-text text-xs">Leave date (optional)</span>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={oneAsOf}
                  onChange={(e) => setOneAsOf(e.target.value)}
                />
              </label>
            </div>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowGenerateModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy === "generate-one"}
                onClick={() => void handleGenerateOne()}
              >
                {busy === "generate-one" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Create / refresh draft
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setShowGenerateModal(false)}>
              close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}
