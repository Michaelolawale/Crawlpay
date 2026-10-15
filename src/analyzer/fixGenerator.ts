import { SeoTechnicalData } from './seoParser';
import { ArchetypeProfile } from './archetypeDetector';

export interface CodePatches {
  nextJsMetadata: string;
  shopifyLiquid: string;
  htmlHeadBlock: string;
  schemaJsonLd: string;
}

export function generateCodePatches(
  pageUrl: string,
  seo: SeoTechnicalData,
  archetype: ArchetypeProfile
): CodePatches {
  let hostname = 'example.com';
  try {
    hostname = new URL(pageUrl).hostname;
  } catch {}

  const brandName = seo.openGraph.siteName || hostname.replace(/^www\./, '').split('.')[0].toUpperCase();
  const title = seo.title || `${brandName} — Official Website`;
  const description = seo.metaDescription || `Discover ${brandName}: Built for modern performance and reliability.`;
  const image = seo.openGraph.image || `https://${hostname}/og-image.jpg`;

  // 1. Next.js 14/15 App Router Metadata
  const nextJsMetadata = `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${escapeQuotes(title)}',
  description: '${escapeQuotes(description)}',
  alternates: {
    canonical: '${pageUrl}',
  },
  openGraph: {
    title: '${escapeQuotes(title)}',
    description: '${escapeQuotes(description)}',
    url: '${pageUrl}',
    siteName: '${escapeQuotes(brandName)}',
    images: [
      {
        url: '${image}',
        width: 1200,
        height: 630,
        alt: '${escapeQuotes(title)}',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '${escapeQuotes(title)}',
    description: '${escapeQuotes(description)}',
    images: ['${image}'],
  },
  robots: {
    index: true,
    follow: true,
  },
};`;

  // 2. Shopify Liquid Snippet
  const shopifyLiquid = `{% comment %}
  CrawlPay Automated SEO & Social Meta Snippet
  Add this directly inside <head>...</head> in theme.liquid
{% endcomment %}
<title>{{ page_title | default: "${escapeQuotes(title)}" }}</title>
<meta name="description" content="{{ page_description | default: "${escapeQuotes(description)}" }}">
<link rel="canonical" href="{{ canonical_url | default: "${pageUrl}" }}">

<!-- Open Graph / Social Tags -->
<meta property="og:site_name" content="${escapeQuotes(brandName)}">
<meta property="og:url" content="{{ canonical_url | default: "${pageUrl}" }}">
<meta property="og:title" content="{{ page_title | default: "${escapeQuotes(title)}" }}">
<meta property="og:description" content="{{ page_description | default: "${escapeQuotes(description)}" }}">
<meta property="og:type" content="product">
<meta property="og:image" content="${image}">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page_title | default: "${escapeQuotes(title)}" }}">
<meta name="twitter:description" content="{{ page_description | default: "${escapeQuotes(description)}" }}">
<meta name="twitter:image" content="${image}">`;

  // 3. Plain HTML Head Block
  const htmlHeadBlock = `<!-- CrawlPay Verified HTML Meta Tags -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${pageUrl}">
<meta name="robots" content="index, follow">

<!-- OpenGraph Social Cards -->
<meta property="og:type" content="website">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${image}">
<meta property="og:site_name" content="${escapeHtml(brandName)}">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${image}">`;

  // 4. Archetype-Tailored JSON-LD Schema
  let schemaObj: any = {};
  if (archetype.type === 'ecommerce') {
    schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: title,
      image: [image],
      description: description,
      brand: {
        '@type': 'Brand',
        name: brandName,
      },
      offers: {
        '@type': 'Offer',
        url: pageUrl,
        priceCurrency: 'USD',
        price: '49.00',
        availability: 'https://schema.org/InStock',
      },
    };
  } else if (archetype.type === 'saas' || archetype.type === 'web3') {
    schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: brandName,
      headline: title,
      operatingSystem: 'All',
      applicationCategory: 'BusinessApplication',
      url: pageUrl,
      description: description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    };
  } else if (archetype.type === 'local_business') {
    schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: brandName,
      url: pageUrl,
      image: image,
      telephone: '+1-555-0199',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '100 Main St',
        addressLocality: 'Metropolis',
        addressRegion: 'CA',
        postalCode: '90001',
        addressCountry: 'US',
      },
    };
  } else {
    schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: brandName,
      url: pageUrl,
      logo: image,
      description: description,
    };
  }

  const schemaJsonLd = `<script type="application/ld+json">
${JSON.stringify(schemaObj, null, 2)}
<\/script>`;

  return {
    nextJsMetadata,
    shopifyLiquid,
    htmlHeadBlock,
    schemaJsonLd,
  };
}

function escapeQuotes(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\n/g, ' ');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
