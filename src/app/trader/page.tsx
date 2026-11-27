"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import TraderNiftyStrip from "@/components/trader/TraderNiftyStrip";
import TraderRightNav from "@/components/trader/TraderRightNav";
import { useNotificationStore } from "@/store/notificationStore";
import type { TraderView } from "@/types/trader";

const TraderBuilderView = dynamic(
  () => import("@/components/trader/TraderBuilderView"),
  { ssr: false, loading: () => <ViewLoading /> }
);
const TraderStrategiesView = dynamic(
  () => import("@/components/trader/TraderStrategiesView"),
  { ssr: false, loading: () => <ViewLoading /> }
);
const TraderProfilesView = dynamic(
  () => import("@/components/trader/TraderProfilesView"),
  { ssr: false, loading: () => <ViewLoading /> }
);
const TraderAlertsView = dynamic(
  () => import("@/components/trader/TraderAlertsView"),
  { ssr: false, loading: () => <ViewLoading /> }
);

function ViewLoading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <span className="loading loading-spinner loading-md text-primary" />
    </div>
  );
}

function resolveView(raw: string | null): TraderView {
  if (
    raw === "strategies" ||
    raw === "profiles" ||
    raw === "builder" ||
    raw === "alerts"
  ) {
    return raw;
  }
  return "strategies";
}

function TraderTerminalInner() {
  const searchParams = useSearchParams();
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const view = useMemo(
    () => resolveView(searchParams.get("view")),
    [searchParams]
  );

  useEffect(() => {
    void fetchNotifications(7);
  }, [fetchNotifications]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-gradient-to-br from-base-200 via-base-200 to-base-300/40">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-base-300/80 bg-base-100/80 backdrop-blur-sm">
          <TraderNiftyStrip />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">
          {view === "builder" ? (
            <TraderBuilderView />
          ) : view === "profiles" ? (
            <TraderProfilesView />
          ) : view === "alerts" ? (
            <TraderAlertsView />
          ) : (
            <TraderStrategiesView />
          )}
        </main>
      </div>
      <TraderRightNav activeView={view} />
    </div>
  );
}

export default function TraderTerminalPage() {
  return (
    <Suspense fallback={<ViewLoading />}>
      <TraderTerminalInner />
    </Suspense>
  );
}
