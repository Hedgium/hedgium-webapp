import { NextResponse } from 'next/server';

export async function POST() {
  const backendUrl = `${process.env.BACKEND_API_URL}users/token/refresh`;
  const apiKey = process.env.BACKEND_API_KEY;

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey ?? '' },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: response.status });
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Set-Cookie': response.headers.get('set-cookie') || '',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}