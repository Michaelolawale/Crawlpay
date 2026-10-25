import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * IP allowlist verification.
 * Only enforced if ADMIN_ENFORCE_IP === 'true' in the environment.
 * In production/cloud deployments, IP filtering can be optional to avoid
 * locking out administrators on mobile networks or dynamic broadband.
 */
export function isAllowedAdminIp(req: NextRequest): boolean {
  // If IP enforcement is not strictly enabled, allow access protected by the secret key
  if (process.env.ADMIN_ENFORCE_IP !== 'true') {
    return true;
  }

  const allowedIpsRaw = process.env.ADMIN_ALLOWED_IPS || '';
  if (!allowedIpsRaw.trim() || allowedIpsRaw.includes('*')) {
    return true;
  }

  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1').toLowerCase();

  const allowedIps = allowedIpsRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // Always permit local loopbacks
  allowedIps.push('127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1');

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

  if (!expectedKey || !authHeader) return false;

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
