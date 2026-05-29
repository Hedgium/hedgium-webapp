/**
 * Sandbox API — reference account for the selected plan tier.
 */
import { authFetch } from "./api";

function appendPlan(path: string, plan: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}plan=${encodeURIComponent(plan)}`;
}

/**
 * Fetch from `/api/sandbox/*`. Appends `plan` and optional query params.
 */
export async function sandboxFetch(
  path: string,
  plan: string,
  options?: RequestInit,
  queryParams?: Record<string, string | number | boolean>
): Promise<Response> {
  const fullPath = `sandbox/${path.startsWith("sandbox/") ? path.slice(7) : path}`;
  const pathWithPlan = appendPlan(fullPath, plan);
  return authFetch(pathWithPlan, options, queryParams);
}
