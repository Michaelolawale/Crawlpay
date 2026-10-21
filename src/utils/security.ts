import dns from 'dns/promises';
import net from 'net';

/**
 * Checks whether an IP address belongs to private, loopback, link-local,
 * or cloud metadata ranges (SSRF protection).
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!net.isIP(ip)) return true;

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    const [a, b] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;

    // 10.0.0.0/8 (Private)
    if (a === 10) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;

    // 100.64.0.0/10 (Carrier Grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation/Test)
    if (a === 192 && b === 0 && parts[2] === 2) return true;
    if (a === 198 && b === 51 && parts[2] === 100) return true;
    if (a === 203 && b === 0 && parts[2] === 113) return true;

    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (a >= 224) return true;

    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    // Loopback & Unspecified
    if (lower === '::1' || lower === '::') return true;
    // Link-local: fe80:...
    if (lower.startsWith('fe80:')) return true;
    // Unique local address: fc00:... or fd00:...
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    // IPv4-mapped IPv6 (::ffff:x.x.x.x)
    if (lower.startsWith('::ffff:')) {
      const v4Part = lower.replace('::ffff:', '');
      return isPrivateOrReservedIp(v4Part);
    }
  }

  return false;
}

/**
 * Validates a target URL against SSRF vulnerabilities:
 * - Scheme must be http or https
 * - No userinfo credentials (user:pass@)
 * - Domain must resolve to a valid, public routable IP address
 */
export async function validateAndNormalizeTargetUrl(inputUrl: string): Promise<{
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}> {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'Target URL is required' };
  }

  let raw = inputUrl.trim();
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = 'https://' + raw;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { valid: false, error: 'Malformed URL format' };
  }

  // Protocol check
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are permitted' };
  }

  // Credentials check (e.g. http://admin:pass@host)
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'URL user credentials are not allowed' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Explicit blocked hostnames
  const forbiddenHosts = ['localhost', 'local', 'internal', '0.0.0.0', 'broadcasthost'];
  if (forbiddenHosts.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { valid: false, error: 'Access to internal or local hosts is strictly prohibited (SSRF Protection)' };
  }

  // If hostname is directly an IP, test it directly
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { valid: false, error: 'Access to private or reserved IP ranges is prohibited' };
    }
    return { valid: true, normalizedUrl: parsed.origin };
  }

  // Resolve hostname via DNS to prevent DNS rebinding to internal IPs
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      return { valid: false, error: `Could not resolve hostname: ${hostname}` };
    }

    for (const record of lookup) {
      if (isPrivateOrReservedIp(record.address)) {
        return {
          valid: false,
          error: `Domain ${hostname} resolves to a private or restricted network address (${record.address})`,
        };
      }
    }
  } catch (err: any) {
    return { valid: false, error: `DNS resolution failed for ${hostname}: ${err?.message || 'unknown error'}` };
  }

  // Enforce standard normalized origin + pathname
  return { valid: true, normalizedUrl: parsed.toString() };
}

/**
 * In-Memory Sliding Window Rate Limiter
 * Limits requests per IP to protect agent wallet gas and API limits.
 */
class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 15, windowMinutes: number = 10) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  public check(ip: string): { allowed: boolean; remaining: number; retryAfterSec?: number } {
    const now = Date.now();
    const timestamps = (this.requests.get(ip) || []).filter((time) => now - time < this.windowMs);

    if (timestamps.length >= this.maxRequests) {
      const oldest = timestamps[0];
      const retryAfterSec = Math.ceil((oldest + this.windowMs - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    timestamps.push(now);
    this.requests.set(ip, timestamps);

    // Housekeeping: clean stale map entries periodically
    if (this.requests.size > 2000) {
      for (const [key, list] of this.requests.entries()) {
        if (list.length === 0 || now - list[list.length - 1] > this.windowMs) {
          this.requests.delete(key);
        }
      }
    }

    return { allowed: true, remaining: this.maxRequests - timestamps.length };
  }
}

export const auditRateLimiter = new SlidingWindowRateLimiter(20, 10); // 20 audits per 10 minutes per IP

/**
 * Hard Crawl caps:
 * Streams response up to maxBytes, aborting if exceeded.
 */
export async function safeFetchHtml(
  url: string,
  maxBytes: number = 2 * 1024 * 1024,
  timeoutMs: number = 7000
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CrawlPayBot/1.0; +https://github.com/Michaelolawale/Crawlpay)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    // Check content-type header
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      // Still accept if empty or text, but block binary/media
      if (contentType.includes('image/') || contentType.includes('video/') || contentType.includes('application/zip')) {
        throw new Error(`Invalid content-type: ${contentType}`);
      }
    }

    // Stream and check byte length cap
    if (!res.body) {
      return await res.text();
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedHtml = '';
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        reader.cancel();
        throw new Error(`Response exceeded maximum crawl size cap of ${Math.round(maxBytes / 1024 / 1024)}MB`);
      }

      accumulatedHtml += decoder.decode(value, { stream: true });
    }

    return accumulatedHtml;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}
