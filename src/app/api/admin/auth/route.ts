import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth, isAllowedAdminIp } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAllowedAdminIp(req)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

  if (clean && clean === expectedKey) {
    return NextResponse.json({ success: true, token: expectedKey });
  }

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
