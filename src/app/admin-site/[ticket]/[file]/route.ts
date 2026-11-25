// Serves the Engine 1 fund-screener site pages at real same-origin URLs:
//   /admin-site/<ticket>/<file>.html
//
// The pages link to each other by bare filename ("parameters.html#cell=...")
// and share localStorage, so they must be loaded as ordinary documents rather
// than iframe srcDoc. A browser reaches this route by plain navigation (the
// iframe on /admin/engine1/site, or "Open in new tab"), which can carry neither
// a JWT nor an Origin header -- so, unlike /api/proxy, the credential is the
// signed ticket in the path (issued to staff with the engine1 section, checked
// by the backend on every request) together with the session cookie. Relative
// links inside a page resolve to the same ticket, so the site works unchanged.
export const runtime = "edge";

import { getSessionCookie } from "@/utils/sessions";
import { NextResponse } from "next/server";

const FILE_RE = /^[a-z0-9_]+\.html$/;
const TICKET_RE = /^[A-Za-z0-9_:\-]{1,200}$/;

function htmlMessage(status: number, title: string, body: string) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
      `<body style="font:15px system-ui;margin:3rem;max-width:36rem">` +
      `<h1 style="font-size:1.2rem">${title}</h1><p>${body}</p>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticket: string; file: string }> }
) {
  const { ticket, file } = await params;

  const session = await getSessionCookie();
  if (!session) {
    return htmlMessage(403, "Sign in required", "Sign in to Hedgium, then open Admin &rarr; Engine 1 &rarr; Fund site.");
  }
  if (!TICKET_RE.test(ticket) || !FILE_RE.test(file)) {
    return htmlMessage(404, "Not found", "No such page.");
  }

  const backendUrl = process.env.BACKEND_API_URL;
  const apiKey = process.env.BACKEND_API_KEY;
  if (!backendUrl || !apiKey) {
    return htmlMessage(500, "Server configuration error", "The backend address is not configured.");
  }

  try {
    const upstream = await fetch(
      `${backendUrl}engine1/site-file/${encodeURIComponent(ticket)}/${file}`,
      { headers: { "X-API-Key": apiKey }, cache: "no-store" }
    );
    // Stream the body straight through: the largest page is ~3.5 MB and is not
    // buffered here. fetch() has already undone the backend's gzip, so
    // Content-Encoding is NOT copied (the platform re-compresses the response).
    const headers: Record<string, string> = {
      "Content-Type": upstream.headers.get("content-type") || "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    };
    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    console.error("Engine 1 site proxy error:", error);
    return htmlMessage(502, "Could not load the page", "The backend did not respond. Try again in a moment.");
  }
}
