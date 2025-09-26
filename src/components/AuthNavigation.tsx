// components/AuthNavigation.tsx
"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";

import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

const tabs = [
  { name: "Dashboard", href: "/hedgium/dashboard", icon: "lucide:home" },
  { name: "Positions", href: "/hedgium/positions", icon: "lucide:briefcase" },
  { name: "Alerts", href: "/hedgium/alerts", icon: "lucide:bell" },
  { name: "Settings", href: "/hedgium/settings", icon: "lucide:cog" },
];

export default function AuthNavigation({ sidebar = false }: { sidebar?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuthStore();

  const sendToPage = (url: string) => {
    router.push(url);
  };

  // ----- Sidebar layout (desktop) -----
  if (sidebar) {
    return (
      <div className="flex flex-col h-full bg-base-200/50 border border-base-300">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-base-300">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Icon icon="mdi:chart-line" width="26" height="26" className="text-primary" />
            <span>Hedgium</span>
          </Link>
        </div>
        
        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="gap-2 space-y-1">
            {tabs.map((tab, idx) => {
              const active = pathname === tab.href;
              return (
                <li key={idx}>
                  <Link
                    href={tab.href}
                    className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg transition-all ${active 
                      ? 'bg-primary text-primary-content shadow-sm' 
                      : 'hover:bg-base-300/70'}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon icon={tab.icon} className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
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
              className="btn btn-ghost justify-start normal-case gap-2"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Icon icon="lucide:sun" className="h-4 w-4" />
              ) : (
                <Icon icon="lucide:moon" className="h-4 w-4" />
              )}
              <span>Theme</span>
            </button>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="btn btn-ghost justify-start normal-case gap-2 text-error hover:text-error-content"
              aria-label="Logout"
            >
              <Icon icon="mdi:logout" className="h-4 w-4" />
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
            className={`text-xs transition-all ${active ? 'active text-primary' : ''}`}
          >
            <Icon icon={tab.icon} className="h-5 w-5 mx-auto" />
            <span className="btm-nav-label">{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
}
