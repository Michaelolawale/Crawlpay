import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  verifyAdminAuth,
  isAllowedAdminIp,
  checkAdminRateLimit,
  recordFailedAdminLogin,
  recordSuccessfulAdminLogin,
} from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  if (!isAllowedAdminIp(req)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const forwarded = req.headers.get('x-forwarded-for');
  const clientIp = (forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1').toLowerCase();

  const rateCheck = checkAdminRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Too many failed login attempts. Please wait ${rateCheck.retryAfterSec || 60}s before trying again.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { passphrase } = body;

  const expectedKey = process.env.ADMIN_KEY;
  const clean = (passphrase || '').trim();

  if (!expectedKey) {
    return NextResponse.json(
      { error: 'Admin authentication is not configured on the server (missing ADMIN_KEY).' },
      { status: 500 }
    );
  }

  if (clean && safeCompare(clean, expectedKey.trim())) {
    recordSuccessfulAdminLogin(clientIp);
    return NextResponse.json({ success: true, token: expectedKey.trim() });
  }

  recordFailedAdminLogin(clientIp);
  return NextResponse.json(
    { error: 'Invalid operator credentials. Access denied.' },
    { status: 401 }
  );
}

export async function GET(req: NextRequest) {
  if (verifyAdminAuth(req)) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
