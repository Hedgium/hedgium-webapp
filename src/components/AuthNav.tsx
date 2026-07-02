"use client";

// Mobile top navbar — DaisyUI dropdown needs .dropdown-open on touch (focus often missing on tap)

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LineChart, Settings, Moon, Sun, LogOut, FlaskConical } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSandboxStore } from "@/store/sandboxStore";
import KycStatusIndicator from "@/components/KycStatusIndicator";
import { useHasAssignedTradeCycles } from "@/hooks/useHasAssignedTradeCycles";

export default function AuthNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuthStore();
  const { clearSandboxPlan } = useSandboxStore();
  const isSandbox = pathname?.startsWith("/sandbox");
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { hasAssigned, loading: tradeCyclesLoading } = useHasAssignedTradeCycles();
  const showSandbox = !tradeCyclesLoading && hasAssigned === false;

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

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

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="navbar md:hidden sticky top-0 z-50 min-h-[3.25rem] border-b border-base-300/80 bg-base-100/95 px-3 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-base-100/80">
      <div className="flex-1 min-w-0">
        <Link
          href="/home"
          className="btn btn-ghost btn-sm normal-case h-auto min-h-0 py-2 px-2 text-lg font-bold text-primary gap-1.5"
        >
          <img src="/images/logos/Hedgium icon cropped.png" alt="Hedgium" className="h-10 w-auto" />
          {/* <LineChart className="shrink-0" width={22} height={22} />
          <span className="truncate">Hedgium</span> */}
        </Link>
      </div>

      <div className="flex-none flex items-center gap-2 shrink-0 overflow-visible pr-0.5">
        <KycStatusIndicator variant="nav" />
        <div
          ref={dropdownRef}
          className={`dropdown dropdown-end ${menuOpen ? "dropdown-open" : ""}`}
        >
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label={`Account menu for ${displayName}`}
            className="btn btn-primary btn-circle btn-sm w-8 h-8 min-h-8 p-0 text-xs font-bold border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="flex h-full w-full items-center justify-center rounded-full" aria-hidden="true">
              {initials || "U"}
            </span>
          </button>

          <ul className="menu dropdown-content mt-2 z-[200] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300">
            <li className="px-3 py-2 border-b border-base-300 mb-1">
              <p className="font-semibold text-sm text-base-content">{displayName}</p>
              {displayEmail ? (
                <p className="text-xs text-base-content/70 truncate">{displayEmail}</p>
              ) : null}
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-medium ${isLegends ? "text-warning" : "text-primary"} truncate`}
                >
                  Plan: {planName}
                </span>
                {/* {!isLegends && user?.active_subscription?.plan?.name ? (
                  <Link href="/upgrade" className="text-[11px] text-primary hover:underline">
                    Upgrade
                  </Link>
                ) : null} */}
              </div>
            </li>
            <li>
              <Link href="/settings" onClick={() => setMenuOpen(false)}>
                <Settings className="w-4 h-4" aria-hidden="true" /> Settings
              </Link>
            </li>
            {showSandbox ? (
              <li>
                {isSandbox ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearSandboxPlan();
                      setMenuOpen(false);
                      router.push("/sandbox");
                    }}
                  >
                    <FlaskConical className="w-4 h-4" aria-hidden="true" /> Change plan
                  </button>
                ) : (
                  <Link href="/sandbox" onClick={() => setMenuOpen(false)}>
                    <FlaskConical className="w-4 h-4" aria-hidden="true" /> Switch to Sandbox
                  </Link>
                )}
              </li>
            ) : null}
            <li>
              <button
                type="button"
                onClick={() => {
                  setTheme(theme === "light" ? "dark" : "light");
                  setMenuOpen(false);
                }}
              >
                {theme === "light" ? (
                  <>
                    <Moon className="w-4 h-4" aria-hidden="true" /> Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" aria-hidden="true" /> Light Mode
                  </>
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="w-4 h-4" aria-hidden="true" /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
