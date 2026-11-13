import * as cheerio from 'cheerio';
import { CrawlConfig, PageCrawlData, SiteMetadata, CrawledLink, CrawledImage } from '../engine/types';
import { validateAndNormalizeTargetUrl } from '../utils/security';
import { calculateSimhash } from '../engine/utils/simhash';
import { RobotsParser } from '../engine/utils/robotsParser';
import { fetchAndParseSitemap } from '../engine/utils/sitemapParser';
import { detectStackFromHtml } from '../engine/utils/stackDetector';

export interface CrawlResult {
  pages: PageCrawlData[];
  metadata: SiteMetadata;
  robotsParser: RobotsParser;
  crawlDurationMs: number;
  stoppedEarlyReason?: string;
}

export class PageCrawler {
  private config: CrawlConfig;
  private visitedUrls = new Set<string>();
  private queue: Array<{ url: string; depth: number }> = [];
  private pageDataMap = new Map<string, PageCrawlData>();
  private lastRequestTime = 0;
  private startTime = 0;

  constructor(customConfig?: Partial<CrawlConfig>) {
    const isFull = customConfig?.mode === 'full';
    this.config = {
      mode: customConfig?.mode || 'quick',
      maxPages: customConfig?.maxPages !== undefined ? customConfig.maxPages : (isFull ? 50 : 5),
      maxDepth: customConfig?.maxDepth !== undefined ? customConfig.maxDepth : (isFull ? 3 : 2),
      maxResponseBytes: customConfig?.maxResponseBytes || 2 * 1024 * 1024,
      totalTimeoutMs: customConfig?.totalTimeoutMs || 60000,
      perRequestTimeoutMs: customConfig?.perRequestTimeoutMs || 8000,
      requestsPerSecond: customConfig?.requestsPerSecond || 4,
      userAgent: customConfig?.userAgent || 'CrawlPayBot/1.0 (+https://crawlpay.vercel.app/bot)',
    };
  }

