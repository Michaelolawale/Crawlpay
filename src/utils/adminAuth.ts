import { NextRequest } from 'next/server';

export function isAllowedAdminIp(req: NextRequest): boolean {
  const allowedIpsRaw = process.env.ADMIN_ALLOWED_IPS || '';
  if (!allowedIpsRaw.trim()) return true;

  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1').toLowerCase();

  const allowedIps = allowedIpsRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  allowedIps.push('127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1');

  return allowedIps.includes(clientIp);
}

export function verifyAdminAuth(req: NextRequest): boolean {
  if (!isAllowedAdminIp(req)) return false;

  const authHeader = req.headers.get('authorization') || req.headers.get('x-admin-key');
  const expectedKey = process.env.ADMIN_KEY;

  if (!expectedKey || !authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return token === expectedKey;
}

