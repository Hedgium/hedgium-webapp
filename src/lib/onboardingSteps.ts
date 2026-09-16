export type OnboardingStep =
  | "signup"
  | "verify-email"
  | "terms"
  | "fees"
  | "mandate"
  | "complete-profile"
  | "verification";

export type OnboardingViewOverride =
  | "signup"
  | "verify-email"
  | "terms"
  | "fees"
  | "complete-profile"
  | null;

export type OnboardingStatus = {
  email_verified: boolean;
  terms_accepted: boolean;
  fees_accepted: boolean;
  mandate_accepted: boolean;
  documents_uploaded: boolean;
  broker_profile_added: boolean;
  pending: string[];
  complete: boolean;
};

export type ClientType = "saas" | "ra_client";

export type OnboardingUserLike = {
  signup_step?: string;
  client_type?: ClientType;
  onboarding?: OnboardingStatus | null;
};

export function isSaasClient(user: OnboardingUserLike | null | undefined): boolean {
  return user?.client_type !== "ra_client";
}

export const ONBOARDING_PATH = "/onboarding";

const PENDING_TO_STEP: Record<string, OnboardingStep> = {
  email_verified: "verify-email",
  terms: "terms",
  fees: "fees",
  mandate: "mandate",
  documents: "complete-profile",
  broker: "verification",
};

export function stepFromSignupStep(
  signupStep: string | undefined,
  hasAccessToken: boolean,
  clientType?: ClientType
): OnboardingStep {
  if (!hasAccessToken) return "signup";
  const saas = clientType !== "ra_client";
  if (saas) {
    switch (signupStep) {
      case "initiated":
        return "verify-email";
      case "email_verified":
        return "fees";
      case "fees_accepted":
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
  switch (signupStep) {
    case "initiated":
      return "verify-email";
    case "email_verified":
      return "terms";
    case "terms_accepted":
      return "fees";
    case "fees_accepted":
      return "mandate";
    case "mandate_accepted":
      return "complete-profile";
    case "documents_uploaded":
    case "broker_profile_added":
      return "verification";
    default:
      return "signup";
  }
}

export function stepFromOnboarding(
  onboarding: OnboardingStatus | null | undefined,
  hasAccessToken: boolean,
  signupStepFallback?: string,
  clientType?: ClientType
): OnboardingStep {
  if (!hasAccessToken) return "signup";
  if (!onboarding) {
    return stepFromSignupStep(signupStepFallback, hasAccessToken, clientType);
  }
  if (onboarding.complete) {
    return "verification";
  }
  const first = onboarding.pending[0];
  if (first && PENDING_TO_STEP[first]) {
    return PENDING_TO_STEP[first];
  }
  return stepFromSignupStep(signupStepFallback, hasAccessToken, clientType);
}

export function resolveOnboardingStep(
  user: OnboardingUserLike | null | undefined,
  hasAccessToken: boolean,
  viewOverride: OnboardingViewOverride
): OnboardingStep {
  const signupStep = user?.signup_step;
  const onboarding = user?.onboarding;
  const clientType = user?.client_type;
  const saas = isSaasClient(user);

  if (viewOverride === "signup" && hasAccessToken && signupStep === "initiated") {
    return "signup";
  }
  if (viewOverride === "verify-email" && signupStep === "email_verified") {
    return "verify-email";
  }
  if (viewOverride === "terms" && (signupStep === "terms_accepted" || onboarding?.terms_accepted)) {
    return "terms";
  }
  if (viewOverride === "fees" && (signupStep === "fees_accepted" || onboarding?.fees_accepted)) {
    return "fees";
  }
  if (
    viewOverride === "complete-profile" &&
    (signupStep === "documents_uploaded" ||
      signupStep === "broker_profile_added" ||
      onboarding?.documents_uploaded)
  ) {
    return "complete-profile";
  }
  if (!saas && viewOverride === "terms" && signupStep === "email_verified") {
    return "terms";
  }
  return stepFromOnboarding(onboarding, hasAccessToken, signupStep, clientType);
}

export function isOnboardingIncomplete(
  userOrSignupStep: OnboardingUserLike | string | null | undefined
): boolean {
  if (userOrSignupStep == null) return false;
  if (typeof userOrSignupStep === "string") {
    return userOrSignupStep !== "verified";
  }
  if (userOrSignupStep.onboarding) {
    return !userOrSignupStep.onboarding.complete;
  }
  return (
    userOrSignupStep.signup_step !== undefined &&
    userOrSignupStep.signup_step !== "verified"
  );
}

export function isOnboardingComplete(
  user: OnboardingUserLike | null | undefined
): boolean {
  if (!user) return false;
  if (user.onboarding) return user.onboarding.complete;
  return user.signup_step === "verified";
}

export function onboardingPathForUser(): string {
  return ONBOARDING_PATH;
}
