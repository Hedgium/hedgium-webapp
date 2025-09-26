"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { useAuthStore } from "@/store/authStore";

export default function AuthNav() {
  const { theme, setTheme } = useTheme();

  const { logout } = useAuthStore();

  const handleLogout = () => {
    // clear auth (you’ll handle in store or context)
    logout();
  };

  return (
    <div className="navbar md:hidden sticky top-0 z-50 bg-base-100 shadow-sm px-4">
      {/* Left side brand */}
      <div className="flex-1">
        <Link
          href="/"
          className="btn btn-ghost normal-case text-xl font-bold text-primary"
        >
          <Icon icon="mdi:chart-line" className="mr-2" width="24" height="24" />
          Hedgium
        </Link>
      </div>

      {/* Right side user dropdown */}
      <div className="flex-none">
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              <img
                src="https://ui-avatars.com/api/?name=User"
                alt="User Avatar"
              />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <Link href="/dashboard/settings">
                <Icon icon="mdi:cog" className="w-4 h-4" /> Settings
              </Link>
            </li>
            <li>
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? (
                  <>
                    <Icon icon="mdi:moon-waxing-crescent" className="w-4 h-4" />{" "}
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:white-balance-sunny" className="w-4 h-4" />{" "}
                    Light Mode
                  </>
                )}
              </button>
            </li>
            <li>
              <button onClick={handleLogout}>
                <Icon icon="mdi:logout" className="w-4 h-4" /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
