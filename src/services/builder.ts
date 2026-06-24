import { authFetch } from "@/utils/api";

export type SendBuilderPnlEmailsResponse = {
  status: string;
  task_id: string;
  recipient_count: number;
  message: string;
};

export type SendBuilderPnlEmailsError = {
  status?: string;
  message?: string;
};

export async function sendBuilderPnlEmails(
  builderId: number
): Promise<{ ok: true; data: SendBuilderPnlEmailsResponse } | { ok: false; data: SendBuilderPnlEmailsError }> {
  const response = await authFetch(`builder/builders/${builderId}/send-pnl-emails/`, {
    method: "POST",
  });
  const data = (await response.json()) as SendBuilderPnlEmailsResponse | SendBuilderPnlEmailsError;
  if (response.ok) {
    return { ok: true, data: data as SendBuilderPnlEmailsResponse };
  }
  return { ok: false, data: data as SendBuilderPnlEmailsError };
}
