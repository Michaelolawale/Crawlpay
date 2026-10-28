import { SeoTechnicalData } from './seoParser';
import { ArchetypeProfile } from './archetypeDetector';

export interface SuggestedAiFix {
  title: string;
  description: string;
  stack: string;
  filePath: string;
  language: string;
  code: string;
  impact: 'High' | 'Medium' | 'Quick Win';
}

export interface CodePatches {
  nextJsMetadata: string;
  shopifyLiquid: string;
  wordPressPhp: string;
  astroSeo: string;
  htmlHeadBlock: string;
  schemaJsonLd: string;
  stackSummary: string;
  suggestedAiFixes: SuggestedAiFix[];
}

export function generateCodePatches(
  pageUrl: string,
  seo: SeoTechnicalData,
  archetype: ArchetypeProfile,
  detectedStack?: { cms?: string; seoPlugin?: string; framework?: string }
): CodePatches {
  let hostname = 'example.com';
  try {
    hostname = new URL(pageUrl).hostname;
  } catch {}

  const brandName = seo.openGraph.siteName || hostname.replace(/^www\./, '').split('.')[0].toUpperCase();
  const title = seo.title || `${brandName} — Official Website`;
  const description = seo.metaDescription || `Discover ${brandName}: Built for modern performance, mobile speed, and search visibility.`;
  const image = seo.openGraph.image || `https://${hostname}/og-image.jpg`;
  const cms = detectedStack?.cms || 'Unknown';

  // 1. Next.js 14/15 App Router Metadata & Viewport
  const nextJsMetadata = `import type { Metadata, Viewport } from 'next';

// 1. Mobile Viewport & Device Scale Configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow user zooming for WCAG accessibility
  themeColor: '#ffffff',
};

// 2. Complete Technical SEO & Social Metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://${hostname}'),
  title: {
    default: '${escapeQuotes(title)}',
    template: '%s | ${escapeQuotes(brandName)}',
  },
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
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};`;

  // 2. WordPress / WooCommerce PHP Hook
  const wordPressPhp = `<?php
/**
 * CrawlPay AI Stack-Tailored SEO & Mobile Performance Snippet
 * Add to your child theme's functions.php or a custom mu-plugin.
 */
add_action('wp_head', function () {
    $canonical_url = is_singular() ? get_permalink() : home_url(add_query_arg([], $GLOBALS['wp']->request));
    $og_title = esc_attr(wp_get_document_title());
    $og_desc = esc_attr(get_bloginfo('description') ?: '${escapeQuotes(description)}');
    $og_image = has_post_thumbnail() ? get_the_post_thumbnail_url(null, 'large') : '${image}';
    ?>
    <!-- CrawlPay Verified Mobile & SEO Meta Tags -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="canonical" href="<?php echo esc_url($canonical_url); ?>" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="<?php echo is_single() ? 'article' : 'website'; ?>" />
    <meta property="og:title" content="<?php echo $og_title; ?>" />
    <meta property="og:description" content="<?php echo $og_desc; ?>" />
    <meta property="og:url" content="<?php echo esc_url($canonical_url); ?>" />
    <meta property="og:site_name" content="${escapeQuotes(brandName)}" />
    <meta property="og:image" content="<?php echo esc_url($og_image); ?>" />
    <meta name="twitter:card" content="summary_large_image" />
    <?php
}, 1);

// Prevent Mobile CLS by ensuring all images output explicit width/height
add_filter('wp_get_attachment_image_attributes', function ($attr) {
    if (empty($attr['loading'])) {
        $attr['loading'] = 'lazy';
    }
    if (empty($attr['decoding'])) {
        $attr['decoding'] = 'async';
    }
    return $attr;
});
`;

  // 3. Shopify Liquid Snippet
  const shopifyLiquid = `{%- comment -%}
  CrawlPay Automated SEO, Mobile Viewport & Social Snippet
  Paste inside <head>...</head> in layout/theme.liquid
{%- endcomment -%}
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ page_title | default: "${escapeQuotes(title)}" }}</title>
<meta name="description" content="{{ page_description | default: "${escapeQuotes(description)}" | escape }}">
<link rel="canonical" href="{{ canonical_url | default: "${pageUrl}" }}">

<!-- Open Graph / Social Tags -->
<meta property="og:site_name" content="${escapeQuotes(brandName)}">
<meta property="og:url" content="{{ canonical_url | default: "${pageUrl}" }}">
<meta property="og:title" content="{{ page_title | default: "${escapeQuotes(title)}" | escape }}">
<meta property="og:description" content="{{ page_description | default: "${escapeQuotes(description)}" | escape }}">
<meta property="og:type" content="{% if template contains 'product' %}product{% else %}website{% endif %}">
<meta property="og:image" content="${image}">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page_title | default: "${escapeQuotes(title)}" | escape }}">
<meta name="twitter:description" content="{{ page_description | default: "${escapeQuotes(description)}" | escape }}">
<meta name="twitter:image" content="${image}">`;

  // 4. Astro Layout Snippet
  const astroSeo = `---
// src/layouts/Layout.astro
interface Props {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
}

const {
  title = "${escapeQuotes(title)}",
  description = "${escapeQuotes(description)}",
  canonical = "${pageUrl}",
  image = "${image}"
} = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
  </head>
  <body>
    <slot />
  </body>
</html>`;

  // 5. Plain HTML Head Block
  const htmlHeadBlock = `<!-- CrawlPay Verified HTML Meta Tags -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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

  // 6. Schema.org JSON-LD
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

  // 7. Structured Suggested AI Fixes Tailored to Stack
  const suggestedAiFixes: SuggestedAiFix[] = [];

  if (cms === 'Next.js') {
    suggestedAiFixes.push({
      title: 'App Router Dynamic Metadata & Viewport Fix',
      description: 'Exports strict typing for metadata and viewport to guarantee 100% mobile indexability and rich social previews.',
      stack: 'Next.js (App Router)',
      filePath: 'src/app/layout.tsx',
      language: 'typescript',
      code: nextJsMetadata,
      impact: 'High',
    });
    suggestedAiFixes.push({
      title: 'Mobile Responsive Image Optimization Component',
      description: 'Eliminates mobile Cumulative Layout Shift (CLS) and auto-serves AVIF/WebP with responsive viewport sizes.',
      stack: 'Next.js',
      filePath: 'src/components/OptimizedHeroImage.tsx',
      language: 'tsx',
      code: `import Image from 'next/image';

export function OptimizedHeroImage() {
  return (
    <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl">
      <Image
        src="${image}"
        alt="${escapeQuotes(title)}"
        fill
        priority
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
        className="object-cover"
      />
    </div>
  );
}`,
      impact: 'High',
    });
  } else if (cms === 'WordPress') {
    suggestedAiFixes.push({
      title: 'WordPress functions.php Canonical & Mobile Head Hook',
      description: 'Injects verified mobile viewport, canonical link, OpenGraph social cards, and automatic lazy-loading.',
      stack: 'WordPress',
      filePath: 'wp-content/themes/your-theme/functions.php',
      language: 'php',
      code: wordPressPhp,
      impact: 'High',
    });
  } else if (cms === 'Shopify') {
    suggestedAiFixes.push({
      title: 'Shopify Liquid Canonical & Mobile Viewport Tags',
      description: 'Prevents duplicate collection URL indexing and validates 375px mobile device responsiveness.',
      stack: 'Shopify',
      filePath: 'layout/theme.liquid',
      language: 'liquid',
      code: shopifyLiquid,
      impact: 'High',
    });
  } else if (cms === 'Astro') {
    suggestedAiFixes.push({
      title: 'Astro Layout Head & SEO Component',
      description: 'Standardizes mobile viewport, Open Graph cards, and canonical references across all static routes.',
      stack: 'Astro',
      filePath: 'src/layouts/Layout.astro',
      language: 'astro',
      code: astroSeo,
      impact: 'High',
    });
  }

  // Common high-impact schema fix for all stacks
  suggestedAiFixes.push({
    title: `${archetype.type.toUpperCase()} Structured Data (JSON-LD)`,
    description: 'Enables rich Google SERP snippet eligibility with machine-readable entity definitions.',
    stack: cms !== 'Unknown' ? cms : 'Standard HTML',
    filePath: cms === 'Next.js' ? 'src/app/layout.tsx' : 'index.html',
    language: 'html',
    code: schemaJsonLd,
    impact: 'Medium',
  });

  const stackSummary = `Tailored technical recommendations generated for ${hostname} running ${cms !== 'Unknown' ? cms : 'Standard Web'} architecture.`;

  return {
    nextJsMetadata,
    shopifyLiquid,
    wordPressPhp,
    astroSeo,
    htmlHeadBlock,
    schemaJsonLd,
    stackSummary,
    suggestedAiFixes,
  };
}

function escapeQuotes(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\n/g, ' ');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
