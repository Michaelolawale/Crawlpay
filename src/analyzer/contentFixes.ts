export interface SuggestedContentFix {
  type: 'meta_description' | 'title' | 'anchor_text' | 'image_alt' | 'image_dimensions' | 'viewport' | 'robots_noindex' | 'canonical' | 'heading';
  label: string;
  actionLabel: string;
  text: string;
  charCount?: number;
  recommendation: string;
}

/**
 * Format domain or brand into a human-readable title
 * e.g. "exampleglobal.org" -> "Example Global"
 */
export function formatBrandName(domainOrUrl: string, sampleTitle?: string): string {
  if (
    sampleTitle &&
    !sampleTitle.toLowerCase().includes('link') &&
    !sampleTitle.toLowerCase().includes('observed') &&
    !sampleTitle.toLowerCase().includes('internal') &&
    !sampleTitle.toLowerCase().includes('affects') &&
    !sampleTitle.toLowerCase().includes('defect')
  ) {
    const parts = sampleTitle.split(/\s*[|—–\-]\s*/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0 && parts[0].length >= 2 && parts[0].length <= 30) {
      return parts[0];
    }
  }

  const raw = domainOrUrl
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .split('/')[0]
    .split('.')[0];

  const suffixes = [
    'solutions', 'network', 'technologies', 'systems', 'global', 'media',
    'digital', 'labs', 'studio', 'studios', 'group', 'capital', 'ventures',
    'health', 'security', 'consulting', 'services', 'service', 'agency',
    'store', 'shop', 'hub', 'app', 'tech', 'pay', 'link', 'ai'
  ];

  let formatted = raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_.]/g, ' ');

  if (!formatted.includes(' ')) {
    const lower = raw.toLowerCase();
    for (const suffix of suffixes) {
      if (lower.endsWith(suffix) && lower.length > suffix.length + 2) {
        const prefix = raw.slice(0, raw.length - suffix.length);
        const suf = raw.slice(raw.length - suffix.length);
        formatted = `${prefix} ${suf}`;
        break;
      }
    }
  }

  return formatted.replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface ExtractedPageContext {
  url: string;
  pathname: string;
  pageType: 'home' | 'cart' | 'checkout' | 'about' | 'contact' | 'services' | 'pricing' | 'blog' | 'shop' | 'legal' | 'account' | 'general';
  pageLabel: string;
}