  public async crawl(initialUrl: string): Promise<CrawlResult> {
    this.startTime = Date.now();
    this.visitedUrls.clear();
    this.pageDataMap.clear();
    this.queue = [];

    // Validate root target URL
    const rootCheck = await validateAndNormalizeTargetUrl(initialUrl);
    if (!rootCheck.valid || !rootCheck.normalizedUrl) {
      throw new Error(rootCheck.error || 'Invalid or dangerous target URL (SSRF Blocked)');
    }

    const startUrl = rootCheck.normalizedUrl;
    const rootOrigin = new URL(startUrl).origin;
    const hostname = new URL(startUrl).hostname;

    // 1. Fetch robots.txt, probe WAF for GPTBot, and probe llms.txt concurrently
    let robotsTxtContent: string | undefined;
    let isRobotsFetchFailed = false;
    let wafProbe: SiteMetadata['wafProbe'] = undefined;
    let llmsTxtFound = false;

    const [robotsRes, wafRes, llmsRes] = await Promise.allSettled([
      // A. Robots.txt (Secure probe with redirect hop verification)
      this.safeProbe(`${rootOrigin}/robots.txt`, 'GET', this.config.userAgent, 4000),
      // B. AI User-Agent WAF Probe (HEAD request with GPTBot user-agent, redirect-safe)
      this.safeProbe(
        startUrl,
        'HEAD',
        'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)',
        3000
      ),
      // C. llms.txt probe (Secure probe with redirect hop verification)
      this.safeProbe(`${rootOrigin}/llms.txt`, 'GET', this.config.userAgent, 2500),
    ]);

    if (robotsRes.status === 'fulfilled') {
      if (robotsRes.value.ok) {
        robotsTxtContent = robotsRes.value.text;
      } else if (robotsRes.value.status >= 500) {
        isRobotsFetchFailed = true;
      }
    } else {
      isRobotsFetchFailed = true;
    }

    if (wafRes.status === 'fulfilled') {
      const status = wafRes.value.status;
      const isBlocked = status === 403 || status === 429 || status === 503;
      wafProbe = {
        accessible: !isBlocked,
        status,
        blockedReason: isBlocked ? (status === 403 ? 'WAF 403 Forbidden' : `HTTP ${status}`) : undefined,
      };
    }

    if (llmsRes.status === 'fulfilled' && llmsRes.value.ok) {
      llmsTxtFound = true;
    }

    const robotsParser = new RobotsParser(robotsTxtContent, 'CrawlPayBot', isRobotsFetchFailed);

    // 2. Discover and parse sitemap
    const sitemapData = await fetchAndParseSitemap(startUrl, robotsParser.getSitemaps());

    // 3. Initialize crawl queue with startUrl and sitemap URLs
    this.queue.push({ url: startUrl, depth: 0 });
    this.visitedUrls.add(this.normalizeUrlKey(startUrl));

    if (sitemapData.urls && sitemapData.urls.length > 0) {
      for (const sitemapUrl of sitemapData.urls) {
        if (this.queue.length >= this.config.maxPages) break;
        const key = this.normalizeUrlKey(sitemapUrl);
        if (!this.visitedUrls.has(key)) {
          this.visitedUrls.add(key);
          this.queue.push({ url: sitemapUrl, depth: 1 });
        }
      }
    }

    let stoppedEarlyReason: string | undefined;
    let detectedStack: SiteMetadata['detectedStack'] = { cms: 'Unknown', seoPlugin: 'None' };

    // 4. BFS Crawl Loop
    while (this.queue.length > 0 && this.pageDataMap.size < this.config.maxPages) {
      // Check total crawl timeout (60s)
      if (Date.now() - this.startTime >= this.config.totalTimeoutMs) {
        stoppedEarlyReason = 'Audit reached maximum 60s total time cap.';
        break;
      }

      const item = this.queue.shift();
      if (!item) break;

      const { url, depth } = item;

      // Respect robots.txt check
      try {
        const path = new URL(url).pathname;
        if (!robotsParser.isAllowed(path)) {
          // If the homepage itself is disallowed, we still note it in findings later
          if (depth > 0) {
            continue;
          }
        }
      } catch {}

      // Rate limit enforcement: max 4 requests/sec (min 250ms delay)
      const minIntervalMs = Math.ceil(1000 / this.config.requestsPerSecond);
      const elapsedSinceLastReq = Date.now() - this.lastRequestTime;
      if (elapsedSinceLastReq < minIntervalMs) {
        await new Promise((r) => setTimeout(r, minIntervalMs - elapsedSinceLastReq));
      }

      this.lastRequestTime = Date.now();

      // Fetch and process page
      const pageData = await this.fetchAndExtractPage(url, depth, rootOrigin);
      if (pageData) {
        this.pageDataMap.set(pageData.url, pageData);

        // Update stack detection from first valid page (homepage)
        if (depth === 0) {
          const $ = cheerio.load(pageData.html);
          detectedStack = detectStackFromHtml(pageData.html, $);
        }

        // Enqueue child internal links if within depth limit and under page cap
        if (depth < this.config.maxDepth && (this.pageDataMap.size + this.queue.length) < this.config.maxPages) {
          for (const link of pageData.links) {
            if (this.pageDataMap.size + this.queue.length >= this.config.maxPages) break;
            if (link.isInternal && !this.visitedUrls.has(this.normalizeUrlKey(link.resolvedUrl))) {
              this.visitedUrls.add(this.normalizeUrlKey(link.resolvedUrl));
              this.queue.push({ url: link.resolvedUrl, depth: depth + 1 });
            }
          }
        }
      }
    }

    // 5. Post-crawl pass: Calculate inbound internal links count per page
    const pages = Array.from(this.pageDataMap.values());
    for (const page of pages) {
      let inboundCount = 0;
      const targetNormalized = this.normalizeUrlKey(page.url);
      for (const otherPage of pages) {
        for (const link of otherPage.links) {
          if (link.isInternal && this.normalizeUrlKey(link.resolvedUrl) === targetNormalized) {
            inboundCount++;
          }
        }
      }
      page.inboundInternalLinks = inboundCount;
    }

    const metadata: SiteMetadata = {
      baseUrl: startUrl,
      hostname,
      detectedStack,
      sitemapFound: Boolean(sitemapData.sitemapUrl && sitemapData.urls.length > 0),
      sitemapUrl: sitemapData.sitemapUrl,
      sitemapUrls: sitemapData.urls,
      robotsTxtFound: Boolean(robotsTxtContent),
      robotsTxtContent,
      wafProbe,
      llmsTxtFound,
    };

    return {
      pages,
      metadata,
      robotsParser,
      crawlDurationMs: Date.now() - this.startTime,
      stoppedEarlyReason,
    };
  }

