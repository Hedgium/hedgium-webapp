/**
 * Routes that do not require a logged-in session for the AuthInitializing gate.
 * Login lives at `/`. Marketing site is separate (`hedgium_frontend`).
 */
const PUBLIC_PATH_EXACT = new Set([
  "/",
  "/login",
  "/forgot-password",
  "/onboarding",
]);

/** Prefix match: path equals prefix or starts with prefix + "/" */
const PUBLIC_PATH_PREFIXES = [
  "/reset-password/",
] as const;

/** Root URL where the login form lives (`/`). */
export function isLoginRootPath(pathname: string | null | undefined): boolean {
  return pathname === "/" || pathname === "";
}

export function isPublicPath(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  if (PUBLIC_PATH_EXACT.has(pathname)) return true;
  for (const prefix of PUBLIC_PATH_PREFIXES) {
    const base = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    if (pathname === base || pathname.startsWith(`${base}/`)) return true;
  }
  return false;
}

/** Same-origin relative path only. Rejects protocol-relative and open redirects. */
export function getSafeNext(next: string | null): string | null {
  if (!next || typeof next !== "string") return null;
  const path = next.startsWith("/") ? next : `/${next}`;
  if (path.includes("//")) return null;
  return path;
}
