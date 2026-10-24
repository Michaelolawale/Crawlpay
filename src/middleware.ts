import { NextResponse, NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const allowedIpsRaw = process.env.ADMIN_ALLOWED_IPS || '';

    // Only enforce IP filtering if ADMIN_ALLOWED_IPS is defined
    if (allowedIpsRaw.trim()) {
      const forwardedFor = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1').toLowerCase();

      const allowedIps = allowedIpsRaw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      // Always permit local loopbacks so development is never locked out
      allowedIps.push('127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1');

      const isAllowed = allowedIps.includes(clientIp);

      if (!isAllowed) {
        // Return 404 so unauthorized visitors do not even know the admin route exists
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return NextResponse.rewrite(new URL('/_not-found', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
