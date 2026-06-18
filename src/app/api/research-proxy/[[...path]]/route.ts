export const runtime = "edge";

import { getSessionCookie } from "@/utils/sessions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return handleResearchProxy(request);
}

async function requireStaff(request: Request): Promise<NextResponse | null> {
  const session = await getSessionCookie();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - no valid session" },
      { status: 401 }
    );
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json(
      { error: "Forbidden - admin only" },
      { status: 403 }
    );
  }

  const backendUrl = process.env.BACKEND_API_URL;
  const apiKey = process.env.BACKEND_API_KEY;
  if (!backendUrl || !apiKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const meResponse = await fetch(`${backendUrl}users/auth/me/`, {
      headers: {
        "X-API-Key": apiKey,
        Authorization: authorization,
      },
    });

    if (!meResponse.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await meResponse.json();
    if (!user?.is_staff) {
      return NextResponse.json(
        { error: "Forbidden - admin only" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Research proxy staff check failed:", error);
    return NextResponse.json(
      { error: "Failed to verify admin access" },
      { status: 500 }
    );
  }

  return null;
}

async function handleResearchProxy(request: Request) {
  const staffError = await requireStaff(request);
  if (staffError) return staffError;

  const { pathname } = new URL(request.url);
  const pathSegments = pathname.split("/").slice(3);
  const researchPath = pathSegments.join("/");
  const normalizedPath = researchPath.endsWith("/")
    ? researchPath
    : `${researchPath}/`;

  const baseUrl = process.env.RESEARCH_API_URL;
  const apiKey = process.env.RESEARCH_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { error: "Research service configuration error" },
      { status: 500 }
    );
  }

  const upstreamUrl = `${baseUrl.replace(/\/?$/, "/")}${normalizedPath}`;

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    const contentType =
      response.headers.get("content-type") || "application/json";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    return new NextResponse(
      contentType.includes("application/json")
        ? JSON.stringify(data)
        : data,
      {
        status: response.status,
        headers: { "Content-Type": contentType },
      }
    );
  } catch (error) {
    console.error("Research proxy error:", error);
    return NextResponse.json(
      { error: "Research proxy request failed" },
      { status: 500 }
    );
  }
}
