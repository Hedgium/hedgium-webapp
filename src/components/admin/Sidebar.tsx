"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { Home, Briefcase, Bell, Settings, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

const tabs = [
  { name: "Dashboard", href: "/admin", icon: <Home className="h-5 w-5" /> },
  { name: "Builder", href: "/admin/builder", icon: <Settings className="h-5 w-5" /> },
  { name: "Strategies", href: "/admin/strategy", icon: <Briefcase className="h-5 w-5" /> },
  { name: "Profiles", href: "/admin/profiles", icon: <Bell className="h-5 w-5" /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuthStore();


  return (
    <div className="flex flex-col h-full bg-base-200/50 border border-base-300">
      {/* Navigation items */}

      <br />
      <nav className="flex-1 overflow-y-auto px-4">
        <ul className="gap-2 space-y-1">
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