  /**
   * SSRF-safe probe helper that enforces pre-hop DNS checks and manual redirect handling
   */
  private async safeProbe(
    targetUrl: string,
    method: 'GET' | 'HEAD' = 'GET',
    customUserAgent?: string,
    timeoutMs: number = 3500,
    maxRedirects: number = 3
  ): Promise<{ ok: boolean; status: number; text: string }> {
    let currentUrl = targetUrl;
    let redirectCount = 0;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      while (redirectCount <= maxRedirects) {
        const check = await validateAndNormalizeTargetUrl(currentUrl);
        if (!check.valid || !check.normalizedUrl) {
          return { ok: false, status: 403, text: '' };
        }

        const res = await fetch(currentUrl, {
          method,
          headers: {
            'User-Agent': customUserAgent || this.config.userAgent,
            Accept: method === 'HEAD' ? 'text/html,application/xhtml+xml' : '*/*',
            'Cache-Control': 'no-cache, no-store',
          },
          cache: 'no-store',
          redirect: 'manual',
          signal: controller.signal,
        });

        const status = res.status;
        if ([301, 302, 303, 307, 308].includes(status)) {
          const loc = res.headers.get('location');
          if (!loc) {
            clearTimeout(timeout);
            return { ok: false, status, text: '' };
          }
          currentUrl = new URL(loc, currentUrl).toString();
          redirectCount++;
          continue;
        }

        let text = '';
        if (method !== 'HEAD' && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let bytes = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > 256 * 1024) {
              reader.cancel();
              break;
            }
            text += decoder.decode(value, { stream: true });
          }
          text += decoder.decode();
        }

