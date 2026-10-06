/** Stable admin section keys — must match backend `utils.admin_sections.ADMIN_SECTION_KEYS`. */
export const ADMIN_SECTIONS = [
  "strategies",
  "builder",
  "profiles",
  "client_pnl",
  "market",
  "engine1",
  "proxy_pool",
  "leads",
  "whatsapp",
  "alerts",
  "tasks",
  "settings",
  "billing",
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

/** Map admin pathname → section key for UI gating. */
export function adminSectionForPath(pathname: string): AdminSection | null {
  if (!pathname.startsWith("/admin")) return null;
  if (pathname === "/admin" || pathname.startsWith("/admin/strategy/")) {
    return "strategies";
  }
  if (pathname.startsWith("/admin/builder")) return "builder";
  if (pathname.startsWith("/admin/profiles")) return "profiles";
  if (pathname.startsWith("/admin/client-pnl")) return "client_pnl";
  if (pathname.startsWith("/admin/market")) return "market";
  if (pathname.startsWith("/admin/engine1")) return "engine1";
  if (pathname.startsWith("/admin/proxy-pool")) return "proxy_pool";
  if (pathname.startsWith("/admin/leads")) return "leads";
  if (pathname.startsWith("/admin/whatsapp")) return "whatsapp";
  if (pathname.startsWith("/admin/alerts")) return "alerts";
  if (pathname.startsWith("/admin/tasks")) return "tasks";
  if (pathname.startsWith("/admin/settings")) return "settings";
  if (pathname.startsWith("/admin/billing")) return "billing";
  if (pathname.startsWith("/admin/payments")) return "billing";
  if (pathname.startsWith("/admin/research")) return "market";
  return null;
}

/**
 * `admin_sections === null | undefined` means unrestricted (superuser or staff with no groups).
 * An empty array means restricted with no sections granted.
 */
export function canAccessAdminSection(
  adminSections: string[] | null | undefined,
  section: AdminSection | null
): boolean {
  if (section == null) return true;
  if (adminSections == null) return true;
  return adminSections.includes(section);
}
