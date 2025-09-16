import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";

/**
 * Utility: Build URL with query params
 */
function buildUrl(endpoint: string, queryParams?: Record<string, string | number | boolean>): string {
  const url = new URL(`/api/proxy/${endpoint}`, window.location.origin);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
}

/**
 * Generic fetch with CSRF token (no auth)
 */
export async function myFetch(
  endpoint: string,
  options: RequestInit = {},
  queryParams?: Record<string, string | number | boolean>
): Promise<Response> {
  const url = buildUrl(endpoint, queryParams);
  const csrftoken = Cookies.get("csrftoken") ?? "";

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
      ...(options.headers || {}),
    },
    credentials: "include", // Needed for cookies (refresh token, CSRF)
  });
}

/**
 * Authenticated fetch with auto Authorization header + token refresh
 */
export async function authFetch(
  endpoint: string,
  options: RequestInit = {},
  queryParams?: Record<string, string | number | boolean>
): Promise<Response> {
  const url = buildUrl(endpoint, queryParams);
  const csrftoken = Cookies.get("csrftoken") ?? "";

  const { accessToken, refreshAccessToken } = useAuthStore.getState();

  const doFetch = async (token?: string) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      credentials: "include",
    });

  // 1st attempt
  let res = await doFetch(accessToken || undefined);

  // Retry if 401 → try refreshing token
  if (res.status === 401 && refreshAccessToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const { accessToken: newToken } = useAuthStore.getState();
      res = await doFetch(newToken || undefined);
    }
  }

  return res;
}
