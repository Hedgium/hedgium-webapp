import { authFetch } from "@/utils/api";

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const rec = err as { error?: string; detail?: string; message?: string };
    return rec.error || rec.detail || rec.message || fallback;
  }
  return fallback;
}

export async function sendTwoFactorSettingsOtp(): Promise<void> {
  const res = await authFetch("users/auth/2fa/send-otp/", { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      res.status === 429
        ? "Too many attempts. Please wait a minute before requesting another code."
        : errorMessage(data, "Failed to send code.")
    );
  }
}

export async function confirmTwoFactorToggle(
  enabled: boolean,
  otp: string
): Promise<boolean> {
  const res = await authFetch("users/auth/2fa/", {
    method: "POST",
    body: JSON.stringify({ enabled, otp }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(errorMessage(data, "Failed to update two-factor setting."));
  }
  return Boolean((data as { two_factor_enabled?: boolean }).two_factor_enabled);
}
