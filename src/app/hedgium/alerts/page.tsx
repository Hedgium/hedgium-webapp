"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Trash2,
  Bell,
} from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

export default function NotificationsPage() {
  const { notifications, isLoading, markAllAsRead, deleteNotification } = useNotificationStore();

  const [filterNotifications, setFilterNotifications] = useState<typeof notifications>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  /** IDs that were unread when this page first loaded — used for dots & Unread tab after auto mark-all-read */
  const [previouslyUnreadIds, setPreviouslyUnreadIds] = useState<Set<number>>(new Set());
  const didAutoMarkRef = useRef(false);

  useEffect(() => {
    if (isLoading || didAutoMarkRef.current) return;
    didAutoMarkRef.current = true;
    const list = useNotificationStore.getState().notifications;
    const unread = list.filter((n) => !n.read);
    setPreviouslyUnreadIds(new Set(unread.map((n) => n.id)));
    if (unread.length > 0) {
      void markAllAsRead();
    }
  }, [isLoading, markAllAsRead]);

  useEffect(() => {
    if (filter === "all") {
      setFilterNotifications(notifications);
    } else {
      setFilterNotifications(notifications.filter((n) => previouslyUnreadIds.has(n.id)));
    }
  }, [filter, notifications, previouslyUnreadIds]);

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

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
          {shellBg}
        </div>
        <span className="loading loading-spinner loading-lg text-primary" aria-label="Loading" />
      </div>
    );
  }

  const sessionUnreadCount = previouslyUnreadIds.size;

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        {shellBg}
      </div>

      <div className="relative mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-8">
        <section className="space-y-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Bell className="h-7 w-7 shrink-0 text-primary" aria-hidden />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-base-content md:text-3xl">Alerts</h1>
                <p className="text-sm text-base-content/55">
                  Trading and system updates. Unread items are marked as read when you open this page.
                </p>
              </div>
            </div>
            {sessionUnreadCount > 0 && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-base-300/60 bg-base-200/40 px-3 py-1 text-xs font-medium tabular-nums text-base-content/70">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                {sessionUnreadCount} unseen when you arrived
              </span>
            )}
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/45">
              Notifications
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-base-content/80">View</span>
              <div className="join">
                <button
                  type="button"
                  className={`btn btn-sm join-item rounded-lg ${
                    filter === "all" ? "btn-primary" : "btn-ghost border border-base-300/60"
                  }`}
                  onClick={() => setFilter("all")}
                >
                  All
                  <span className="ml-1 tabular-nums opacity-80">({notifications.length})</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm join-item rounded-lg ${
                    filter === "unread" ? "btn-primary" : "btn-ghost border border-base-300/60"
                  }`}
                  onClick={() => setFilter("unread")}
                >
                  Unread at visit
                  <span className="ml-1 tabular-nums opacity-80">({previouslyUnreadIds.size})</span>
                </button>
              </div>
            </div>
          </div>

          {filterNotifications?.length === 0 ? (
            <div className="rounded-2xl border border-base-300/50 bg-base-100/55 py-16 text-center backdrop-blur-sm md:px-8">
              <Bell className="mx-auto mb-3 h-11 w-11 text-base-content/30" aria-hidden />
              <p className="font-medium text-base-content">
                {filter === "unread" ? "No unread items from this visit" : "No notifications yet"}
              </p>
              <p className="mt-1 text-sm text-base-content/55">
                {filter === "unread"
                  ? "Everything was already read, or nothing was pending when you opened Alerts."
                  : "You’ll see strategy and system messages here."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-base-300/50 bg-base-100/55 backdrop-blur-sm">
              <ul className="divide-y divide-base-300/50">
                {filterNotifications.map((notification) => {
                  const showDot = previouslyUnreadIds.has(notification.id);
                  const borderAccent =
                    notification.type === "SUCCESS"
                      ? "border-l-success"
                      : notification.type === "WARNING"
                        ? "border-l-warning"
                        : notification.type === "ERROR"
                          ? "border-l-error"
                          : "border-l-info";

                  return (
                    <li
                      key={notification.id}
                      className={`border-l-4 ${borderAccent}  transition-colors hover:bg-base-200/25`}
                    >
                      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5 sm:py-5">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div
                            className="flex w-3 shrink-0 justify-center pt-1.5"
                            title={showDot ? "Was unread when you opened this page" : undefined}
                          >
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
                            <h3 className="font-semibold leading-snug text-base-content md:text-lg">{notification.title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-base-content/55">{notification.message}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-medium uppercase tracking-wide text-base-content/50">
                                {notification.related_model_name}
                              </span>
                              <span className="text-base-content/35">·</span>
                              <span className="text-xs text-base-content/45">
                                {formatTimeAgo(new Date(notification.timestamp))}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteNotification(notification.id)}
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
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}
