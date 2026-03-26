"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { Home, Briefcase, Settings, FileText, Sun, Moon, LogOut, LogIn, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useSandboxStore } from "@/store/sandboxStore";

const tabs = [
  { name: "Home", href: "/sandbox/dashboard", icon: <Home className="h-5 w-5" /> },
  { name: "Positions", href: "/sandbox/positions", icon: <Briefcase className="h-5 w-5" /> },
  { name: "Reports", href: "/sandbox/reports", icon: <FileText className="h-5 w-5" /> },
  { name: "Settings", href: "/sandbox/settings", icon: <Settings className="h-5 w-5" /> },
];

export default function SandboxNavigation({ sidebar = false }: { sidebar?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuthStore();
  const { sandboxPlan, clearSandboxPlan } = useSandboxStore();

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || "User";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const sendToPage = (url: string) => router.push(url);

  if (sidebar) {
    return (
      <div className="flex flex-col h-full bg-base-200/50 border border-base-300">
        <div className="px-4 py-3 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-semibold shrink-0">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-base-content truncate">{displayName}</p>
              <button
                type="button"
                onClick={() => {
                  clearSandboxPlan();
                  router.push("/sandbox");
                }}
                className="flex items-center gap-1.5 text-xs text-warning font-medium truncate hover:underline mt-0.5 text-left"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                Plan: {sandboxPlan || "—"} (change)
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 mt-4">
          <ul className="gap-2 space-y-1">
            {tabs.map((tab, idx) => {
              const active = pathname === tab.href;
              return (
                <li key={idx}>
                  <Link
                    href={tab.href}
                    className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg transition-all ${
                      active ? "bg-base-300 text-primary" : "hover:bg-base-300/70"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-base-300 flex flex-col gap-2">
          <Link
            href="/hedgium/home"
            className="btn btn-ghost justify-start normal-case gap-2 hover:bg-base-300/70"
          >
            <LogIn className="h-4 w-4" />
            Exit Sandbox
          </Link>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="btn btn-ghost justify-start normal-case gap-2 hover:bg-base-300/70"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>Theme</span>
          </button>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="btn btn-ghost justify-start normal-case gap-2 text-error hover:bg-base-300/70"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    );
  }

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
          </button>
        );
      })}
    </div>
  );
}
