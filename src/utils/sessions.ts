import { cookies } from "next/headers";

const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 24 * 21; // 21 days — client refresh ceiling

export async function setSessionCookie(token: string, maxAge?: number) {
  const cookieStore = await cookies();
  const age =
    typeof maxAge === "number" && Number.isFinite(maxAge) && maxAge > 0
      ? Math.floor(maxAge)
      : DEFAULT_SESSION_MAX_AGE;

  cookieStore.set({
    name: "__app_session",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
    maxAge: age,
  });
}

export async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("__app_session")?.value || null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("__app_session");
}
