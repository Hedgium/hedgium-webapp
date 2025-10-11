import { NextResponse } from "next/server";
import { setSessionCookie } from "@/utils/sessions";

export async function GET(request: Request) {
  const allowedHost = process.env.ALLOWED_HOST || "myapp.com";
  const host = request.headers.get("host");

  if (allowedHost && !host?.includes(allowedHost)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Generate a dummy short-lived token for testing
  const token = crypto.randomUUID();

  await setSessionCookie(token); // ✅ await this
  return NextResponse.json({ ok: true });
}
