"use client";

// This is for mobile > Mobile Navbar



import Link from "next/link";
import { useTheme } from "next-themes";
import { LineChart, Settings, Moon, Sun, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import CurrentSubscription from "./CurrentSubscription";


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
          href="/hedgium/dashboard"
          className="btn btn-ghost normal-case text-xl font-bold text-primary"
        >
          <LineChart className="mr-2" width="24" height="24" />
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
              <CurrentSubscription />
            <li>
              <Link href="/dashboard/settings">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </li>
            <li>
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? (
                  <>
                    <Moon className="w-4 h-4" /> Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" /> Light Mode
                  </>
                )}
              </button>
            </li>
            <li>
              <button onClick={handleLogout}>
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}