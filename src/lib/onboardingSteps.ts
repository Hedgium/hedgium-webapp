export type OnboardingStep =
  | "signup"
  | "verify-email"
  | "terms"
  | "complete-profile"
  | "verification";

export type OnboardingViewOverride =
  | "signup"
  | "verify-email"
  | "complete-profile"
  | null;

export const ONBOARDING_PATH = "/onboarding";

export function stepFromSignupStep(
  signupStep: string | undefined,
  hasAccessToken: boolean
): OnboardingStep {
  if (!hasAccessToken) return "signup";
  switch (signupStep) {
    case "initiated":
      return "verify-email";
    case "email_verified":
      return "terms";
    case "terms_accepted":
      return "complete-profile";
    case "documents_uploaded":
    case "broker_profile_added":
      return "verification";
    default:
      return "signup";
  }
}

export function resolveOnboardingStep(
  signupStep: string | undefined,
  hasAccessToken: boolean,
  viewOverride: OnboardingViewOverride
): OnboardingStep {
  if (viewOverride === "signup" && hasAccessToken && signupStep === "initiated") {
    return "signup";
  }
  if (viewOverride === "verify-email" && signupStep === "email_verified") {
    return "verify-email";
  }
  if (
    viewOverride === "complete-profile" &&
    (signupStep === "documents_uploaded" || signupStep === "broker_profile_added")
  ) {
    return "complete-profile";
  }
  return stepFromSignupStep(signupStep, hasAccessToken);
}

export function isOnboardingIncomplete(signupStep: string | undefined): boolean {
  return signupStep !== undefined && signupStep !== "verified";
}

export function onboardingPathForUser(): string {
  return ONBOARDING_PATH;
}