        clearTimeout(timeout);
        return { ok: res.ok, status, text };
      }

      clearTimeout(timeout);
      return { ok: false, status: 310, text: '' };
    } catch {
      clearTimeout(timeout);
      return { ok: false, status: 500, text: '' };
    }
  }

  private async fetchAndExtractPage(
    targetUrl: string,
    depth: number,
    rootOrigin: string
  ): Promise<PageCrawlData | null> {
    const redirectChain: string[] = [];
    let currentUrl = targetUrl;
    let finalUrl = targetUrl;
    let status = 200;
    const responseHeaders: Record<string, string> = {};
    let html = '';
    let byteSize = 0;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.perRequestTimeoutMs);

    try {
      let redirectCount = 0;
      const maxRedirects = 5;

      while (redirectCount <= maxRedirects) {
        // Validate URL and DNS before EVERY hop (SSRF + DNS rebinding prevention)
        const check = await validateAndNormalizeTargetUrl(currentUrl);
        if (!check.valid || !check.normalizedUrl) {
          throw new Error(check.error || 'Target hop blocked by SSRF protection');
        }

        const res = await fetch(currentUrl, {
          headers: {
            'User-Agent': this.config.userAgent,
            Accept: 'text/html,application/xhtml+xml',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
          cache: 'no-store',
          redirect: 'manual', // Strictly manual to intercept and validate redirects
          signal: controller.signal,
        });

        status = res.status;

        // If redirect status code
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = res.headers.get('location');
          if (!location) break;
          redirectChain.push(currentUrl);
          const resolvedNext = new URL(location, currentUrl).toString();
          currentUrl = resolvedNext;
          finalUrl = resolvedNext;
          redirectCount++;
          continue;
        }

        // Final destination reached
        finalUrl = currentUrl;
        res.headers.forEach((val, key) => {
          responseHeaders[key.toLowerCase()] = val;
        });

        // Cap at 2MB per spec
        const buffer = await res.arrayBuffer();
        byteSize = buffer.byteLength;
        if (byteSize > this.config.maxResponseBytes) {
          const truncated = buffer.slice(0, this.config.maxResponseBytes);
          html = new TextDecoder('utf-8').decode(truncated);
        } else {
          html = new TextDecoder('utf-8').decode(buffer);
        }
        break;
      }
      clearTimeout(timeout);
    } catch (err: any) {
      clearTimeout(timeout);
      // If direct request failed or timed out, provide standard placeholder to run checks
      status = err?.name === 'AbortError' ? 408 : 500;
      html = `<!DOCTYPE html><html><head><title>Unavailable</title></head><body><h1>Page Error</h1><p>${err?.message || 'Failed to fetch'}</p></body></html>`;
    }

    // Parse with Cheerio
    const $ = cheerio.load(html);

    // Extract basic meta tags
    const title = $('title').text().trim();
    const metaDescription =
      $('meta[name="description" i]').attr('content')?.trim() ||
      $('meta[property="og:description" i]').attr('content')?.trim() ||
      '';
    const canonical = $('link[rel="canonical" i]').attr('href')?.trim() || '';
    const robotsMeta =
      $('meta[name="robots" i]').attr('content')?.trim() ||
      responseHeaders['x-robots-tag'] ||
      '';

    // Extract headings
    const h1s: string[] = [];
    const h2s: string[] = [];
    const h3s: string[] = [];
    const h4s: string[] = [];
    const h5s: string[] = [];
    const h6s: string[] = [];
    const hierarchy: Array<{ level: number; text: string }> = [];

    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!text) return;

      const level = parseInt(tag.replace('h', ''), 10);
      hierarchy.push({ level, text });

      if (tag === 'h1') h1s.push(text);
      else if (tag === 'h2') h2s.push(text);
      else if (tag === 'h3') h3s.push(text);
      else if (tag === 'h4') h4s.push(text);
      else if (tag === 'h5') h5s.push(text);
      else if (tag === 'h6') h6s.push(text);
    });

    // Extract links
    const links: CrawledLink[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }

      let resolved = href;
      try {
        resolved = new URL(href, finalUrl).href;
      } catch {
        return;
      }

      const isInternal = this.isSameDomain(resolved, rootOrigin, finalUrl);

      const anchorText = $(el).text().replace(/\s+/g, ' ').trim();
      const rel = $(el).attr('rel') || '';

      links.push({
        href,
        resolvedUrl: resolved,
        anchorText,
        rel,
        isInternal,
      });
    });

    // Extract images
    const images: CrawledImage[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (!src) return;

      const alt = $(el).attr('alt') !== undefined ? $(el).attr('alt')!.trim() : '';
      const widthAttr = $(el).attr('width');
      const heightAttr = $(el).attr('height');
      const width = widthAttr ? parseInt(widthAttr, 10) : undefined;
      const height = heightAttr ? parseInt(heightAttr, 10) : undefined;
      const isDecorative = alt === '' && ($(el).attr('role') === 'presentation' || $(el).attr('aria-hidden') === 'true');

      images.push({
        src,
        alt,
        width: !isNaN(width || NaN) ? width : undefined,
        height: !isNaN(height || NaN) ? height : undefined,
        isDecorative,
      });
    });

    // Extract JSON-LD
    const jsonLd: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      const content = $(el).html()?.trim();
      if (content) {
        try {
          const parsed = JSON.parse(content);
          jsonLd.push(parsed);
        } catch {
          jsonLd.push({ __error: 'invalid_json', raw: content.slice(0, 200) });
        }
      }
    });

    // Visible body text for simhash
    $('script, style, noscript, svg').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const textHash = calculateSimhash(bodyText);

    // Client-rendered check per spec
    // "very little body text plus a root div / __NEXT_DATA__"
    const hasClientRoot = $('#root').length > 0 || $('#__next').length > 0 || $('#app').length > 0 || html.includes('__NEXT_DATA__');
    const isClientRendered = bodyText.length < 250 && hasClientRoot;

    return {
      url: targetUrl,
      finalUrl,
      status,
      redirectChain,
      headers: responseHeaders,
      html,
      title,
      metaDescription,
      canonical,
      robotsMeta,
      h1ToH6: {
        h1s,
        h2s,
        h3s,
        h4s,
        h5s,
        h6s,
        hierarchy,
      },
      links,
      images,
      jsonLd,
      textHash,
      depth,
      inboundInternalLinks: 0, // will be populated in post-crawl pass
      isClientRendered,
      byteSize,
    };
  }

  private normalizeUrlKey(rawUrl: string): string {
    try {
      const u = new URL(rawUrl);
      // Remove trailing slash and hashes
      let path = u.pathname;
      if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
      }
      return `${u.protocol}//${u.host}${path}${u.search}`;
    } catch {
      return rawUrl;
    }
  }

  private isSameDomain(resolvedUrl: string, rootOrigin: string, finalUrl?: string): boolean {
    try {
      const linkHost = new URL(resolvedUrl).hostname.toLowerCase().replace(/^www\./, '');
      const rootHost = new URL(rootOrigin).hostname.toLowerCase().replace(/^www\./, '');
      const finalHost = finalUrl ? new URL(finalUrl).hostname.toLowerCase().replace(/^www\./, '') : rootHost;
      return linkHost === rootHost || linkHost === finalHost;
    } catch {
      return false;
    }
  }
}

