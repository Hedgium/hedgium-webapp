"use client";

import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Layers,
  LineChart,
  LogOut,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useTraderStore } from "@/store/traderStore";
import type { TraderView } from "@/types/trader";

const items: { view: TraderView; label: string; icon: React.ReactNode }[] = [
  { view: "strategies", label: "Strategies", icon: <LineChart className="h-5 w-5" /> },
  { view: "builder", label: "Builder", icon: <Layers className="h-5 w-5" /> },
  { view: "profiles", label: "Profiles", icon: <Users className="h-5 w-5" /> },
  { view: "alerts", label: "Alerts", icon: <Bell className="h-5 w-5" /> },
];

export default function TraderRightNav({ activeView }: { activeView: TraderView }) {
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { navCollapsed, toggleNavCollapsed } = useTraderStore();
  const firstName = user?.first_name?.trim() || user?.username || "Trader";

  return (
    <aside
      aria-label="Trader navigation"
      className={`flex h-full flex-col border-l border-base-300/80 bg-base-200/40 backdrop-blur-sm transition-[width] duration-200 ${
        navCollapsed ? "w-14" : "w-44"
      }`}
    >
      <div
        className={`flex items-center border-b border-base-300/80 px-2 py-2.5 ${
          navCollapsed ? "justify-center" : "justify-between gap-1"
        }`}
      >
        {!navCollapsed ? (
          <p className="min-w-0 flex-1 truncate px-1 text-sm font-semibold tracking-tight">
            {firstName}
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square"
          onClick={toggleNavCollapsed}
          aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
          title={navCollapsed ? "Expand" : "Collapse"}
        >
          {navCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-1.5">
        {items.map((item) => {
          const active = activeView === item.view;
          const badge =
            item.view === "alerts" && unreadCount > 0
              ? unreadCount > 99
                ? "99+"
                : String(unreadCount)
              : null;
          return (
            <Link
              key={item.view}
              href={`/trader?view=${item.view}`}
              className={`relative flex items-center rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors ${
                navCollapsed ? "justify-center" : "gap-2.5"
              } ${
                active
                  ? "bg-base-100 text-primary shadow-sm ring-1 ring-base-300"
                  : "text-base-content/75 hover:bg-base-300/50 hover:text-base-content"
              }`}
              aria-current={active ? "page" : undefined}
              title={item.label}
            >
              <span className="relative inline-flex shrink-0">
                {item.icon}
                {badge && navCollapsed ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-0.5 text-[9px] font-bold text-error-content">
                    {badge}
                  </span>
                ) : null}
              </span>
              {!navCollapsed ? (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {badge ? (
                    <span className="inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-error px-1.5 py-0.5 text-[10px] font-bold text-error-content">
                      {badge}
                    </span>
                  ) : null}
                </>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-base-300/80 p-1.5">
        <button
          type="button"
          className={`btn btn-ghost btn-sm ${navCollapsed ? "btn-square" : "justify-start gap-2"}`}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          title="Theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!navCollapsed ? <span>Theme</span> : null}
        </button>
        <button
          type="button"
          className={`btn btn-ghost btn-sm ${navCollapsed ? "btn-square" : "justify-start gap-2"}`}
          onClick={() => void logout()}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          {!navCollapsed ? <span>Logout</span> : null}
        </button>
      </div>
    </aside>
  );
}
