import { NextRequest } from 'next/server';

export function verifyAdminAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || req.headers.get('x-admin-key');
  const expectedKey = process.env.ADMIN_KEY;

  if (!expectedKey || !authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return token === expectedKey;
}
