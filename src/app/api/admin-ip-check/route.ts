import { NextResponse } from "next/server";
import { getIncomingClientIp } from "@/lib/clientIp";

export const runtime = "edge";

/** Used by middleware to gate /admin when backend IP restriction is enabled. */
export async function GET(request: Request) {
  const apiKey = process.env.BACKEND_API_KEY;
  const backendUrl = process.env.BACKEND_API_URL;
  if (!apiKey || !backendUrl) {
    // Fail open if misconfigured so local/dev keeps working.
    return NextResponse.json({ allowed: true });
  }

  const clientIp = getIncomingClientIp(request);
  try {
    const res = await fetch(`${backendUrl}users/auth/admin-ip-allowed/`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        ...(clientIp ? { "X-Hedgium-Client-IP": clientIp } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ allowed: true });
    }
    const data = (await res.json()) as { allowed?: boolean };
    return NextResponse.json({ allowed: data.allowed !== false });
  } catch {
    return NextResponse.json({ allowed: true });
  }
}
