import { NextResponse } from "next/server";
import { setSessionCookie } from "@/utils/sessions";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const allowedHost = process.env.ALLOWED_HOST || "myapp.com";
    const host = request.headers.get("host");

    if (allowedHost && !host?.includes(allowedHost)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const url = new URL(request.url);
  const maxAgeRaw = url.searchParams.get("maxAge");
  const maxAge = maxAgeRaw != null ? Number(maxAgeRaw) : undefined;

  const token = crypto.randomUUID();

  await setSessionCookie(token, maxAge);
  return NextResponse.json({ ok: true });
}