export function extractPageContext(
  observed?: string,
  snippet?: string,
  domain: string = 'your-site.com'
): ExtractedPageContext {
  let matched = '';
  const quoteMatch = observed?.match(/['"](https?:\/\/[^'"]+|\/[^'"]*)['"]/i);
  if (quoteMatch && quoteMatch[1]) {
    matched = quoteMatch[1];
  } else {
    const rawMatch = (observed + ' ' + (snippet || '')).match(/https?:\/\/[^\s'")>]+/i);
    if (rawMatch) matched = rawMatch[0];
  }

  const finalUrl = matched || `https://${domain}/`;
  let pathname = '/';
  try {
    pathname = new URL(finalUrl.startsWith('/') ? `https://${domain}${finalUrl}` : finalUrl).pathname.toLowerCase();
  } catch {}

  if (pathname.includes('cart')) return { url: finalUrl, pathname, pageType: 'cart', pageLabel: 'Shopping Cart' };
  if (pathname.includes('checkout')) return { url: finalUrl, pathname, pageType: 'checkout', pageLabel: 'Checkout' };
  if (pathname.includes('account') || pathname.includes('profile')) return { url: finalUrl, pathname, pageType: 'account', pageLabel: 'Customer Account' };
  if (pathname.includes('about')) return { url: finalUrl, pathname, pageType: 'about', pageLabel: 'About Us' };
  if (pathname.includes('contact') || pathname.includes('support')) return { url: finalUrl, pathname, pageType: 'contact', pageLabel: 'Contact Us' };
  if (pathname.includes('service') || pathname.includes('solution')) return { url: finalUrl, pathname, pageType: 'services', pageLabel: 'Services & Solutions' };
  if (pathname.includes('pricing') || pathname.includes('plan')) return { url: finalUrl, pathname, pageType: 'pricing', pageLabel: 'Pricing Plans' };
  if (pathname.includes('blog') || pathname.includes('news') || pathname.includes('post')) return { url: finalUrl, pathname, pageType: 'blog', pageLabel: 'Blog & Articles' };
  if (pathname.includes('shop') || pathname.includes('product') || pathname.includes('store') || pathname.includes('catalog')) return { url: finalUrl, pathname, pageType: 'shop', pageLabel: 'Products & Store' };
  if (pathname.includes('privacy') || pathname.includes('terms') || pathname.includes('policy')) return { url: finalUrl, pathname, pageType: 'legal', pageLabel: 'Privacy & Terms' };

  if (pathname === '/' || pathname === '') {
    return { url: `https://${domain}/`, pathname: '/', pageType: 'home', pageLabel: 'Home' };
  }

  const cleanPath = pathname.replace(/^\/|\/$/g, '').split('/').pop() || 'Page';
  const label = cleanPath.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { url: finalUrl, pathname, pageType: 'general', pageLabel: label };
}

/**
 * Deterministically generates ready-to-copy copywriting and tag fixes
 * for finding groups (Meta Description, Titles, Anchor text, Alt text, Viewports)
 */
export function getSuggestedContentFix(
  checkId: string,
  observedText?: string,
  domain: string = 'your-site.com',
  snippet?: string
): SuggestedContentFix | null {
  const normId = checkId.toLowerCase();
  const context = extractPageContext(observedText, snippet, domain);
  const brand = formatBrandName(domain);

  // 1. META DESCRIPTIONS
  if (normId.includes('descriptions.missing') || normId.includes('descriptions.too_short')) {
    let desc = '';
    switch (context.pageType) {
      case 'cart':
        desc = `Review your selected items in the ${brand} shopping cart. Enjoy secure checkout, fast order processing, and reliable customer support.`;
        break;
      case 'checkout':
        desc = `Complete your purchase at ${brand}. Encrypted SSL checkout, verified payment options, and instant order confirmation for all customers.`;
        break;
      case 'about':
        desc = `Learn about ${brand}: our mission, values, and industry expertise. Discover how our dedicated team delivers trusted results and excellence.`;
        break;
      case 'contact':
        desc = `Contact ${brand} today. Reach our support and sales team for assistance, inquiries, and consultations. We are ready to assist you.`;
        break;
      case 'services':
        desc = `Explore professional services from ${brand}. High-performance, scalable solutions tailored to help your organization achieve measurable growth.`;
        break;
      case 'pricing':
        desc = `View transparent pricing plans from ${brand}. Flexible options, clear deliverables, and no hidden fees. Choose the right plan for your team.`;
        break;
      case 'shop':
        desc = `Shop the official ${brand} catalog. Explore high-quality products, competitive pricing, and fast shipping. Order your items online today.`;
        break;
      case 'blog':
        desc = `Read the latest news, guides, and industry analysis from ${brand}. Stay informed with expert insights and practical best practices.`;
        break;
      case 'account':
        desc = `Access your ${brand} customer account. Manage active orders, review billing history, and update profile preferences securely.`;
        break;
      case 'legal':
        desc = `Read the official privacy policy and terms of service for ${brand}. Transparent guidelines on user data protection and service usage.`;
        break;
      case 'home':
      default:
        desc = `Welcome to ${brand}: Explore official updates, trusted services, and innovative digital solutions. Built for high performance, reliability, and speed.`;
        break;
    }

    return {
      type: 'meta_description',
      label: `Tailored Meta Description for ${context.pageLabel}`,
      actionLabel: 'Description',
      text: desc,
      charCount: desc.length,
      recommendation: `${desc.length} chars (within Google's optimal 120–155 char mobile SERP boundary)`,
    };
  }

  if (normId.includes('descriptions.too_long') || normId.includes('descriptions.duplicate')) {
    let extracted = '';
    const match = observedText?.match(/"([^"]+)"/) || snippet?.match(/content="([^"]+)"/);
    if (match && match[1]) {
      extracted = match[1].trim();
    }

    if (extracted && extracted.length > 150) {
      const truncated = extracted.slice(0, 150);
      const lastSentence = truncated.lastIndexOf('.');
      const cleanText = lastSentence > 80 ? truncated.slice(0, lastSentence + 1) : truncated.replace(/[,;:\s]+[^\s]*$/, '') + '...';
      return {
        type: 'meta_description',
        label: 'Optimized Meta Description (Condensed)',
        actionLabel: 'Description',
        text: cleanText,
        charCount: cleanText.length,
        recommendation: 'Condensed under 155 chars to prevent Google mobile truncation',
      };
    }

    const fallbackDesc = `Discover ${brand}: Explore official insights, featured resources, and news. Optimized for search accessibility and fast mobile loading.`;
    return {
      type: 'meta_description',
      label: `Optimized Meta Description for ${context.pageLabel}`,
      actionLabel: 'Description',
      text: fallbackDesc,
      charCount: fallbackDesc.length,
      recommendation: 'Condensed to optimal 120–155 chars',
    };
  }

  // 2. PAGE TITLES
  if (normId.includes('titles.too_long')) {
    let rawTitle = '';
    const match = observedText?.match(/"([^"]+)"/) || snippet?.match(/<title>([^<]+)<\/title>/);
    if (match && match[1]) {
      rawTitle = match[1].trim();
    }

    if (rawTitle && rawTitle.length > 58) {
      const segments = rawTitle.split(/\s*[|—–\-]\s*/).map((s) => s.trim()).filter(Boolean);
      let condensed = rawTitle;
      if (segments.length >= 3) {
        condensed = `${segments[0]} — ${segments[segments.length - 1]}`.trim();
        if (condensed.length > 58) {
          condensed = `${segments[0]} — ${segments[1]}`.trim();
        }
      } else if (segments.length === 2) {
        condensed = `${segments[0]} — ${segments[1]}`.trim();
      }
      if (condensed.length > 58) {
        condensed = condensed.slice(0, 55).trim() + '...';
      }

      return {
        type: 'title',
        label: 'Optimized Title Tag (< 60 Chars)',
        actionLabel: 'Title',
        text: condensed,
        charCount: condensed.length,
        recommendation: 'Under 60 chars (guarantees zero truncation in Google SERPs)',
      };
    }

    const fallbackTitle = `${context.pageLabel} | ${brand}`;
    return {
      type: 'title',
      label: 'Suggested Title Tag',
      actionLabel: 'Title',
      text: fallbackTitle,
      charCount: fallbackTitle.length,
      recommendation: 'Under 60 chars optimal search length',
    };
  }

  if (normId.includes('titles.missing') || normId.includes('titles.too_short') || normId.includes('titles.duplicate')) {
    let title = '';
    switch (context.pageType) {
      case 'cart':
        title = `Shopping Cart | ${brand}`;
        break;
      case 'checkout':
        title = `Secure Checkout | ${brand}`;
        break;
      case 'about':
        title = `About Us — Mission & Team | ${brand}`;
        break;
      case 'contact':
        title = `Contact Us — Customer Support | ${brand}`;
        break;
      case 'services':
        title = `Services & Solutions | ${brand}`;
        break;
      case 'pricing':
        title = `Pricing Plans & Options | ${brand}`;
        break;
      case 'shop':
        title = `Products & Catalog | ${brand}`;
        break;
      case 'blog':
        title = `Blog & Industry Insights | ${brand}`;
        break;
      case 'account':
        title = `Customer Account | ${brand}`;
        break;
      case 'legal':
        title = `Privacy & Terms | ${brand}`;
        break;
      case 'home':
      default:
        title = `${brand} — Official Website & Platform`;
        break;
    }

    return {
      type: 'title',
      label: `Tailored Title Tag for ${context.pageLabel}`,
      actionLabel: 'Title',
      text: title,
      charCount: title.length,
      recommendation: 'Under 60 chars optimal search visibility',
    };
  }

  // 3. EMPTY ANCHOR LINKS
  if (
    normId.includes('links.empty_anchor') ||
    normId.includes('empty anchor') ||
    normId.includes('links.empty') ||
    normId.includes('links.no_anchor') ||
    normId.startsWith('links')
  ) {
    const urlMatch = observedText?.match(/https?:\/\/[^\s'")]+/);
    const linkUrl = urlMatch ? urlMatch[0].toLowerCase() : '';

    let anchorText = `Visit ${brand}`;
    if (linkUrl.includes('instagram.com')) {
      anchorText = `Follow ${brand} on Instagram`;
    } else if (linkUrl.includes('twitter.com') || linkUrl.includes('x.com')) {
      anchorText = `Follow ${brand} on X`;
    } else if (linkUrl.includes('linkedin.com')) {
      anchorText = `Connect with ${brand} on LinkedIn`;
    } else if (linkUrl.includes('facebook.com')) {
      anchorText = `Visit ${brand} on Facebook`;
    } else if (linkUrl.includes('youtube.com')) {
      anchorText = `Subscribe to ${brand} on YouTube`;
    } else if (linkUrl.includes('github.com')) {
      anchorText = `View ${brand} on GitHub`;
    } else if (linkUrl.includes('tiktok.com')) {
      anchorText = `Watch ${brand} on TikTok`;
    } else if (linkUrl.includes('t.me/') || linkUrl.includes('telegram.me')) {
      anchorText = `Join ${brand} on Telegram`;
    } else if (linkUrl.includes('medium.com')) {
      anchorText = `Read ${brand} on Medium`;
    } else if (linkUrl.includes('contact') || linkUrl.includes('support')) {
      anchorText = `Contact ${brand} Support`;
    } else if (linkUrl.includes('about')) {
      anchorText = `About ${brand}`;
    } else if (linkUrl.includes('checkout') || linkUrl.includes('cart')) {
      anchorText = `Proceed to Checkout`;
    }

    return {
      type: 'anchor_text',
      label: 'Suggested Anchor Text',
      actionLabel: 'Anchor',
      text: anchorText,
      recommendation: 'Eliminates WCAG screen-reader warning & clarifies destination',
    };
  }

  // 4. DUPLICATE CONTENT (Near Duplicate Body Text)
  if (
    normId.includes('duplicate_content') ||
    normId.includes('near_duplicate') ||
    normId.includes('duplicate_body') ||
    normId.includes('duplicate content')
  ) {
    const isUtility = context.pageType === 'checkout' || context.pageType === 'cart' || context.pageType === 'account' ||
      observedText?.toLowerCase().includes('checkout') || observedText?.toLowerCase().includes('cart') ||
      snippet?.toLowerCase().includes('checkout') || snippet?.toLowerCase().includes('cart');

    if (isUtility) {
      return {
        type: 'robots_noindex',
        label: 'Exclude Duplicate Transactional Page from Search Index',
        actionLabel: 'Robots Tag',
        text: '<meta name="robots" content="noindex, follow" />',
        recommendation: 'Prevents search engines from indexing duplicate cart & checkout utility flows',
      };
    }

    const matchUrl = observedText?.match(/https?:\/\/[^\s'")]+/);
    const primaryUrl = matchUrl ? matchUrl[0] : `https://${domain}/`;
    return {
      type: 'canonical',
      label: 'Canonicalize to Master Authoritative URL',
      actionLabel: 'Canonical Tag',
      text: `<link rel="canonical" href="${primaryUrl}" />`,
      recommendation: 'Consolidates duplicate content signals into the primary canonical URL',
    };
  }

  // 5. IMAGES MISSING DIMENSIONS (Mobile CLS)
  if (
    normId.includes('images.missing_dimensions') ||
    normId.includes('missing dimensions') ||
    normId.includes('images.missing') ||
    normId.includes('mobile.cls_dimensions') ||
    normId.startsWith('images')
  ) {
    return {
      type: 'image_dimensions',
      label: 'Prevent Mobile Layout Shift (CLS)',
      actionLabel: 'Attributes',
      text: 'width="1200" height="630" loading="lazy" decoding="async"',
      recommendation: 'Paste attributes onto <img> tag to eliminate mobile visual jumps',
    };
  }

  // 6. IMAGES MISSING ALT
  if (normId.includes('images.missing_alt') || normId.includes('images.no_alt')) {
    return {
      type: 'image_alt',
      label: 'Suggested Image Alt Attribute',
      actionLabel: 'Alt Tag',
      text: `alt="${brand} — ${context.pageLabel} illustration"`,
      recommendation: 'Provides screen-reader accessibility and image search indexing',
    };
  }

  // 7. MOBILE VIEWPORT
  if (normId.includes('mobile.viewport') || normId.includes('viewport.missing')) {
    return {
      type: 'viewport',
      label: 'Standard Mobile Viewport Tag',
      actionLabel: 'Meta Tag',
      text: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      recommendation: 'Mandatory for Google Mobile-First Indexing & user zoom permissions',
    };
  }

  return null;
}
