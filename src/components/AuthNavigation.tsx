"use client";

// components/AuthNavigation.tsx

import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { Home, Briefcase, Bell, Settings, LineChart, Sun, Moon, LogOut, FileText, FlaskConical } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useNotificationStore } from "@/store/notificationStore";
import KycStatusIndicator from "@/components/KycStatusIndicator";

const tabs = [
  { name: "Dashboard", href: "/hedgium/dashboard", icon: <Home className="h-5 w-5" /> },
  { name: "Positions", href: "/hedgium/positions", icon: <Briefcase className="h-5 w-5" /> },
  { name: "Reports", href: "/hedgium/reports", icon: <FileText className="h-5 w-5" /> },
  { name: "Alerts", href: "/hedgium/alerts", icon: <Bell className="h-5 w-5" /> },
  { name: "Settings", href: "/hedgium/settings", icon: <Settings className="h-5 w-5" /> },
];

export default function AuthNavigation({ sidebar = false }: { sidebar?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuthStore();

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const displayName = fullName || user?.username || "User";
  const displayEmail = user?.email || "";
  const planName = user?.active_subscription?.plan?.name || "No Active Plan";
  const isLegends = planName === "LEGENDS";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const { unreadCount } = useNotificationStore();

  const sendToPage = (url: string) => {
    router.push(url);
  };

  // ----- Sidebar layout (desktop) -----
  if (sidebar) {
    return (
      <div className="flex flex-col h-full bg-base-200/50 border border-base-300">
        <div className="px-4 py-3 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-semibold shrink-0">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm font-semibold text-base-content truncate">{displayName}</p>
                <KycStatusIndicator className="shrink-0" />
              </div>
              {displayEmail ? (
                <p className="text-xs text-base-content/60 truncate">{displayEmail}</p>
              ) : null}
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-xs font-medium ${isLegends ? "text-warning" : "text-primary"} truncate`}>
                  Plan: {planName}
                </span>
                {!isLegends && user?.active_subscription?.plan?.name ? (
                  <Link href="/hedgium/upgrade" className="text-[11px] text-primary hover:underline">
                    Upgrade
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>


        {/* <div className="p-4 border-b border-base-300">
          <Link href="/hedgium/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary">
            <LineChart width="26" height="26" className="text-primary" />
            <span>Hedgium</span>
          </Link>
        </div> */}

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-4 mt-4">
          <ul className="gap-2 space-y-1">
            {/* <li>
              <Link
                href="/sandbox"
                className="flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg transition-all hover:bg-base-300/70 text-warning"
              >
                <FlaskConical className="h-5 w-5" />
                <span className="font-medium">Sandbox</span>
              </Link>
            </li> */}
            {tabs.map((tab, idx) => {
              const active = pathname === tab.href;
              return (
                <li key={idx}>
                  <Link
                    href={tab.href}
                    className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg transition-all ${active ? "bg-base-300 text-primary" : "hover:bg-base-300/70"
                      }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.name}</span>

                    {/* Unread indicator for Alerts */}
                    {tab.name === "Alerts" && unreadCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </li>


              );
            })}
          </ul>
        </nav>

        {/* bottom controls */}
        <div className="p-4 border-t border-base-300">


          <div className="flex flex-col gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="btn btn-ghost justify-start normal-case gap-2 hover:bg-base-300/70 hover:border-none"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>Theme</span>
            </button>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="btn btn-ghost justify-start normal-case gap-2 text-error hover:bg-base-300/70 hover:border-none hover:text-error-content"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----- Mobile bottom dock -----
  return (
    <div className="dock md:hidden z-40 backdrop-blur-sm">
      {tabs.map((tab, index) => {
        const active = pathname === tab.href;
        return (
          <button
            key={index}
            onClick={() => sendToPage(tab.href)}
            className={`relative text-xs transition-all ${active ? "active text-primary" : ""}`}
          >
            {tab.icon}
            <span className="btm-nav-label">{tab.name}</span>

            {/* Unread indicator for Alerts */}
            {tab.name === "Alerts" && unreadCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>

  );
}