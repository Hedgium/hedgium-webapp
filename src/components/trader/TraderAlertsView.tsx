"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
  Trash2,
  XCircle,
} from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import type { Notification } from "@/types/notifications";

function TypeIcon({ type }: { type: Notification["type"] }) {
  if (type === "SUCCESS") return <CheckCircle className="h-4 w-4 text-success" />;
  if (type === "WARNING") return <AlertTriangle className="h-4 w-4 text-warning" />;
  if (type === "ERROR") return <XCircle className="h-4 w-4 text-error" />;
  return <Info className="h-4 w-4 text-info" />;
}

export default function TraderAlertsView() {
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    deleteNotification,
    unreadCount,
  } = useNotificationStore();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    void fetchNotifications(7);
  }, [fetchNotifications]);

  const rows = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [filter, notifications]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">Alerts</h1>
          </div>
          <p className="mt-1 text-sm text-base-content/55">
            {unreadCount} unread · last 7 days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-base-300 bg-base-100 p-0.5">
            {(["all", "unread"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === key
                    ? "bg-base-300 text-base-content"
                    : "text-base-content/60 hover:bg-base-200/70 hover:text-base-content"
                }`}
                onClick={() => setFilter(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={unreadCount === 0}
            onClick={() => void markAllAsRead()}
          >
            Mark all read
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100/60 px-6 py-14 text-center text-sm text-base-content/50">
          No alerts yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => (
            <li
              key={n.id}
              className={`group rounded-xl border bg-base-100/80 px-4 py-3 transition-colors ${
                n.read
                  ? "border-base-300/70"
                  : "border-primary/25 bg-primary/[0.03]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <TypeIcon type={n.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold tracking-tight">{n.title}</h2>
                    {!n.read ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-base-content/70">
                    {n.message}
                  </p>
                  <p className="mt-2 text-[11px] tabular-nums text-base-content/45">
                    {new Date(n.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Delete alert"
                  onClick={() => void deleteNotification(n.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
