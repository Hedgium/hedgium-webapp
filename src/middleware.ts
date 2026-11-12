import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function resolveClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const cf = request.headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf;
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const nextIp = (request as NextRequest & { ip?: string }).ip?.trim();
  if (nextIp) return nextIp;
  return '';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('__app_session');

    if (!session?.value) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const checkUrl = new URL('/api/admin-ip-check', request.url);
      const clientIp = resolveClientIp(request);
      const res = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          cookie: request.headers.get('cookie') || '',
          ...(clientIp
            ? {
                'x-forwarded-for': clientIp,
                'x-real-ip': clientIp,
                'x-hedgium-client-ip': clientIp,
              }
            : {}),
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { allowed?: boolean; ip?: string };
        if (data.allowed === false) {
          const denied = new URL('/admin-access', request.url);
          const checked = (data.ip || clientIp || '').trim();
          if (checked) {
            denied.searchParams.set('checked_ip', checked);
          }
          return NextResponse.redirect(denied);
        }
      }
    } catch {
      // Fail open if the check is unreachable.
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
