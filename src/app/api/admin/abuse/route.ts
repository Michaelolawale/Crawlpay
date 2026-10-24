import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ blocklist: db.listBlocklist() });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { type, value, reason } = body;

  if (!type || !value) {
    return NextResponse.json({ error: 'Missing type or value' }, { status: 400 });
  }

  db.addBlocklist({
    type,
    value,
    reason: reason || 'Flagged by administrator',
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, blocklist: db.listBlocklist() });
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || '';
  const value = searchParams.get('value') || '';

  if (!type || !value) {
    return NextResponse.json({ error: 'Missing type or value query parameters' }, { status: 400 });
  }

  db.removeBlocklist(type, value);
  return NextResponse.json({ success: true, blocklist: db.listBlocklist() });
}
