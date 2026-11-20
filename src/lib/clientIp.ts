/** Best-effort browser IP as seen by Next (proxy / CDN headers). */
export function getIncomingClientIp(request: Request): string {
  const hedgium = request.headers.get("x-hedgium-client-ip")?.trim();
  if (hedgium) {
    return hedgium.split(",")[0]?.trim() || hedgium;
  }
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "";
}
