import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { headers } = request;
  const accessToken = headers.get('Authorization')?.replace('Bearer ', '');
  const backendUrl = `${process.env.BACKEND_API_URL}users/auth/logout`;
  const apiKey = process.env.BACKEND_API_KEY;

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey ?? '',
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
      },
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, {
      status: response.ok ? 200 : response.status,
      headers: {
        'Set-Cookie': response.headers.get('set-cookie') || '',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}