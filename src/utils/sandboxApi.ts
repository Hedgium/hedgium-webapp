/**
 * Sandbox API - fetches from sandbox endpoints with plan param.
 * Used when in Sandbox Mode. Returns real data from other users on the selected plan.
 */
import { authFetch } from "./api";

function appendPlan(path: string, plan: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}plan=${encodeURIComponent(plan)}`;
}

/**
 * Fetch from sandbox API. Appends plan to path.
 * @param path - e.g. "trade-cycles/?approved=true&page=1"
 * @param plan - BASIC | MASTERS | LEGENDS
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
