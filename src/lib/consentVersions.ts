import { authFetch } from "@/utils/api";

export type ConsentVersionConfig = {
  researchTerms: string;
  feeSchedule: string;
  clientMandate: string;
  strategyExecution: string;
};

const KEYS = {
  RESEARCH_TERMS_VERSION: "researchTerms",
  FEE_SCHEDULE_CONSENT_VERSION: "feeSchedule",
  CLIENT_MANDATE_CONSENT_VERSION: "clientMandate",
  STRATEGY_EXECUTION_CONSENT_VERSION: "strategyExecution",
} as const;

/** Load current consent versions from SystemConfig (Admin → Settings). */
export async function fetchConsentVersionConfig(): Promise<ConsentVersionConfig> {
  const defaults: ConsentVersionConfig = {
    researchTerms: "",
    feeSchedule: "",
    clientMandate: "",
    strategyExecution: "",
  };
  try {
    const params = new URLSearchParams({ page_size: "100", search: "VERSION" });
    const res = await authFetch(`core/system-config/?${params.toString()}`);
    if (!res.ok) return defaults;
    const data = await res.json();
    const rows = (data.results || []) as { key: string; value: string }[];
    const out = { ...defaults };
    for (const row of rows) {
      const mapped = KEYS[row.key as keyof typeof KEYS];
      if (mapped) {
        out[mapped] = row.value;
      }
    }
    return out;
  } catch {
    return defaults;
  }
}

export const ONBOARDING_CHECKLIST_FIELDS = [
  { key: "email_verified", label: "Email verified" },
  { key: "terms_accepted", label: "Terms accepted", versionKey: "researchTerms" as const },
  { key: "fees_accepted", label: "Fees accepted", versionKey: "feeSchedule" as const },
  { key: "mandate_accepted", label: "Mandate accepted", versionKey: "clientMandate" as const },
  { key: "documents_uploaded", label: "Documents uploaded" },
  { key: "broker_profile_added", label: "Broker profile added" },
] as const;
