import { authFetch } from "@/utils/api";
import type { Profile } from "@/types/profile";

export type ProfileActionOtpPurpose = "auto_trade" | "strategies_paused";

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const rec = err as { error?: string; detail?: string; message?: string };
    return rec.error || rec.detail || rec.message || fallback;
  }
  return fallback;
}

export async function sendProfileActionOtp(
  purpose: ProfileActionOtpPurpose
): Promise<void> {
  const res = await authFetch("profiles/me/action-otp/", {
    method: "POST",
    body: JSON.stringify({ purpose }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      res.status === 429
        ? "Too many attempts. Please wait a minute before requesting another code."
        : errorMessage(data, "Failed to send code.")
    );
  }
}

export async function confirmAutoTrade(
  autoTradeAllowed: boolean,
  otp: string
): Promise<Profile> {
  const res = await authFetch("profiles/me/auto-trade/", {
    method: "PUT",
    body: JSON.stringify({ auto_trade_allowed: autoTradeAllowed, otp }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(errorMessage(data, "Failed to update auto trade setting."));
  }
  return data as Profile;
}

export async function confirmStrategiesPaused(
  strategiesPaused: boolean,
  otp: string
): Promise<Profile> {
  const res = await authFetch("profiles/me/pause/", {
    method: "PUT",
    body: JSON.stringify({ strategies_paused: strategiesPaused, otp }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(errorMessage(data, "Failed to update pause setting."));
  }
  return data as Profile;
}
