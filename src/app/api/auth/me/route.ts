import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { headers } = request;
  const accessToken = headers.get('Authorization')?.replace('Bearer ', '');
  const backendUrl = `${process.env.BACKEND_API_URL}users/auth/me`;
  const apiKey = process.env.BACKEND_API_KEY;

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 });
  }

  try {
    const response = await fetch(backendUrl, {
      headers: {
        'X-API-Key': apiKey ?? '',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}