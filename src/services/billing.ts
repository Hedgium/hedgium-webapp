import { authFetch, myFetch } from "@/utils/api";
import type {
  BillingClient,
  BillingClientListResponse,
  CurrentQuarter,
  GenerateResponse,
  Invoice,
  InvoiceListResponse,
  PublicInvoice,
} from "@/types/billing";

export async function fetchCurrentQuarter(): Promise<CurrentQuarter> {
  const res = await authFetch("billing/current-quarter/");
  if (!res.ok) throw new Error("Failed to load current quarter");
  return res.json();
}

export async function listBillingClients(params: {
  q?: string;
  client_type?: string;
  page?: number;
  page_size?: number;
}): Promise<BillingClientListResponse> {
  const query: Record<string, string | number | boolean> = {};
  if (params.q) query.q = params.q;
  if (params.client_type) query.client_type = params.client_type;
  if (params.page != null) query.page = params.page;
  if (params.page_size != null) query.page_size = params.page_size;
  const res = await authFetch("billing/clients/", {}, query);
  if (!res.ok) throw new Error("Failed to load billing clients");
  return res.json();
}

export async function updateBillingClientFee(
  userId: number,
  payload: {
    billing_fee_mode: string;
    billing_annual_rate?: number | null;
    billing_fixed_quarterly?: number | null;
  }
): Promise<BillingClient> {
  const res = await authFetch(`billing/clients/${userId}/fee/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update client fee");
  }
  return res.json();
}

export async function generateInvoices(
  fy: string,
  quarter: string
): Promise<GenerateResponse> {
  const res = await authFetch("billing/generate/", {
    method: "POST",
    body: JSON.stringify({ fy, quarter }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate invoices");
  }
  return res.json();
}

export async function generateOneInvoice(payload: {
  user_id?: number;
  email?: string;
  fy: string;
  quarter: string;
  as_of?: string;
  fee_mode?: string;
  annual_rate?: number;
  fixed_quarterly?: number;
}): Promise<Invoice> {
  const res = await authFetch("billing/generate-one/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate invoice");
  }
  return res.json();
}

export async function listInvoices(params: {
  fy?: string;
  quarter?: string;
  status?: string;
  client_type?: string;
  last_quarter_paid?: string;
  page?: number;
  page_size?: number;
}): Promise<InvoiceListResponse> {
  const query: Record<string, string | number | boolean> = {};
  if (params.fy) query.fy = params.fy;
  if (params.quarter) query.quarter = params.quarter;
  if (params.status) query.status = params.status;
  if (params.client_type) query.client_type = params.client_type;
  if (params.last_quarter_paid) query.last_quarter_paid = params.last_quarter_paid;
  if (params.page != null) query.page = params.page;
  if (params.page_size != null) query.page_size = params.page_size;
  const res = await authFetch("billing/invoices/", {}, query);
  if (!res.ok) throw new Error("Failed to list invoices");
  return res.json();
}

export async function issueInvoice(id: number): Promise<Invoice> {
  const res = await authFetch(`billing/invoices/${id}/issue/`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to issue invoice");
  }
  return res.json();
}

export async function issueDrafts(fy: string, quarter: string): Promise<{ issued: number }> {
  const res = await authFetch("billing/issue/", {
    method: "POST",
    body: JSON.stringify({ fy, quarter }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to issue drafts");
  }
  return res.json();
}

export async function voidInvoice(id: number, notes?: string): Promise<Invoice> {
  const res = await authFetch(`billing/invoices/${id}/void/`, {
    method: "POST",
    body: JSON.stringify({ notes: notes || "" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to void invoice");
  }
  return res.json();
}

export async function updateInvoice(
  id: number,
  payload: {
    fee_amount?: number;
    fee_base?: number;
    fee_mode?: string;
    fee_rate?: number;
    fixed_fee_amount?: number;
    period_end?: string;
    notes?: string;
    is_final?: boolean;
  }
): Promise<Invoice> {
  const res = await authFetch(`billing/invoices/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update invoice");
  }
  return res.json();
}

export async function deleteInvoice(id: number): Promise<void> {
  const res = await authFetch(`billing/invoices/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete invoice");
  }
}

export async function verifyInvoice(id: number, notes?: string): Promise<Invoice> {
  const res = await authFetch(`billing/invoices/${id}/verify/`, {
    method: "POST",
    body: JSON.stringify({ notes: notes || "" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to verify invoice");
  }
  return res.json();
}

export async function rejectInvoice(id: number, notes?: string): Promise<Invoice> {
  const res = await authFetch(`billing/invoices/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify({ notes: notes || "" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reject invoice");
  }
  return res.json();
}

export async function sendInvoiceEmail(id: number): Promise<Invoice> {
  const res = await authFetch(`billing/invoices/${id}/send-email/`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send email");
  }
  return res.json();
}

export async function sendInvoiceWhatsApp(id: number): Promise<Invoice> {
  const res = await authFetch(`billing/invoices/${id}/send-whatsapp/`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send WhatsApp");
  }
  return res.json();
}

export async function fetchPublicInvoice(token: string): Promise<PublicInvoice> {
  const res = await myFetch(`billing/pay/${token}/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invoice not found");
  }
  return res.json();
}

export async function submitPaymentProof(
  token: string,
  data: { transaction_last4?: string; screenshot?: File | null }
): Promise<{ ok: boolean; status: string }> {
  const form = new FormData();
  if (data.transaction_last4) {
    form.append("transaction_last4", data.transaction_last4);
  }
  if (data.screenshot) {
    form.append("screenshot", data.screenshot);
  }
  const res = await myFetch(`billing/pay/${token}/submit/`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit payment proof");
  }
  return res.json();
}
