import { authFetch } from "@/utils/api";
import type {
    BrokerAccessTokenResponse,
    WhatsAppBroadcastResult,
    WhatsAppBroadcastTemplate,
} from "@/types/profile";

async function readError(response: Response, fallback: string): Promise<string> {
    const err = await response.json().catch(() => ({}));
    return (
        (err as { detail?: string; message?: string }).detail ||
        (err as { detail?: string; message?: string }).message ||
        fallback
    );
}

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

export async function listWhatsAppBroadcastTemplates(): Promise<WhatsAppBroadcastTemplate[]> {
    const response = await authFetch("profiles/whatsapp-broadcast/templates/");
    if (!response.ok) {
        throw new Error(await readError(response, "Failed to load WhatsApp templates"));
    }
    return response.json() as Promise<WhatsAppBroadcastTemplate[]>;
}

export async function sendWhatsAppBroadcast(template: string): Promise<WhatsAppBroadcastResult> {
    const response = await authFetch("profiles/whatsapp-broadcast/", {
        method: "POST",
        body: JSON.stringify({ template }),
    });
    if (!response.ok) {
        throw new Error(await readError(response, "Failed to send WhatsApp message"));
    }
    return response.json() as Promise<WhatsAppBroadcastResult>;
}
