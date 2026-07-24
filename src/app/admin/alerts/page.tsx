"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { authFetch } from "@/utils/api";
import type {
  Notification,
  NotificationSource,
  NotificationType,
  PaginatedNotifications,
  RelatedModelName,
} from "@/types/notifications";
import {
  ENTITY_LABELS,
  SOURCE_LABELS,
} from "@/types/notifications";

const PAGE_SIZE = 20;

type DaysFilter = 1 | 7;
type SourceFilter = "all" | NotificationSource;
type EntityFilter = "all" | RelatedModelName;
type SeverityFilter = "all" | NotificationType;
type StatusFilter = "all" | "unread";

const ENTITY_OPTIONS: RelatedModelName[] = [
  "strategies",
  "trade_cycles",
  "orders",
  "profiles",
  "leads",
  "positions",
  "builders",
  "system",
];

const DEFAULT_FILTERS = {
  daysFilter: 1 as DaysFilter,
  sourceFilter: "all" as SourceFilter,
  entityFilter: "all" as EntityFilter,
  severityFilter: "all" as SeverityFilter,
  statusFilter: "all" as StatusFilter,
};

export default function AdminAlertsPage() {
  const { markAllAsRead, deleteNotification, fetchNotifications, unreadCount: storeUnreadCount } =
    useNotificationStore();

  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [daysFilter, setDaysFilter] = useState<DaysFilter>(DEFAULT_FILTERS.daysFilter);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(DEFAULT_FILTERS.sourceFilter);
  const [entityFilter, setEntityFilter] = useState<EntityFilter>(DEFAULT_FILTERS.entityFilter);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>(DEFAULT_FILTERS.severityFilter);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(DEFAULT_FILTERS.statusFilter);

  const activeFilterCount = countActiveFilters({
    daysFilter,
    sourceFilter,
    entityFilter,
    severityFilter,
    statusFilter,
  });
  const modalFilterCount = countActiveFilters({
    daysFilter,
    sourceFilter,
    entityFilter,
    severityFilter: DEFAULT_FILTERS.severityFilter,
    statusFilter,
  });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        days: String(daysFilter),
        page: String(page),
        page_size: String(PAGE_SIZE),
      });
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (entityFilter !== "all") params.set("related_model_name", entityFilter);
      if (severityFilter !== "all") params.set("type", severityFilter);
      if (statusFilter === "unread") params.set("unread_only", "true");

      const res = await authFetch(`/notifications/?${params.toString()}`);
      if (!res.ok) {
        setAlerts([]);
        setTotalCount(0);
        return;
      }

      const data: PaginatedNotifications = await res.json();
      setAlerts(data.results);
      setTotalCount(data.count);
      setHasNext(Boolean(data.next));
      setHasPrevious(Boolean(data.previous));
    } catch (err) {
      console.error("Failed to fetch admin alerts", err);
      setAlerts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [daysFilter, page, sourceFilter, entityFilter, severityFilter, statusFilter]);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  const resetPage = () => setPage(1);

  const applyFilter = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    resetPage();
  };

  const clearAllFilters = () => {
    setDaysFilter(DEFAULT_FILTERS.daysFilter);
    setSourceFilter(DEFAULT_FILTERS.sourceFilter);
    setEntityFilter(DEFAULT_FILTERS.entityFilter);
    setSeverityFilter(DEFAULT_FILTERS.severityFilter);
    setStatusFilter(DEFAULT_FILTERS.statusFilter);
    resetPage();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    await fetchNotifications(daysFilter);
    await fetchAlerts();
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
    await fetchAlerts();
  };

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);

  const shellBg = (
    <>
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
    </>
  );

  if (loading && alerts.length === 0) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
          {shellBg}
        </div>
        <span className="loading loading-spinner loading-lg text-primary" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        {shellBg}
      </div>

      <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Bell className="h-7 w-7 shrink-0 text-primary" aria-hidden />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-base-content md:text-3xl">
                  Alerts
                </h1>
                <p className="text-sm text-base-content/55">
                  Telegram mirrors, leads, and client notifications.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
    

              <button
                type="button"
                className="btn btn-sm btn-outline gap-2"
                onClick={() => setFiltersOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Filters
                {modalFilterCount > 0 ? (
                  <span className="badge badge-primary badge-sm tabular-nums">
                    {modalFilterCount}
                  </span>
                ) : null}
              </button>

              {storeUnreadCount > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => void handleMarkAllRead()}
                >
                  Mark all read ({storeUnreadCount})
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterButton
              active={severityFilter === "all"}
              onClick={() => applyFilter(setSeverityFilter, "all")}
            >
              All
            </FilterButton>
            {(["INFO", "SUCCESS", "WARNING", "ERROR"] as NotificationType[]).map((type) => (
              <FilterButton
                key={type}
                active={severityFilter === type}
                onClick={() => applyFilter(setSeverityFilter, type)}
              >
                {type}
              </FilterButton>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-base-content/55">
              {totalCount > 0
                ? `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`
                : "No alerts match your filters"}
              {activeFilterCount > 0 ? (
                <span className="text-base-content/40"> · {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active</span>
              ) : null}
            </p>
            {loading && alerts.length > 0 ? (
              <span className="loading loading-spinner loading-sm text-primary" aria-label="Refreshing" />
            ) : 
            <button
            type="button"
            className="btn btn-sm btn-outline gap-2"
            onClick={() => void fetchAlerts()}
            disabled={loading}
            aria-label="Reload alerts"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden
            />
          </button>
            
            }
          </div>
        </section>

        <section className="space-y-6">
          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-base-300/50 bg-base-100/55 py-16 text-center backdrop-blur-sm md:px-8">
              <Bell className="mx-auto mb-3 h-11 w-11 text-base-content/30" aria-hidden />
              <p className="font-medium text-base-content">No matching notifications</p>
              <p className="mt-1 text-sm text-base-content/55">
                Try widening your filters or choosing a longer period.
              </p>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost mt-4"
                  onClick={clearAllFilters}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-base-300/50 bg-base-100/55 backdrop-blur-sm">
              <ul className="divide-y divide-base-300/50">
                {alerts.map((notification) => (
                  <AlertRow
                    key={notification.id}
                    notification={notification}
                    onDelete={() => void handleDelete(notification.id)}
                  />
                ))}
              </ul>
            </div>
          )}

          {totalCount > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-base-content/55">
                Page {page} · {totalCount} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline gap-1"
                  disabled={!hasPrevious || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline gap-1"
                  disabled={!hasNext || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {filtersOpen ? (
        <div className="modal modal-open">
          <div className="modal-box max-h-[85vh] w-11/12 max-w-lg overflow-y-auto">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-base-content">Filter alerts</h2>
                <p className="mt-0.5 text-sm text-base-content/55">
                  Narrow by period, source, entity, or read status.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle shrink-0"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="space-y-6">
              <FilterSection label="Period">
                <div className="join w-full">
                  <FilterButton
                    active={daysFilter === 1}
                    className="join-item flex-1"
                    onClick={() => applyFilter(setDaysFilter, 1)}
                  >
                    Today
                  </FilterButton>
                  <FilterButton
                    active={daysFilter === 7}
                    className="join-item flex-1"
                    onClick={() => applyFilter(setDaysFilter, 7)}
                  >
                    Last 7 days
                  </FilterButton>
                </div>
              </FilterSection>

              <FilterSection label="Source">
                <div className="flex flex-wrap gap-2">
                  <FilterButton
                    active={sourceFilter === "all"}
                    onClick={() => applyFilter(setSourceFilter, "all")}
                  >
                    All
                  </FilterButton>
                  {(Object.keys(SOURCE_LABELS) as NotificationSource[]).map((key) => (
                    <FilterButton
                      key={key}
                      active={sourceFilter === key}
                      onClick={() => applyFilter(setSourceFilter, key)}
                    >
                      {SOURCE_LABELS[key]}
                    </FilterButton>
                  ))}
                </div>
              </FilterSection>

              <FilterSection label="Entity">
                <div className="flex flex-wrap gap-2">
                  <FilterButton
                    active={entityFilter === "all"}
                    onClick={() => applyFilter(setEntityFilter, "all")}
                  >
                    All
                  </FilterButton>
                  {ENTITY_OPTIONS.map((key) => (
                    <FilterButton
                      key={key}
                      active={entityFilter === key}
                      onClick={() => applyFilter(setEntityFilter, key)}
                    >
                      {ENTITY_LABELS[key]}
                    </FilterButton>
                  ))}
                </div>
              </FilterSection>

              <FilterSection label="Status">
                <div className="flex flex-wrap gap-2">
                  <FilterButton
                    active={statusFilter === "all"}
                    onClick={() => applyFilter(setStatusFilter, "all")}
                  >
                    All
                  </FilterButton>
                  <FilterButton
                    active={statusFilter === "unread"}
                    onClick={() => applyFilter(setStatusFilter, "unread")}
                  >
                    Unread only
                  </FilterButton>
                </div>
              </FilterSection>
            </div>

            <div className="modal-action mt-8 border-t border-base-300/60 pt-4">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clearAllFilters}
                disabled={activeFilterCount === 0}
              >
                Clear all
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setFiltersOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

function countActiveFilters(filters: {
  daysFilter: DaysFilter;
  sourceFilter: SourceFilter;
  entityFilter: EntityFilter;
  severityFilter: SeverityFilter;
  statusFilter: StatusFilter;
}) {
  let count = 0;
  if (filters.daysFilter !== DEFAULT_FILTERS.daysFilter) count += 1;
  if (filters.sourceFilter !== DEFAULT_FILTERS.sourceFilter) count += 1;
  if (filters.entityFilter !== DEFAULT_FILTERS.entityFilter) count += 1;
  if (filters.severityFilter !== DEFAULT_FILTERS.severityFilter) count += 1;
  if (filters.statusFilter !== DEFAULT_FILTERS.statusFilter) count += 1;
  return count;
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-base-content/45">
        {label}
      </p>
      {children}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`btn btn-sm rounded-lg ${
        active ? "btn-primary" : "btn-ghost border border-base-300/60"
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function AlertRow({
  notification,
  onDelete,
}: {
  notification: Notification;
  onDelete: () => void;
}) {
  const showDot = !notification.read;
  const borderAccent =
    notification.type === "SUCCESS"
      ? "border-l-success"
      : notification.type === "WARNING"
        ? "border-l-warning"
        : notification.type === "ERROR"
          ? "border-l-error"
          : "border-l-info";

  const entityLabel = notification.related_model_name
    ? ENTITY_LABELS[notification.related_model_name] ?? notification.related_model_name
    : null;

  return (
    <li className={`border-l-4 ${borderAccent} transition-colors hover:bg-base-200/25`}>
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5 sm:py-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex w-3 shrink-0 justify-center pt-1.5" title={showDot ? "Unread" : undefined}>
            {showDot ? (
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
            ) : null}
          </div>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              notification.type === "SUCCESS"
                ? "bg-success/15 text-success"
                : notification.type === "WARNING"
                  ? "bg-warning/15 text-warning"
                  : notification.type === "ERROR"
                    ? "bg-error/15 text-error"
                    : "bg-info/15 text-info"
            }`}
          >
            {notification.type === "SUCCESS" && <CheckCircle className="h-5 w-5" aria-hidden />}
            {notification.type === "WARNING" && <AlertTriangle className="h-5 w-5" aria-hidden />}
            {notification.type === "ERROR" && <XCircle className="h-5 w-5" aria-hidden />}
            {notification.type === "INFO" && <Info className="h-5 w-5" aria-hidden />}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-snug text-base-content md:text-lg">
              {notification.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-base-content/55">{notification.message}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="badge badge-ghost badge-sm">
                {SOURCE_LABELS[notification.source] ?? notification.source}
              </span>
              {entityLabel ? (
                <span className="badge badge-outline badge-sm">{entityLabel}</span>
              ) : null}
              <span className="text-xs text-base-content/45">
                {formatTimeAgo(new Date(notification.timestamp))}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="btn btn-ghost btn-sm shrink-0 gap-2 self-start text-base-content/45 hover:bg-error/10 hover:text-error sm:-mr-1"
          title="Delete"
          aria-label="Delete notification"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </li>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}
