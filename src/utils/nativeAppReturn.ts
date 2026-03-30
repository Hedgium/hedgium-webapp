import { authFetch } from "@/utils/api";

const STORAGE_KEY = "hedgium_native_return_uri";

const ALLOWED_PROTOCOLS = new Set(["hedgiumapp:", "exp:"]);

export function isAllowedAppRedirectUri(uri: string): boolean {
  try {
    const u = new URL(uri);
    return ALLOWED_PROTOCOLS.has(u.protocol);
  } catch {
    return false;
  }
}

export function persistFromRedirectUriParam(value: string | null): void {
  if (typeof window === "undefined" || value == null || value === "") return;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return;
  }
  if (!isAllowedAppRedirectUri(decoded)) return;
  sessionStorage.setItem(STORAGE_KEY, decoded);
}

export function getPersistedAppReturnUri(): string | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw || !isAllowedAppRedirectUri(raw)) return null;
  return raw;
}

async function redirectToNativeWithOptionalOneTimeToken(uri: string): Promise<void> {
  try {
    const res = await authFetch("users/token/create-token/", { method: "GET" });
    if (res.ok) {
      const data = (await res.json()) as { token?: string };
      if (data.token) {
        const sep = uri.includes("?") ? "&" : "?";
        window.location.assign(
          `${uri}${sep}one_time_token=${encodeURIComponent(data.token)}`
        );
        return;
      }
    }
  } catch {
    /* fall through */
  }
  window.location.assign(uri);
}

/**
 * If the user opened the site from the native app (redirect_uri was stored),
 * send them back to the app (with optional one-time session handoff JWT).
 * Otherwise navigate to webFallbackHref in the SPA.
 */
export async function returnToNativeAppOr(
  router: { push: (href: string) => void },
  webFallbackHref = "/hedgium/home"
): Promise<void> {
  const uri = getPersistedAppReturnUri();
  if (uri) {
    await redirectToNativeWithOptionalOneTimeToken(uri);
    return;
  }
  router.push(webFallbackHref);
}

/** @deprecated Use returnToNativeAppOr — kept for onboarding call sites */
export async function goToPostOnboarding(router: {
  push: (href: string) => void;
}): Promise<void> {
  return returnToNativeAppOr(router, "/hedgium/home");
}
