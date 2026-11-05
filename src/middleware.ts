import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
      const forwarded =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        // Next.js may expose the socket IP on the request in middleware.
        (request as NextRequest & { ip?: string }).ip ||
        '';
      const res = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          cookie: request.headers.get('cookie') || '',
          ...(forwarded
            ? {
                'x-forwarded-for': forwarded,
                'x-real-ip': forwarded.split(',')[0]?.trim() || forwarded,
              }
            : {}),
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { allowed?: boolean };
        if (data.allowed === false) {
          const denied = new URL('/home', request.url);
          denied.searchParams.set('admin_ip_denied', '1');
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
  matcher: ['/admin/:path*'],
};
