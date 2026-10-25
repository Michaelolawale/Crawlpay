import { NextResponse, NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Only enforce IP filtering if strictly configured via ADMIN_ENFORCE_IP
    if (process.env.ADMIN_ENFORCE_IP === 'true') {
      const allowedIpsRaw = process.env.ADMIN_ALLOWED_IPS || '';

      if (allowedIpsRaw.trim() && !allowedIpsRaw.includes('*')) {
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
          if (pathname.startsWith('/api/admin')) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
          }
          return NextResponse.rewrite(new URL('/_not-found', req.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
