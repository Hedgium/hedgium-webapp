import { authFetch } from "@/utils/api";
import type { BrokerAccessTokenResponse } from "@/types/profile";

export async function getBrokerAccessToken(profileId: number): Promise<BrokerAccessTokenResponse> {
    const response = await authFetch(`profiles/${profileId}/broker-access-token/`);
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const message =
            (err as { detail?: string; message?: string }).detail ||
            (err as { detail?: string; message?: string }).message ||
            "Failed to fetch broker access token";
        throw new Error(message);
    }
    return response.json() as Promise<BrokerAccessTokenResponse>;
}
