import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";

/** Shared in-flight refresh so concurrent 401s do not stampede. */
let refreshInFlight: Promise<boolean> | null = null;

async function singleFlightRefresh(): Promise<boolean> {
  const { refreshAccessToken } = useAuthStore.getState();
  if (!refreshAccessToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function isSessionRequiredResponse(res: Response): Promise<boolean> {
  if (res.status !== 403) return false;
  try {
    const clone = res.clone();
    const data = (await clone.json()) as { error?: string };
    return data?.error === "session_required";
  } catch {
    return false;
  }
}

/**
 * When `user.is_demo` is true (from `GET users/auth/me/`), route data calls to
 * `/api/demo/...` synthetic fixtures. Auth and `users/token/*` stay on real paths.
 */
export function resolveDemoEndpoint(endpoint: string, isDemo: boolean): string {
  const raw = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  if (!isDemo) return raw;
  if (raw === "users" || raw.startsWith("users/auth/") || raw.startsWith("users/token/")) {
    return raw;
  }
  if (raw.startsWith("users/")) {
    return raw;
  }
  if (raw.startsWith("demo/")) {
    return raw;
  }

  const [pathPart, queryPart] = raw.split("?", 2);
  let normalized = pathPart.replace(
    /^positions\/pnl\/refresh\/trades\/async\/\d+\/?$/,
    "positions/pnl/refresh/trades/async/"
  );
  if (!normalized.endsWith("/")) {
    normalized += "/";
  }
  const withQuery = queryPart ? `${normalized}?${queryPart}` : normalized;
  return `demo/${withQuery}`;
}

/**
 * Utility: Build URL with query params
 */
function buildUrl(
  endpoint: string,
  queryParams?: Record<string, string | number | boolean>
): string {
  const url = new URL(`/api/proxy/${endpoint}`, window.location.origin);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

/**
 * Authenticated fetch with single-flight refresh.
 * Does not refresh on proxy `session_required` (403) — clears local session instead.
 */
async function withAuthRetry(
  doFetch: (token?: string) => Promise<Response>,
  options?: { canRetry?: () => boolean }
): Promise<Response> {
  const { accessToken, clearLocalSession } = useAuthStore.getState();
  let res = await doFetch(accessToken || undefined);

  if (await isSessionRequiredResponse(res)) {
    clearLocalSession();
    return res;
  }

  if (res.status === 401 && (options?.canRetry?.() ?? true)) {
    const refreshed = await singleFlightRefresh();
    if (refreshed) {
      const { accessToken: newToken } = useAuthStore.getState();
      res = await doFetch(newToken || undefined);

      if (await isSessionRequiredResponse(res)) {
        clearLocalSession();
        return res;
      }

      if (res.status === 401) {
        clearLocalSession();
      }
    }
  }

  return res;
}

/**
 * Generic fetch (no auth)
 */
export async function myFetch(
  endpoint: string,
  options: RequestInit = {},
  queryParams?: Record<string, string | number | boolean>
): Promise<Response> {
  const url = buildUrl(endpoint, queryParams);
  const csrftoken = Cookies.get("csrftoken") ?? "";

  const headers: HeadersInit = {
    "X-CSRFToken": csrftoken,
    ...(options.headers || {}),
  };

  if (!isFormData(options.body)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

/**
 * Authenticated fetch with auto Authorization + token refresh
 */
export async function authFetch(
  endpoint: string,
  options: RequestInit = {},
  queryParams?: Record<string, string | number | boolean>
): Promise<Response> {
  const { user } = useAuthStore.getState();
  const resolved = resolveDemoEndpoint(endpoint, Boolean(user?.is_demo));
  const url = buildUrl(resolved, queryParams);
  const csrftoken = Cookies.get("csrftoken") ?? "";

  const doFetch = async (token?: string) => {
    const headers: HeadersInit = {
      "X-CSRFToken": csrftoken,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    if (!isFormData(options.body)) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  return withAuthRetry(doFetch);
}

function buildResearchUrl(
  symbol: string,
  options?: { latest?: boolean }
): string {
  const ticker = symbol.trim().toUpperCase();
  const suffix = options?.latest ? "latest/" : "";
  return new URL(
    `/api/research-proxy/${ticker}/${suffix}`,
    window.location.origin
  ).toString();
}

/**
 * Fetch stock research report via server-side proxy (requires session).
 */
export async function researchFetch(
  symbol: string,
  options?: { latest?: boolean; signal?: AbortSignal }
): Promise<Response> {
  const url = buildResearchUrl(symbol, options);
  const csrftoken = Cookies.get("csrftoken") ?? "";

  const doFetch = async (token?: string) => {
    const headers: HeadersInit = {
      "X-CSRFToken": csrftoken,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
      signal: options?.signal,
    });
  };

  return withAuthRetry(doFetch, {
    canRetry: () => !options?.signal?.aborted,
  });
}

function buildResearchProxyUrl(
  path: string,
  queryParams?: Record<string, string | number | boolean>
): string {
  const normalized = path.replace(/^\//, "").replace(/\/?$/, "/");
  const url = new URL(`/api/research-proxy/${normalized}`, window.location.origin);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
}

/**
 * Authenticated fetch to hedgium_research via server proxy (staff only).
 */
export async function researchProxyFetch(
  path: string,
  options: RequestInit = {},
  queryParams?: Record<string, string | number | boolean>
): Promise<Response> {
  const url = buildResearchProxyUrl(path, queryParams);
  const csrftoken = Cookies.get("csrftoken") ?? "";

  const doFetch = async (token?: string) => {
    const headers: HeadersInit = {
      "X-CSRFToken": csrftoken,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const hasBody = options.body != null;
    if (!hasBody && options.method && options.method !== "GET") {
      headers["Content-Type"] = "application/json";
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  return withAuthRetry(doFetch);
}
