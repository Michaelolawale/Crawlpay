import * as cheerio from 'cheerio';

export interface SeoTechnicalData {
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  canonicalUrl: string;
  robots: string;
  isIndexable: boolean;
  openGraph: {
    title: string;
    description: string;
    image: string;
    type: string;
    siteName: string;
    hasCompleteOg: boolean;
  };
  twitterCard: {
    card: string;
    title: string;
    description: string;
    image: string;
    hasCompleteTwitter: boolean;
  };
  headings: {
    h1s: string[];
    h2Count: number;
    h3Count: number;
    hasSingleH1: boolean;
  };
  images: {
    total: number;
    missingAlt: number;
    altCoveragePercent: number;
  };
  links: {
    internalCount: number;
    externalCount: number;
  };
  technical: {
    hasViewport: boolean;
    hasCharset: boolean;
    lang: string;
    hasJsonLd: boolean;
    existingSchemas: string[];
  };
}

export function parseTechnicalSeo($: cheerio.CheerioAPI, pageUrl: string): SeoTechnicalData {
  const title = $('title').first().text().trim() || '';
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || '';
  const robots = $('meta[name="robots"]').attr('content')?.toLowerCase() || 'index, follow';
  const isIndexable = !robots.includes('noindex');

  // Open Graph
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || '';
  const ogDesc = $('meta[property="og:description"]').attr('content')?.trim() || '';
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim() || '';
  const ogType = $('meta[property="og:type"]').attr('content')?.trim() || 'website';
  const ogSiteName = $('meta[property="og:site_name"]').attr('content')?.trim() || '';
  const hasCompleteOg = !!(ogTitle && ogDesc && ogImage);

  // Twitter Card
  const twitterCard = $('meta[name="twitter:card"]').attr('content')?.trim() || '';
  const twitterTitle = $('meta[name="twitter:title"]').attr('content')?.trim() || '';
  const twitterDesc = $('meta[name="twitter:description"]').attr('content')?.trim() || '';
  const twitterImage = $('meta[name="twitter:image"]').attr('content')?.trim() || '';
  const hasCompleteTwitter = !!(twitterCard && twitterTitle && twitterImage);

  // Headings
  const h1s: string[] = [];
  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1s.push(text);
  });
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;

  // Images
  const images = $('img');
  let missingAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt.trim() === '') {
      missingAlt++;
    }
  });
  const totalImages = images.length;
  const altCoveragePercent = totalImages === 0 ? 100 : Math.round(((totalImages - missingAlt) / totalImages) * 100);

  // Links
  let internalCount = 0;
  let externalCount = 0;
  let originHost = '';
  try {
    originHost = new URL(pageUrl).hostname;
  } catch {}

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim() || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    if (href.startsWith('/') || (originHost && href.includes(originHost))) {
      internalCount++;
    } else if (href.startsWith('http://') || href.startsWith('https://')) {
      externalCount++;
    }
  });

  // Technical meta
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasCharset = $('meta[charset]').length > 0 || $('meta[http-equiv="Content-Type"]').length > 0;
  const lang = $('html').attr('lang') || '';

  // Schema.org JSON-LD
  const existingSchemas: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || '{}');
      if (parsed['@type']) {
        existingSchemas.push(String(parsed['@type']));
      } else if (Array.isArray(parsed['@graph'])) {
        parsed['@graph'].forEach((item: any) => {
          if (item['@type']) existingSchemas.push(String(item['@type']));
        });
      }
    } catch {}
  });

  return {
    title,
    titleLength: title.length,
    metaDescription,
    metaDescriptionLength: metaDescription.length,
    canonicalUrl,
    robots,
    isIndexable,
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      image: ogImage,
      type: ogType,
      siteName: ogSiteName,
      hasCompleteOg,
    },
    twitterCard: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDesc,
      image: twitterImage,
      hasCompleteTwitter,
    },
    headings: {
      h1s,
      h2Count,
      h3Count,
      hasSingleH1: h1s.length === 1,
    },
    images: {
      total: totalImages,
      missingAlt,
      altCoveragePercent,
    },
    links: {
      internalCount,
      externalCount,
    },
    technical: {
      hasViewport,
      hasCharset,
      lang,
      hasJsonLd: existingSchemas.length > 0,
      existingSchemas,
    },
  };
}
