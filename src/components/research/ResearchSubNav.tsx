"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineChart, ListTodo } from "lucide-react";

const RESERVED_SEGMENTS = new Set(["tasks"]);

export function isResearchSymbolPath(pathname: string | null): boolean {
  if (!pathname?.startsWith("/admin/research/")) return false;
  const segment = pathname.slice("/admin/research/".length).split("/")[0];
  if (!segment || RESERVED_SEGMENTS.has(segment.toLowerCase())) return false;
  return true;
}

const tabs = [
  {
    href: "/admin/research",
    label: "Reports",
    icon: LineChart,
    isActive: (pathname: string) =>
      pathname === "/admin/research" || isResearchSymbolPath(pathname),
  },
  {
    href: "/admin/research/tasks",
    label: "Jobs",
    icon: ListTodo,
    isActive: (pathname: string) =>
      pathname === "/admin/research/tasks" ||
      pathname.startsWith("/admin/research/tasks/"),
  },
] as const;

export default function ResearchSubNav() {
  const pathname = usePathname() ?? "";

  return (
    <div
      className="mb-6 inline-flex w-full flex-col gap-1 rounded-xl border border-base-300/80 bg-base-200/40 p-1 sm:w-auto sm:flex-row"
      role="tablist"
      aria-label="Research sections"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:min-w-[9rem] ${
              active
                ? "bg-base-100 text-base-content shadow-sm ring-1 ring-base-300/60"
                : "text-base-content/65 hover:bg-base-100/60 hover:text-base-content"
            }`}
          >
            <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
