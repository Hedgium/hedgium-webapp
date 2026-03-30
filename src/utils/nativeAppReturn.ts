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

export function goToPostOnboarding(router: { push: (href: string) => void }): void {
  const uri = getPersistedAppReturnUri();
  if (uri) {
    window.location.assign(uri);
    return;
  }
  router.push("/hedgium/home");
}
