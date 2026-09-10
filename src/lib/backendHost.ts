/**
 * WebSocket host for the Django backend.
 * Production uses NEXT_PUBLIC_BACKEND_DOMAIN. On LAN (http://192.168.x.x:3000)
 * that env is localhost, which would point the other device at itself.
 */
export function backendWsAuthority(): string {
  const configured = process.env.NEXT_PUBLIC_BACKEND_DOMAIN || "localhost:8000";
  const isLocalConfigured =
    configured.startsWith("localhost") || configured.startsWith("127.0.0.1");
  if (!isLocalConfigured) return configured;
  if (typeof window === "undefined") return configured;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return configured;
  return `${host}:8000`;
}
