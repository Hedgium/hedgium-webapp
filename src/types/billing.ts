export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PENDING_VERIFICATION"
  | "PAID"
  | "VOID";

export type LastQuarterPaid = "PAID" | "UNPAID" | "NO_INVOICE";

export interface Invoice {
  id: number;
  user_id: number;
  user_email: string | null;
  user_mobile: string | null;
  invoice_no: string;
  client_type: string;
  fy: string;
  quarter: string;
  period_start: string;
  period_end: string;
  is_final: boolean;
  fee_base: number;
  fee_base_source: string;
  snapshot_count: number;
  fee_mode: string;
  fee_rate: number | null;
  fixed_fee_amount: number | null;
  saas_slab_amount: number | null;
  pro_rate_factor: number;
  billing_days: number;
  quarter_days: number;
  fee_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  sebi_cap_applied: boolean;
  public_token: string | null;
  pay_url: string | null;
  upi_payload: string | null;
  status: InvoiceStatus;
  submitted_txn_last4: string | null;
  screenshot: string | null;
  verified_at: string | null;
  verified_by_id: number | null;
  notes: string | null;
  sent_email_at: string | null;
  sent_whatsapp_at: string | null;
  issued_at: string | null;
  created_at: string;
  last_quarter_paid: LastQuarterPaid | null;
}

export interface InvoiceBankDetails {
  beneficiary: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  ifsc: string;
  branch: string;
  upi_id: string;
}

export interface PublicInvoice {
  invoice_no: string;
  client_type: string;
  fy: string;
  quarter: string;
  period_start: string;
  period_end: string;
  fee_amount: number;
  gst_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  upi_payload: string;
  payee_name: string;
  hedgium_gstin: string | null;
  client_gstin: string | null;
  bank: InvoiceBankDetails;
}

export interface CurrentQuarter {
  fy: string;
  quarter: string;
  previous_fy: string;
  previous_quarter: string;
}

export interface InvoiceListResponse {
  count: number;
  results: Invoice[];
  next: string | null;
  previous: string | null;
}

export interface GenerateResponse {
  created: number;
  skipped: number;
  invoices: Invoice[];
}

export interface GenerateOnePayload {
  user_id: number;
  fy: string;
  quarter: string;
  as_of?: string;
  fee_mode?: string;
  annual_rate?: number;
  fixed_quarterly?: number;
}

export type BillingFeeMode = "default" | "percent" | "fixed";

export interface BillingClient {
  id: number;
  email: string | null;
  username: string;
  mobile: string | null;
  client_type: string;
  billing_fee_mode: BillingFeeMode | string;
  billing_annual_rate: number | null;
  billing_fixed_quarterly: number | null;
}

export interface BillingClientListResponse {
  count: number;
  results: BillingClient[];
  next: string | null;
  previous: string | null;
}