/**
 * Extracts logo candidates from Cheerio-parsed HTML:
 * 1. JSON-LD Organization logo
 * 2. apple-touch-icon
 * 3. largest link[rel~=icon]
 * 4. /favicon.ico at origin
 * Resolves to absolute URLs, dedupes, and returns best-first.
 */
export function extractLogoCandidates($: cheerio.CheerioAPI, pageUrl: string): string[] {
  const candidates: string[] = [];

  const resolve = (relUrl?: string | null): string | null => {
    if (!relUrl || typeof relUrl !== 'string') return null;
    const trimmed = relUrl.trim();
    if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('javascript:')) return null;
    try {
      const parsed = new URL(trimmed, pageUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      // Ignore URL parsing errors
    }
    return null;
  };

  // 1. JSON-LD Organization / Corporation / LocalBusiness / Brand logo
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (!raw) return;
      const data = JSON.parse(raw);
      const items = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray(data['@graph'])
        ? data['@graph']
        : [data];

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const type = String(item['@type'] || '');
        const isOrg = /Organization|Corporation|LocalBusiness|WebSite|Store|Brand/i.test(type);
        if (isOrg) {
          const logo = item.logo;
          if (typeof logo === 'string') {
            const url = resolve(logo);
            if (url) candidates.push(url);
          } else if (logo && typeof logo === 'object' && typeof logo.url === 'string') {
            const url = resolve(logo.url);
            if (url) candidates.push(url);
          } else if (item.image) {
            if (typeof item.image === 'string') {
              const url = resolve(item.image);
              if (url) candidates.push(url);
            } else if (typeof item.image === 'object' && typeof item.image.url === 'string') {
              const url = resolve(item.image.url);
              if (url) candidates.push(url);
            }
          }
        }
      }
    } catch {
      // Ignore JSON parse errors in script tags
    }
  });

  // 2. apple-touch-icon (largest sizes first)
  const appleIcons: Array<{ href: string; size: number }> = [];
  $('link[rel*="apple-touch-icon"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolve(href);
    if (!resolved) return;
    const sizes = $(el).attr('sizes') || '';
    const match = sizes.match(/(\d+)x(\d+)/i);
    const size = match ? parseInt(match[1], 10) * parseInt(match[2], 10) : 180 * 180;
    appleIcons.push({ href: resolved, size });
  });
  appleIcons.sort((a, b) => b.size - a.size);
  appleIcons.forEach((item) => candidates.push(item.href));

  // 3. largest link[rel~=icon]
  const linkIcons: Array<{ href: string; size: number }> = [];
  $('link[rel~="icon"], link[rel="shortcut icon"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolve(href);
    if (!resolved) return;
    const sizes = $(el).attr('sizes') || '';
    let size = 16 * 16;
    if (sizes.toLowerCase() === 'any' || resolved.toLowerCase().endsWith('.svg')) {
      size = 999999;
    } else {
      const match = sizes.match(/(\d+)x(\d+)/i);
      if (match) {
        size = parseInt(match[1], 10) * parseInt(match[2], 10);
      }
    }
    linkIcons.push({ href: resolved, size });
  });
  linkIcons.sort((a, b) => b.size - a.size);
  linkIcons.forEach((item) => candidates.push(item.href));

  // 4. /favicon.ico at origin
  try {
    const origin = new URL(pageUrl).origin;
    candidates.push(`${origin}/favicon.ico`);
  } catch {}

  // Dedupe preserving order
  const uniqueCandidates: string[] = [];
  const seen = new Set<string>();
  for (const url of candidates) {
    if (!seen.has(url)) {
      seen.add(url);
      uniqueCandidates.push(url);
    }
  }

  return uniqueCandidates;
}

