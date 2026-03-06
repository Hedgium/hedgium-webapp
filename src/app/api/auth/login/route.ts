// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { getSessionCookie } from '@/utils/sessions';

export async function POST(request: Request) {
  // 1️⃣ Verify origin
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const origin = request.headers.get('origin');
  if (allowedOrigin && origin !== allowedOrigin) {
    // console.log("ALLOWED");
    return NextResponse.json({ error: 'Forbidden - bad origin' }, { status: 403 });
  }

  // 2️⃣ Verify session cookie
  const session = await getSessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized - no valid session' }, { status: 401 });
  }

  // 3️⃣ Continue with backend login
  const { username, password } = await request.json();
  const backendUrl = `${process.env.BACKEND_API_URL}users/auth/login/`;
  const apiKey = process.env.BACKEND_API_KEY;

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey ?? '',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: 'Login failed' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
