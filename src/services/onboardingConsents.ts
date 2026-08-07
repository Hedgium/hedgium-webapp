import { authFetch } from "@/utils/api";
import type { ClientCategory, FamilyDeclaration } from "@/types/onboardingDocuments";

export type {
  ClientCategory,
  FamilyDeclaration,
  FeeScheduleDocument,
  MandateDocument,
  ResearchTermsDocument,
} from "@/types/onboardingDocuments";

export type FeeScheduleAcceptPayload = {
  client_category: ClientCategory;
  family_declaration?: FamilyDeclaration | null;
  family_member_names?: string | null;
  gstin?: string;
  typed_full_name: string;
  accepted: true;
};

export type MandateAcceptPayload = {
  typed_full_name: string;
  accepted: true;
};

export type OnboardingConsentUser = {
  signup_step: string;
  client_category?: string | null;
  gstin?: string | null;
  terms_accepted_at?: string | null;
  terms_version?: string | null;
  fees_version?: string | null;
  mandate_version?: string | null;
  verified?: boolean;
  onboarding?: {
    email_verified: boolean;
    terms_accepted: boolean;
    fees_accepted: boolean;
    mandate_accepted: boolean;
    documents_uploaded: boolean;
    broker_profile_added: boolean;
    pending: string[];
    complete: boolean;
  } | null;
  [key: string]: unknown;
};

async function parseError(res: Response): Promise<string> {
  const err = await res.json().catch(() => ({} as { detail?: string }));
  return typeof err.detail === "string" ? err.detail : "Could not save acceptance.";
}

async function fetchDocument<T>(path: string): Promise<T> {
  const res = await authFetch(path);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function fetchResearchTermsDocument() {
  return fetchDocument<import("@/types/onboardingDocuments").ResearchTermsDocument>(
    "users/me/onboarding-documents/terms/"
  );
}

export async function fetchFeeScheduleDocument() {
  return fetchDocument<import("@/types/onboardingDocuments").FeeScheduleDocument>(
    "users/me/onboarding-documents/fee-schedule/"
  );
}

export async function fetchMandateDocument() {
  return fetchDocument<import("@/types/onboardingDocuments").MandateDocument>(
    "users/me/onboarding-documents/mandate/"
  );
}

export async function acceptResearchTerms(): Promise<OnboardingConsentUser> {
  const res = await authFetch("users/me/terms/accept/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accepted: true }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function acceptFeeSchedule(
  payload: FeeScheduleAcceptPayload
): Promise<OnboardingConsentUser> {
  const res = await authFetch("users/me/fee-schedule/accept/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function acceptMandate(
  payload: MandateAcceptPayload
): Promise<OnboardingConsentUser> {
  const res = await authFetch("users/me/mandate/accept/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}
