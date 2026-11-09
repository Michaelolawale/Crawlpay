import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Extracts and normalizes the client IP address from various request headers and properties,
 * stripping port numbers and IPv4-mapped IPv6 prefixes (::ffff:) for consistent matching.
 */
export function extractClientIp(req: NextRequest): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const nextReqIp = (req as any).ip;

  let raw = (
    cfConnectingIp ||
    (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
    realIp ||
    nextReqIp ||
    '127.0.0.1'
  ).trim();

  // Strip IPv4-mapped IPv6 prefix ::ffff:
  if (raw.startsWith('::ffff:')) {
    raw = raw.slice(7);
  }

  // Strip port if formatted as ip:port (IPv4)
  if (raw.includes('.') && raw.includes(':')) {
    raw = raw.split(':')[0];
  }

  return raw.toLowerCase();
}

/**
 * IP allowlist verification.
 * Only enforced if ADMIN_ENFORCE_IP === 'true' in the environment.
 * In production/cloud deployments, IP filtering can be optional to avoid
 * locking out administrators on mobile networks or dynamic broadband.
 */
export function isAllowedAdminIp(req: NextRequest): boolean {
  const envFlag = (process.env.ADMIN_ENFORCE_IP || '').trim().replace(/['"]/g, '').toLowerCase();
  if (envFlag !== 'true') {
    return true;
  }

  const allowedIpsRaw = process.env.ADMIN_ALLOWED_IPS || '';
  if (!allowedIpsRaw.trim() || allowedIpsRaw.includes('*')) {
    return true;
  }

  const clientIp = extractClientIp(req);

  const allowedIps = allowedIpsRaw
    .split(',')
    .map((s) => {
      let clean = s.trim().replace(/['"]/g, '').toLowerCase();
      if (clean.startsWith('::ffff:')) clean = clean.slice(7);
      if (clean.includes('.') && clean.includes(':')) clean = clean.split(':')[0];
      return clean;
    })
    .filter(Boolean);

  // Always permit local loopbacks
  allowedIps.push('127.0.0.1', '::1', 'localhost');

  return allowedIps.includes(clientIp);
}

/**
 * Timing-safe string comparison to protect against side-channel timing attacks
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Run comparison anyway to maintain constant time
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies that the incoming request contains the valid administrator Bearer token or header.
 */
export function verifyAdminAuth(req: NextRequest): boolean {
  if (!isAllowedAdminIp(req)) return false;

  const authHeader = req.headers.get('authorization') || req.headers.get('x-admin-key');
  const expectedKey = process.env.ADMIN_KEY;

  if (!expectedKey || !expectedKey.trim() || !authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return timingSafeStringEqual(token, expectedKey.trim());
}

// In-memory rate limiting for admin auth attempts to prevent brute force
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkAdminRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry && entry.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  return { allowed: true };
}

export function recordFailedAdminLogin(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  entry.count += 1;

  // If 5 failed attempts in 5 minutes, lock out for 60 seconds
  if (entry.count >= 5) {
    entry.lockedUntil = now + 60 * 1000;
    entry.count = 0;
  }

  loginAttempts.set(ip, entry);
}

export function recordSuccessfulAdminLogin(ip: string): void {
  loginAttempts.delete(ip);
}
