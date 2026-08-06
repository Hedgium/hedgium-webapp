"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { Bell, Layers, LineChart, Users, ListTodo, CreditCard, MessageCircle, Phone, Sun, Moon, LogOut, ChevronLeft, ChevronRight, Network, CandlestickChart, IndianRupee, FlaskConical, Settings2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useNotificationStore } from "@/store/notificationStore";
import { useWhatsAppStore } from "@/store/whatsappStore";

const tabs = [
  { name: "Strategies", href: "/admin", icon: <LineChart className="h-5 w-5" /> },
  { name: "Builder", href: "/admin/builder", icon: <Layers className="h-5 w-5" /> },
  { name: "Profiles", href: "/admin/profiles", icon: <Users className="h-5 w-5" /> },
  { name: "Client PnL", href: "/admin/client-pnl", icon: <IndianRupee className="h-5 w-5" /> },
  { name: "Market", href: "/admin/market", icon: <CandlestickChart className="h-5 w-5" /> },
  // { name: "Research", href: "/admin/research", icon: <FlaskConical className="h-5 w-5" /> },
  { name: "Proxy pool", href: "/admin/proxy-pool", icon: <Network className="h-5 w-5" /> },
  { name: "Leads", href: "/admin/leads", icon: <MessageCircle className="h-5 w-5" /> },
  { name: "WhatsApp", href: "/admin/whatsapp", icon: <Phone className="h-5 w-5" /> },
  { name: "Alerts", href: "/admin/alerts", icon: <Bell className="h-5 w-5" /> },
  { name: "Tasks", href: "/admin/tasks", icon: <ListTodo className="h-5 w-5" /> },
  { name: "Settings", href: "/admin/settings", icon: <Settings2 className="h-5 w-5" /> },
  { name: "Payments", href: "/admin/payments", icon: <CreditCard className="h-5 w-5" /> },
];

const WHATSAPP_UNREAD_POLL_MS = 120_000;

function tabBadgeCount(
  tabName: string,
  unreadAlertCount: number,
  whatsappUnreadCount: number
) {
  if (tabName === "Alerts") return unreadAlertCount;
  if (tabName === "WhatsApp") return whatsappUnreadCount;
  return 0;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { unreadCount: whatsappUnreadCount, fetchUnreadCount } = useWhatsAppStore();
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

  useEffect(() => {
    void fetchUnreadCount();
    const interval = setInterval(() => void fetchUnreadCount(), WHATSAPP_UNREAD_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

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
      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Admin navigation">
        <ul className="gap-2 space-y-1">
          {tabs.map((tab, idx) => {
            const active =
              tab.href === "/admin"
                ? pathname === "/admin"
                : tab.href === "/admin/research"
                  ? pathname.startsWith("/admin/research")
                  : pathname === tab.href;
            const badgeCount = tabBadgeCount(
              tab.name,
              unreadCount,
              whatsappUnreadCount
            );
            const badgeLabel =
              tab.name === "WhatsApp" ? "unread WhatsApp messages" : "unread alerts";
            const badgeClassName =
              tab.name === "WhatsApp"
                ? "bg-primary text-primary-content"
                : "bg-error text-error-content";
            return (
              <li key={idx}>
                <Link
                  href={tab.href}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all ${
                    active ? "bg-base-300 text-primary" : "hover:bg-base-300/70"
                  } ${isCollapsed ? "justify-center px-2" : ""}`}
                  aria-current={active ? "page" : undefined}
                  title={isCollapsed ? tab.name : undefined}
                >
                  <span className="relative inline-flex shrink-0 items-center justify-center">
                    {tab.icon}
                    {badgeCount > 0 && isCollapsed ? (
                      <span
                        className={`absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none ${badgeClassName}`}
                        aria-label={`${badgeCount} ${badgeLabel}`}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    ) : null}
                  </span>
                  {!isCollapsed ? (
                    <>
                      <span className="min-w-0 flex-1 font-medium">{tab.name}</span>
                      {badgeCount > 0 ? (
                        <span
                          className={`inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClassName}`}
                        >
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      ) : null}
                    </>
                  ) : null}
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
            className={`btn btn-ghost  normal-case gap-2 hover:bg-base-300/70 hover:border-none ${
              isCollapsed ? "justify-center px-2" : "justify-start"
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
              router.push("/");
            }}
            className={`btn btn-ghost  normal-case gap-2 text-error hover:bg-base-300/70 hover:border-none hover:text-error-content ${
              isCollapsed ? "justify-center px-2" : "justify-start"
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