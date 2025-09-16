// /app/api/auth/login/route.ts (App Router)
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}users/auth/login/`;
  const apiKey = process.env.BACKEND_API_KEY;

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey ?? '',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include', // Forward credentials
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: 'Login failed' }, { status: response.status });
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Set-Cookie': response.headers.get('set-cookie') || '', // Forward cookies
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}