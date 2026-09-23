import { authFetch } from "@/utils/api";

const CELERY_TERMINAL_STATUSES = new Set([
  "SUCCESS",
  "FAILURE",
  "REVOKED",
]);

/** Poll until Celery reports a terminal state (or timeout). */
export async function waitForCeleryTaskComplete(
  taskId: string,
  options: { pollMs?: number; maxMs?: number } = {}
): Promise<string> {
  const pollMs = options.pollMs ?? 1500;
  const maxMs = options.maxMs ?? 10 * 60 * 1000;
  const started = Date.now();
  for (;;) {
    const res = await authFetch(
      `tasks/status/${encodeURIComponent(taskId)}/`
    );
    if (!res.ok) {
      throw new Error(`Task status request failed (${res.status})`);
    }
    const data = (await res.json()) as { status?: string };
    const status = data.status ?? "UNKNOWN";
    if (CELERY_TERMINAL_STATUSES.has(status)) return status;
    if (Date.now() - started > maxMs) {
      throw new Error("Timed out waiting for task");
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}
