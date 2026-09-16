import { authFetch } from "@/utils/api";
import type {
  BuilderLeg,
  BuilderLegCreate,
  BuilderLegUpdate,
  PendingValidationResponse,
  StrategyBuilder,
  StrategyBuilderCreate,
  StrategyBuilderResponse,
  StrategyBuilderUpdate,
} from "@/types/builder";
import { isPendingValidation } from "@/types/builder";

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

export type SendBuilderPnlWhatsappResponse = SendBuilderPnlEmailsResponse;
export type SendBuilderPnlWhatsappError = SendBuilderPnlEmailsError;

export type BuilderWriteResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "pending"; data: PendingValidationResponse };

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

export async function sendBuilderPnlWhatsapp(
  builderId: number
): Promise<{ ok: true; data: SendBuilderPnlWhatsappResponse } | { ok: false; data: SendBuilderPnlWhatsappError }> {
  const response = await authFetch(`builder/builders/${builderId}/send-pnl-whatsapp/`, {
    method: "POST",
  });
  const data = (await response.json()) as SendBuilderPnlWhatsappResponse | SendBuilderPnlWhatsappError;
  if (response.ok) {
    return { ok: true, data: data as SendBuilderPnlWhatsappResponse };
  }
  return { ok: false, data: data as SendBuilderPnlWhatsappError };
}

export async function listBuilders(status?: string): Promise<StrategyBuilderResponse> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const query = params.toString();
  const url = query ? `builder/builders/?${query}` : "builder/builders/";
  const response = await authFetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch strategy builders");
  }
  return (await response.json()) as StrategyBuilderResponse;
}

export async function getBuilder(builderId: number): Promise<StrategyBuilder> {
  const response = await authFetch(`builder/builders/${builderId}/`);
  if (!response.ok) {
    throw new Error("Failed to fetch strategy builder");
  }
  return (await response.json()) as StrategyBuilder;
}

export async function createBuilder(
  data: StrategyBuilderCreate
): Promise<StrategyBuilder> {
  const response = await authFetch("builder/builders/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create strategy builder");
  }
  return (await response.json()) as StrategyBuilder;
}

export async function updateBuilder(
  builderId: number,
  data: StrategyBuilderUpdate
): Promise<BuilderWriteResult<StrategyBuilder>> {
  const response = await authFetch(`builder/builders/${builderId}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error("Failed to update strategy builder");
  }
  if (isPendingValidation(body)) {
    return { kind: "pending", data: body };
  }
  return { kind: "ok", data: body as StrategyBuilder };
}

export async function deleteBuilder(
  builderId: number
): Promise<BuilderWriteResult<{ success: boolean }>> {
  const response = await authFetch(`builder/builders/${builderId}/`, {
    method: "DELETE",
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error("Failed to delete strategy builder");
  }
  if (isPendingValidation(body)) {
    return { kind: "pending", data: body };
  }
  return { kind: "ok", data: body as { success: boolean } };
}

export async function createBuilderLeg(
  data: BuilderLegCreate
): Promise<BuilderWriteResult<BuilderLeg>> {
  const response = await authFetch("builder/legs/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error("Failed to create builder leg");
  }
  if (isPendingValidation(body)) {
    return { kind: "pending", data: body };
  }
  return { kind: "ok", data: body as BuilderLeg };
}

export async function updateBuilderLeg(
  legId: number,
  data: BuilderLegUpdate
): Promise<BuilderWriteResult<BuilderLeg>> {
  const response = await authFetch(`builder/legs/${legId}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error("Failed to update builder leg");
  }
  if (isPendingValidation(body)) {
    return { kind: "pending", data: body };
  }
  return { kind: "ok", data: body as BuilderLeg };
}

export async function deleteBuilderLeg(
  legId: number
): Promise<BuilderWriteResult<{ success: boolean }>> {
  const response = await authFetch(`builder/legs/${legId}/`, {
    method: "DELETE",
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error("Failed to delete builder leg");
  }
  if (isPendingValidation(body)) {
    return { kind: "pending", data: body };
  }
  return { kind: "ok", data: body as { success: boolean } };
}
