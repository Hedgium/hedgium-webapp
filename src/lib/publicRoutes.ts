/**
 * Routes that do not require a logged-in session for the AuthInitializing gate.
 * Login lives at `/`; marketing at `/welcome`.
 */
const PUBLIC_PATH_EXACT = new Set([
  "/",
  "/welcome",
  "/login",
  "/get-started",
  "/forgot-password",
  "/onboarding",
]);

/** Prefix match: path equals prefix or starts with prefix + "/" */
const PUBLIC_PATH_PREFIXES = [
  "/reset-password/",
  "/onboarding/",
  "/terms-of-use",
  "/privacy-policy",
  "/refund-policy",
  "/grievance-redressal",
  "/complaint-status",
  "/mitc-ra",
  "/web-login",
] as const;

/** Root URL where the login form lives (`/`). */
export function isLoginRootPath(pathname: string | null | undefined): boolean {
  return pathname === "/" || pathname === "";
}

export function isPublicPath(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  if (PUBLIC_PATH_EXACT.has(pathname)) return true;
  for (const prefix of PUBLIC_PATH_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true;
  }
  return false;
}
