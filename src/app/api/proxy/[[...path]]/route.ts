// Edge runtime for low latency
export const runtime = "edge";

import { getSessionCookie } from '@/utils/sessions';
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return handleProxyRequest(request);
}
export async function POST(request: Request) {
  return handleProxyRequest(request);
}
export async function PUT(request: Request) {
  return handleProxyRequest(request);
}
export async function DELETE(request: Request) {
  return handleProxyRequest(request);
}
export async function PATCH(request: Request) {
  return handleProxyRequest(request);
}

async function handleProxyRequest(request: Request) {
  const { pathname, search } = new URL(request.url);
  const pathSegments = pathname.split("/").slice(3);
  const backendPath = pathSegments.join("/");
  const normalizedPath =
    backendPath.endsWith("/") ? backendPath : backendPath + "/";
  const backendUrl = `${process.env.BACKEND_API_URL}${normalizedPath}${search}`;
  const apiKey = process.env.BACKEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    const origin = request.headers.get('origin');
    if (allowedOrigin && origin !== allowedOrigin) {
      // console.log("ALLOWED");
      return NextResponse.json({ error: 'Forbidden - bad origin' }, { status: 403 });
    }
  
    // 2️⃣ Verify session cookie
    const session = getSessionCookie();
    if (!session) {
      console.log("SESSION RECEIVED");
      return NextResponse.json({ error: 'Unauthorized - no valid session' }, { status: 401 });
    }


  try {
    const headers: HeadersInit = {
      "X-API-Key": apiKey,
    };

    // ✅ Forward content-type if client set one (don’t force JSON!)
    const clientContentType = request.headers.get("content-type");
    if (clientContentType) {
      headers["Content-Type"] = clientContentType;
    }

    // Forward Authorization header if present
    const clientAuth = request.headers.get("Authorization");
    if (clientAuth) {
      headers.Authorization = clientAuth;
    }

    // ✅ Forward cookies
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    // Body (don’t auto-parse here)
    const body = request.method !== "GET" ? request.body : undefined;

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      credentials: "include",
    });

    const contentType =
      response.headers.get("content-type") || "application/json";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
    };

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      responseHeaders["Set-Cookie"] = setCookie;
    }

    return new NextResponse(
      contentType.includes("application/json")
        ? JSON.stringify(data)
        : data,
      {
        status: response.status,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Proxy request failed" }, { status: 500 });
  }
}
