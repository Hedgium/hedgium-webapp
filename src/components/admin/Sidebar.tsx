"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { Home, Briefcase, Bell, Settings, Sun, Moon, LogOut, ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

const tabs = [
  { name: "Dashboard", href: "/admin", icon: <Home className="h-5 w-5" /> },
  { name: "Builder", href: "/admin/builder", icon: <Settings className="h-5 w-5" /> },
  { name: "Strategies", href: "/admin/strategy", icon: <Briefcase className="h-5 w-5" /> },
  { name: "Profiles", href: "/admin/profiles", icon: <Bell className="h-5 w-5" /> },
  { name: "Payments", href: "/admin/payments", icon: <Receipt className="h-5 w-5" /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("adminSidebarCollapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", isCollapsed.toString());
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`flex flex-col h-full bg-base-200/50 border border-base-300 transition-all duration-300 ${
      isCollapsed ? "w-16" : "w-56"
    }`}>
      {/* Toggle button */}
      <div className="flex justify-end p-2 border-b border-base-300">
        <button
          onClick={toggleSidebar}
          className="btn btn-ghost btn-sm btn-circle"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="gap-2 space-y-1">
          {tabs.map((tab, idx) => {
            const active = pathname === tab.href;
            return (
              <li key={idx}>
                <Link
                  href={tab.href}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-all ${
                    active ? "bg-base-300 text-primary" : "hover:bg-base-300/70"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  aria-current={active ? "page" : undefined}
                  title={isCollapsed ? tab.name : undefined}
                >
                  {tab.icon}
                  {!isCollapsed && <span className="font-medium">{tab.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* bottom controls */}
      <div className={`p-2 border-t border-base-300 ${isCollapsed ? "px-2" : "px-4"}`}>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`btn btn-ghost justify-start normal-case gap-2 hover:bg-base-300/70 hover:border-none ${
              isCollapsed ? "justify-center px-2" : ""
            }`}
            aria-label="Toggle theme"
            title={isCollapsed ? "Toggle Theme" : undefined}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {!isCollapsed && <span>Theme</span>}
          </button>

          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className={`btn btn-ghost justify-start normal-case gap-2 text-error hover:bg-base-300/70 hover:border-none hover:text-error-content ${
              isCollapsed ? "justify-center px-2" : ""
            }`}
            aria-label="Logout"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
}