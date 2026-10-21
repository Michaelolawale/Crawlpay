import * as cheerio from 'cheerio';
import { safeFetchHtml } from '../../utils/security';

/**
 * Discovers and parses sitemap.xml URLs
 */
export async function fetchAndParseSitemap(
  baseUrl: string,
  declaredSitemaps: string[] = []
): Promise<{ sitemapUrl?: string; urls: string[]; rawXml?: string; error?: string }> {
  const candidateUrls: string[] = [];

  if (declaredSitemaps && declaredSitemaps.length > 0) {
    candidateUrls.push(...declaredSitemaps);
  }

  try {
    const origin = new URL(baseUrl).origin;
    candidateUrls.push(`${origin}/sitemap.xml`);
    candidateUrls.push(`${origin}/sitemap_index.xml`);
  } catch {}

  const seenUrls = new Set<string>();
  let primarySitemapUrl: string | undefined;
  let rawContent: string | undefined;

  for (const sitemapUrl of candidateUrls) {
    try {
      const xml = await safeFetchHtml(sitemapUrl, 2 * 1024 * 1024, 6000);
      if (!xml || (!xml.includes('<urlset') && !xml.includes('<sitemapindex') && !xml.includes('<loc>'))) {
        continue;
      }

      primarySitemapUrl = sitemapUrl;
      rawContent = xml;

      const $ = cheerio.load(xml, { xmlMode: true });

      // Check if it's a sitemap index
      const sitemapTags = $('sitemap > loc');
      if (sitemapTags.length > 0) {
        // Child sitemaps - fetch up to first 2 to keep crawl within limits
        const childSitemaps: string[] = [];
        sitemapTags.slice(0, 3).each((_, el) => {
          const loc = $(el).text().trim();
          if (loc) childSitemaps.push(loc);
        });

        for (const childUrl of childSitemaps) {
          try {
            const childXml = await safeFetchHtml(childUrl, 2 * 1024 * 1024, 4000);
            const $child = cheerio.load(childXml, { xmlMode: true });
            $child('url > loc').each((_, el) => {
              const url = $child(el).text().trim();
              if (url) seenUrls.add(url);
            });
          } catch {}
        }
      } else {
        // Standard sitemap
        $('url > loc').each((_, el) => {
          const url = $(el).text().trim();
          if (url) seenUrls.add(url);
        });
      }

      if (seenUrls.size > 0) {
        break;
      }
    } catch {
      // Continue to next candidate
    }
  }

  return {
    sitemapUrl: primarySitemapUrl,
    urls: Array.from(seenUrls),
    rawXml: rawContent,
  };
}
