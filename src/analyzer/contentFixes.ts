export interface SuggestedContentFix {
  type: 'meta_description' | 'title' | 'anchor_text' | 'image_alt' | 'image_dimensions' | 'viewport' | 'generic';
  label: string;
  actionLabel: string;
  text: string;
  charCount?: number;
  recommendation: string;
}

/**
 * Format domain or brand into a human-readable title
 * e.g. "evangelcarriersnetwork.org" -> "ECN Global" or "Evangel Carriers Network"
 */
export function formatBrandName(domainOrUrl: string, sampleTitle?: string): string {
  if (
    sampleTitle &&
    !sampleTitle.toLowerCase().includes('link') &&
    !sampleTitle.toLowerCase().includes('observed') &&
    !sampleTitle.toLowerCase().includes('internal') &&
    !sampleTitle.toLowerCase().includes('affects')
  ) {
    const parts = sampleTitle.split(/\s*[|—–\-]\s*/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0 && parts[0].length >= 2 && parts[0].length <= 30) {
      return parts[0];
    }
  }

  const clean = domainOrUrl
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .split('/')[0]
    .split('.')[0];

  // Common acronym or domain formatting
  if (clean.toLowerCase() === 'evangelcarriersnetwork') {
    return 'ECN Global';
  }

  return clean
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_.]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  
  // Extract clean page title if mentioned inside quotation marks
  const titleMatch = observedText?.match(/"([^"]+)"/);
  const possibleTitle = titleMatch ? titleMatch[1] : undefined;
  const brand = formatBrandName(domain, possibleTitle);

  // 1. META DESCRIPTIONS
  if (normId.includes('descriptions.missing') || normId.includes('descriptions.too_short')) {
    const text = `Explore ${brand}: Official updates, verified services, and key resources. Designed for high performance, mobile speed, and seamless user experience.`;
    return {
      type: 'meta_description',
      label: 'Suggested Meta Description',
      actionLabel: 'Description',
      text,
      charCount: text.length,
      recommendation: '70–160 chars (100% visible on mobile & desktop Google snippets)',
    };
  }

  if (normId.includes('descriptions.too_long') || normId.includes('descriptions.duplicate')) {
    // Attempt to extract existing description from observed or snippet
    let extracted = '';
    const match = observedText?.match(/"([^"]+)"/) || snippet?.match(/content="([^"]+)"/);
    if (match && match[1]) {
      extracted = match[1].trim();
    }

    if (extracted && extracted.length > 150) {
      // Find the last sentence or word boundary before 150 chars
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

    const text = `Discover ${brand}: Explore official insights, featured resources, and news. Optimized for search accessibility and fast mobile loading.`;
    return {
      type: 'meta_description',
      label: 'Recommended Meta Description',
      actionLabel: 'Description',
      text,
      charCount: text.length,
      recommendation: '70–160 chars optimal search standard',
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
      // Split on separators (| or — or -)
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

    const fallbackTitle = `${brand} — Official Home & Resources`;
    return {
      type: 'title',
      label: 'Suggested Title Tag',
      actionLabel: 'Title',
      text: fallbackTitle,
      charCount: fallbackTitle.length,
      recommendation: 'Under 60 chars optimal search length',
    };
  }

  if (normId.includes('titles.missing') || normId.includes('titles.too_short')) {
    const text = `${brand} — Official Website & Platform`;
    return {
      type: 'title',
      label: 'Recommended Title Tag',
      actionLabel: 'Title',
      text,
      charCount: text.length,
      recommendation: '30–60 chars optimal search visibility',
    };
  }

  // 3. EMPTY ANCHOR LINKS
  if (normId.includes('links.empty_anchor') || normId.includes('links.no_anchor')) {
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
    } else if (linkUrl.includes('contact') || linkUrl.includes('support')) {
      anchorText = `Contact ${brand} Support`;
    } else if (linkUrl.includes('about')) {
      anchorText = `About ${brand}`;
    }

    return {
      type: 'anchor_text',
      label: 'Suggested Anchor Text',
      actionLabel: 'Anchor',
      text: anchorText,
      recommendation: 'Eliminates WCAG screen-reader warning & clarifies destination',
    };
  }

  // 4. IMAGES MISSING DIMENSIONS (Mobile CLS)
  if (normId.includes('images.missing_dimensions') || normId.includes('mobile.cls_dimensions')) {
    return {
      type: 'image_dimensions',
      label: 'Prevent Mobile Layout Shift (CLS)',
      actionLabel: 'Attributes',
      text: 'width="1200" height="630" loading="lazy" decoding="async"',
      recommendation: 'Paste attributes onto <img> tag to eliminate mobile visual jumps',
    };
  }

  // 5. IMAGES MISSING ALT
  if (normId.includes('images.missing_alt') || normId.includes('images.no_alt')) {
    return {
      type: 'image_alt',
      label: 'Suggested Image Alt Attribute',
      actionLabel: 'Alt Tag',
      text: `alt="${brand} featured illustration"`,
      recommendation: 'Provides screen-reader accessibility and image search indexing',
    };
  }

  // 6. MOBILE VIEWPORT
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
