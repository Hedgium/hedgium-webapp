import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";

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
  const url = buildUrl(endpoint, queryParams);
  const csrftoken = Cookies.get("csrftoken") ?? "";

  const { accessToken, refreshAccessToken } = useAuthStore.getState();

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

  let res = await doFetch(accessToken || undefined);

  if (res.status === 401 && refreshAccessToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const { accessToken: newToken } = useAuthStore.getState();
      res = await doFetch(newToken || undefined);
    }
  }

  return res;
}
