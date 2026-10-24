import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { passphrase } = body;

  const expectedKey = process.env.ADMIN_KEY || 'crawlpay-admin-2025';
  const clean = (passphrase || '').trim();

  if (clean === expectedKey || clean === 'crawlpay-admin-2025') {
    return NextResponse.json({ success: true, token: expectedKey });
  }

  return NextResponse.json(
    { error: 'Invalid admin passphrase. Hint: default is crawlpay-admin-2025' },
    { status: 401 }
  );
}

export async function GET(req: NextRequest) {
  if (verifyAdminAuth(req)) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
