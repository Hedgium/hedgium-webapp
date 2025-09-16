// Edge runtime for low latency
export const runtime = 'edge';

import { NextResponse } from 'next/server';

// // Whitelist allowed paths for security (based on API categories)
// const allowedPaths = [
//   'token/',
//   'users/',
//   'profiles/',
//   'subscriptions/',
//   'strategies/',
//   'trade-cycles/',
//   'orders/',
//   'positions/',
// ];

// Supported HTTP methods
// const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

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
  const pathSegments = pathname.split('/').slice(3);
  const backendPath = pathSegments.join('/');
  const normalizedPath = backendPath.endsWith('/') ? backendPath : backendPath + '/';
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}${normalizedPath}${search}`;
  const apiKey = process.env.BACKEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const headers: HeadersInit = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    };

    // Forward Authorization header if present
    const clientAuth = request.headers.get('Authorization');
    if (clientAuth) {
      headers.Authorization = clientAuth;
    }

    // ✅ Forward Cookie header (needed for refresh_token)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const body = request.method !== 'GET' ? await request.text() : undefined;

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      credentials: 'include',
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // ✅ Forward Set-Cookie back to browser
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
    };
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      responseHeaders['Set-Cookie'] = setCookie;
    }

    return new NextResponse(
      contentType.includes('application/json') ? JSON.stringify(data) : data,
      {
        status: response.status,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 });
  }
}

