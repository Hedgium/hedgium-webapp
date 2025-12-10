import { cookies } from "next/headers";

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies(); // ✅ await now required

  cookieStore.set({
    name: "__app_session",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
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
