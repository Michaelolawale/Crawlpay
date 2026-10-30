/**
 * Comprehensive Knowledge Base and Explainer Engine for CrawlPay Audit Findings.
 * Translates deterministic technical check IDs into plain-English explanations,
 * real-world business & SEO impact, step-by-step actions, and ready-to-copy code fixes.
 */

import { formatBrandName, extractPageContext, ExtractedPageContext } from './contentFixes';

export interface FindingExplanation {
  title: string;
  category: 'AI Search (GEO)' | 'Answer Engine (AEO)' | 'Core Technical' | 'Mobile Usability' | 'Speed & Vitals' | 'On-Page Content' | 'Structured Data' | 'Social & Meta';
  whyItMatters: string;
  actionSteps: string[];
  suggestedFix?: string;
  suggestedFixLanguage?: 'html' | 'typescript' | 'json' | 'robots' | 'bash';
  impactLevel: 'Critical Blocker' | 'High Impact' | 'Medium Priority' | 'Quick Win';
}

function extractTargetUrl(observed?: string, snippet?: string, fallbackDomain: string = 'example.com'): string {
  if (snippet) {
    const hrefMatch = snippet.match(/href=["']([^"']+)["']/i);
    if (hrefMatch && hrefMatch[1] && hrefMatch[1] !== '#' && !hrefMatch[1].startsWith('javascript:')) {
      return hrefMatch[1];
    }
  }
  if (observed) {
    const quoteMatch = observed.match(/['"](https?:\/\/[^'"]+|\/[^'"]*)['"]/i);
    if (quoteMatch && quoteMatch[1]) {
      return quoteMatch[1];
    }
    const rawUrl = observed.match(/https?:\/\/[^\s'")>]+/i);
    if (rawUrl) {
      return rawUrl[0];
    }
  }
  return `https://${fallbackDomain}/`;
}

function deriveAnchorDetails(url: string, brand: string): { label: string; isSocial: boolean } {
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com')) return { label: `Follow ${brand} on Instagram`, isSocial: true };
  if (lower.includes('twitter.com') || lower.includes('x.com')) return { label: `Follow ${brand} on X`, isSocial: true };
  if (lower.includes('linkedin.com')) return { label: `Connect with ${brand} on LinkedIn`, isSocial: true };
  if (lower.includes('facebook.com')) return { label: `Visit ${brand} on Facebook`, isSocial: true };
  if (lower.includes('youtube.com')) return { label: `Subscribe to ${brand} on YouTube`, isSocial: true };
  if (lower.includes('github.com')) return { label: `View ${brand} on GitHub`, isSocial: true };
  if (lower.includes('tiktok.com')) return { label: `Watch ${brand} on TikTok`, isSocial: true };
  if (lower.includes('discord.com') || lower.includes('discord.gg')) return { label: `Join ${brand} Discord`, isSocial: true };
  if (lower.includes('t.me/') || lower.includes('telegram.me')) return { label: `Join ${brand} on Telegram`, isSocial: true };
  if (lower.includes('medium.com')) return { label: `Read ${brand} on Medium`, isSocial: true };
  if (lower.includes('contact') || lower.includes('support')) return { label: `Contact ${brand}`, isSocial: false };
  if (lower.includes('about')) return { label: `About ${brand}`, isSocial: false };
  if (lower.includes('pricing') || lower.includes('plans')) return { label: `View Pricing Plans`, isSocial: false };
  if (lower.includes('login') || lower.includes('signin')) return { label: `Sign In to ${brand}`, isSocial: false };
  if (lower.includes('checkout') || lower.includes('cart')) return { label: `Proceed to Checkout`, isSocial: false };
  if (lower.includes('signup') || lower.includes('register')) return { label: `Create an Account`, isSocial: false };

  try {
    const parsed = new URL(url.startsWith('/') ? `https://dummy.com${url}` : url);
    const pathPart = parsed.pathname.replace(/^\/|\/$/g, '').split('/').pop();
    if (pathPart) {
      const clean = pathPart.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return { label: `${clean} — ${brand}`, isSocial: false };
    }
  } catch {}

  return { label: `Visit ${brand}`, isSocial: false };
}

function extractImgSrc(observed?: string, snippet?: string, fallbackDomain: string = 'example.com'): string {
  if (snippet) {
    const srcMatch = snippet.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) return srcMatch[1];
  }
  if (observed) {
    const quoteMatch = observed.match(/['"]([^'"]+\.(?:png|jpg|jpeg|webp|svg|gif|avif)[^'"]*)['"]/i);
    if (quoteMatch && quoteMatch[1]) return quoteMatch[1];
    const urlMatch = observed.match(/https?:\/\/[^\s'")>]+\.(?:png|jpg|jpeg|webp|svg|gif|avif)/i);
    if (urlMatch) return urlMatch[0];
  }
  return `/assets/images/featured-${fallbackDomain.split('.')[0]}.webp`;
}

export function getFindingKnowledge(
  checkId: string,
  observed?: string,
  detectedStack?: { cms?: string; framework?: string; seoPlugin?: string },
  domain: string = 'yourdomain.com',
  snippet?: string
): FindingExplanation {
  const cms = detectedStack?.cms || 'Modern Web Stack';
  const brand = formatBrandName(domain);
  const context = extractPageContext(observed, snippet, domain);

  // Normalize check ID: strip trailing parenthetical page counts, lowercase, convert hyphens/spaces
  const raw = checkId
    .toLowerCase()
    .replace(/\s*\(\d+\s*pages?\)/g, '')
    .replace(/[—–]/g, '.')
    .replace(/\s+/g, '_')
    .trim();

  // =========================================================================
  // 1. DUPLICATE CONTENT (Simhash Near-Duplicate Body & Canonical Splits)
  // =========================================================================
  if (raw.includes('duplicate_content') || raw.includes('near_duplicate') || raw.includes('duplicate_body')) {
    const isUtility = context.pageType === 'checkout' || context.pageType === 'cart' || context.pageType === 'account' ||
      observed?.toLowerCase().includes('checkout') || observed?.toLowerCase().includes('cart') ||
      snippet?.toLowerCase().includes('checkout') || snippet?.toLowerCase().includes('cart');

    const matchUrl = observed?.match(/https?:\/\/[^\s'")]+/);
    const primaryUrl = matchUrl ? matchUrl[0] : `https://${domain}/`;

    return {
      title: 'Near-Duplicate Page Content Detected',
      category: 'On-Page Content',
      whyItMatters:
        'Search engines penalize or de-index pages that share identical or near-identical body text fingerprints (Simhash Hamming distance <= 3). When multiple URLs (e.g. cart and checkout, or trailing-slash variations) serve duplicate copy without canonical tags or noindex rules, crawl budget is wasted and rankings are diluted.',
      actionSteps: [
        'For duplicate transactional pages (such as Cart and Checkout), add `<meta name="robots" content="noindex, follow">` to keep them out of search indexation.',
        `For alternate duplicate URLs, add a canonical link tag pointing to the master URL: \`<link rel="canonical" href="${primaryUrl}">\`.`,
        'Ensure public landing pages feature distinct, substantive copy tailored to the unique user intent.',
      ],
      suggestedFix: isUtility
        ? `<!-- Prevent search engines from indexing duplicate transactional utility pages -->\n<meta name="robots" content="noindex, follow" />`
        : `<!-- Consolidate duplicate page authority to primary master URL -->\n<link rel="canonical" href="${primaryUrl}" />`,
      suggestedFixLanguage: 'html',
      impactLevel: 'High Impact',
    };
  }

  // =========================================================================
  // 2. GEO CHECKS (Generative Engine Optimization & AI Crawlers)
  // =========================================================================
  if (raw.includes('client_render_barrier') || raw === 'geo.client_render_barrier') {
    return {
      title: 'Client-Side JavaScript Barrier (AI Crawlers Blocked)',
      category: 'AI Search (GEO)',
      whyItMatters:
        'AI search engines (such as ChatGPT Search, Claude, and Perplexity) crawl pages with fast HTTP bots that do not execute client-side JavaScript. Because your page renders inside the user\'s browser, AI crawlers receive an empty HTML document with no visible text, preventing your business from ever being cited or summarized in generative answers.',
      actionSteps: [
        'Enable Server-Side Rendering (SSR) or Static Site Generation (SSG) in your framework.',
        'Ensure critical text, headings, and product details appear in the initial HTML response before client hydration.',
        `Verify by running \`curl -sL https://${domain}\` in your terminal to confirm your content is visible without JavaScript.`,
      ],
      suggestedFix:
        cms === 'Next.js'
          ? `// Next.js: Use Server Components (default in App Router) instead of 'use client' for text content.\nexport default async function Page() {\n  return (\n    <main>\n      <h1>${brand} — Pre-Rendered Content</h1>\n      <p>This HTML is immediately readable by AI search bots.</p>\n    </main>\n  );\n}`
          : `<!-- Ensure main content is pre-rendered in HTML body -->\n<div id="root">\n  <header><h1>${brand}</h1></header>\n  <main><p>Search engines and AI bots index this visible text without client JavaScript execution.</p></main>\n</div>`,
      suggestedFixLanguage: cms === 'Next.js' ? 'typescript' : 'html',
      impactLevel: 'Critical Blocker',
    };
  }

  if (raw.includes('ai_bot_access') || raw === 'geo.ai_bot_access') {
    return {
      title: 'AI Search Bots Blocked in robots.txt',
      category: 'AI Search (GEO)',
      whyItMatters:
        'Your robots.txt file contains rules that block leading AI search bots (like GPTBot, ClaudeBot, or PerplexityBot). When blocked, AI search engines cannot index your content, update their knowledge about your product, or cite your website when answering user inquiries.',
      actionSteps: [
        'Open your public `robots.txt` file (located at the root of your web server).',
        'Add explicit `Allow` directives for legitimate search and answer engine user agents.',
        'Ensure you do not have broad `Disallow: /` directives under `User-agent: *` that unintentionally lock out AI bots.',
      ],
      suggestedFix: `# RFC 9309 Compliant AI Bot Permissions\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: CCBot\nDisallow: /`,
      suggestedFixLanguage: 'robots',
      impactLevel: 'Critical Blocker',
    };
  }

  if (raw.includes('waf_probe') || raw === 'geo.waf_probe') {
    return {
      title: 'Edge WAF / Firewall Blocking AI Crawlers (403 Forbidden)',
      category: 'AI Search (GEO)',
      whyItMatters:
        'Your Web Application Firewall (WAF) or CDN (such as Cloudflare, AWS WAF, or Akamai) rejected requests carrying the GPTBot user-agent header with a 403 Forbidden error. Even if your robots.txt allows AI crawlers, your network firewall is actively dropping them before they can fetch your page.',
      actionSteps: [
        'Log in to your CDN or Cloudflare / AWS WAF security dashboard.',
        'Navigate to Security > WAF > Custom Rules (or Managed Rules).',
        'Add an exemption or bypass rule for verified AI search user agents (GPTBot, ClaudeBot, PerplexityBot).',
        `Verify reachability by running: \`curl -I -A "GPTBot" https://${domain}\` to confirm an HTTP 200 response.`,
      ],
      suggestedFix: `# Cloudflare WAF Expression\n(http.user_agent contains "GPTBot" or http.user_agent contains "PerplexityBot" or http.user_agent contains "ClaudeBot") -> Action: Skip Managed Rules`,
      suggestedFixLanguage: 'bash',
      impactLevel: 'Critical Blocker',
    };
  }

  if (raw.includes('entity_declared') || raw === 'geo.entity_declared') {
    return {
      title: 'Missing Brand Entity Grounding (sameAs Schema)',
      category: 'AI Search (GEO)',
      whyItMatters:
        'Large Language Models and Google Knowledge Graph rely on explicit `sameAs` entity declarations in your JSON-LD schema to verify your company\'s identity and authority. Without verified Wikidata, Wikipedia, Crunchbase, or verified social profiles, AI models treat your brand as an ungrounded entity with low citation confidence.',
      actionSteps: [
        'Add an `Organization` schema to your root layout with a `sameAs` array.',
        'Include permanent, authoritative profile links (e.g., Wikidata ID, LinkedIn company page, Crunchbase, GitHub).',
        'Do not invent non-existent URLs; link only to active, verifiable public profiles.',
      ],
      suggestedFix: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "${brand}",\n  "url": "https://${domain}",\n  "sameAs": [\n    "https://www.linkedin.com/company/${domain.split('.')[0]}",\n    "https://x.com/${domain.split('.')[0]}"\n  ]\n}\n</script>`,
      suggestedFixLanguage: 'html',
      impactLevel: 'High Impact',
    };
  }

  if (raw.includes('authorship_freshness') || raw === 'geo.authorship_freshness') {
    return {
      title: 'Missing Content Authorship & Freshness Signals',
      category: 'AI Search (GEO)',
      whyItMatters:
        'AI engines prioritize content with clear human authorship, verified domain expertise, and explicit publication/update dates. Pages without timestamps or author attribution are downgraded by generative engines when determining citation freshness.',
      actionSteps: [
        'Add a `<meta name="author" content="...">` tag to your document `<head>`.',
        'Include ISO-8601 formatted `datePublished` and `dateModified` in your JSON-LD schema.',
        'Display visible author names and last-updated dates on user-facing articles.',
      ],
      suggestedFix: `<meta name="author" content="${brand} Editorial Team" />\n<meta property="article:modified_time" content="${new Date().toISOString()}" />`,
      suggestedFixLanguage: 'html',
      impactLevel: 'Medium Priority',
    };
  }

  if (raw.includes('llms_txt') || raw === 'geo.llms_txt') {
    return {
      title: 'Missing /llms.txt AI Context File',
      category: 'AI Search (GEO)',
      whyItMatters:
        'The `/llms.txt` standard is an emerging markdown convention that provides AI agents with a curated map of your documentation, API endpoints, and core product facts. Adding this file helps AI developer tools and search agents consume your site efficiently.',
      actionSteps: [
        'Create a plain text markdown file at `public/llms.txt`.',
        'Summarize your primary business purpose, main documentation links, and API specifications.',
        'Keep the syntax clean and hierarchical using markdown headings.',
      ],
      suggestedFix: `# ${brand}\n\n> Official platform and resources for ${brand}.\n\n## Core Services\n- [API Documentation](https://${domain}/docs/api): REST & x402 endpoints\n- [Audit Engine](https://${domain}/app/audit): Deterministic crawler specifications`,
      suggestedFixLanguage: 'robots',
      impactLevel: 'Quick Win',
    };
  }

  // =========================================================================
  // 3. AEO CHECKS (Answer Engine Optimization)
  // =========================================================================
  if (raw.includes('question_headings') || raw === 'aeo.question_headings') {
    return {
      title: 'Section Headings Lack Question-First Phrasing',
      category: 'Answer Engine (AEO)',
      whyItMatters:
        'Voice search assistants and Google AI Overviews match search queries directly against heading tags phrased as natural-language questions (e.g., "What is X?", "How does Y work?"). Commercial keywords like "Best" or "Features" do not trigger conversational direct-answer extractions.',
      actionSteps: [
        'Rewrite H2 and H3 section titles to reflect the exact questions users type into search engines.',
        'Use true interrogative words: "How", "What", "Why", "Can", "Where", or "Which".',
        'Follow each question heading immediately with a 40 to 60 word direct, conclusive answer.',
      ],
      suggestedFix: `<h2>What is ${brand} and how does it work?</h2>\n<p>${brand} provides verified resources and high-performance digital services. Users can access platform tools directly online, explore real-time technical documentation, and deploy automated solutions with full mobile accessibility.</p>`,
      suggestedFixLanguage: 'html',
      impactLevel: 'High Impact',
    };
  }

  if (raw.includes('faq_schema') || raw === 'aeo.faq_schema') {
    return {
      title: 'Missing Machine-Readable FAQPage Schema',
      category: 'Answer Engine (AEO)',
      whyItMatters:
        'Structured FAQPage JSON-LD markup allows machine crawlers and LLMs to extract exact question-and-answer pairs without parsing messy layout HTML. Per Google policy, FAQ schema must match visible text on the page word-for-word.',
      actionSteps: [
        'Ensure the Q&A text is clearly visible to human readers on your webpage.',
        'Generate matching `FAQPage` JSON-LD schema containing those exact questions and answers.',
        'Embed the schema inside `<script type="application/ld+json">` in your document `<head>`.',
      ],
      suggestedFix: `<!-- Visible FAQ Section & Schema -->\n<section id="faq">\n  <h2>Frequently Asked Questions</h2>\n  <div>\n    <h3>What services does ${brand} provide?</h3>\n    <p>${brand} offers official resources, industry updates, and digital solutions designed for high performance and accessibility.</p>\n  </div>\n</section>\n\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n    {\n      "@type": "Question",\n      "name": "What services does ${brand} provide?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "${brand} offers official resources, industry updates, and digital solutions designed for high performance and accessibility."\n      }\n    }\n  ]\n}\n</script>`,
      suggestedFixLanguage: 'html',
      impactLevel: 'High Impact',
    };
  }

  if (raw.includes('structured_answers') || raw === 'aeo.structured_answers') {
    return {
      title: 'Missing Structured Lists & Comparison Tables',
      category: 'Answer Engine (AEO)',
      whyItMatters:
        'AI Overviews and Featured Snippets strongly favor step-by-step procedures formatted with `<ol>`/`<ul>` lists and comparative figures presented in semantic `<table>` tags. Dense, unbroken walls of text are frequently skipped by answer extraction algorithms.',
      actionSteps: [
        'Break multi-step instructions into numbered `<ol>` lists.',
        'Format pricing comparisons, feature matrices, or benchmarking data into clean semantic `<table>` markup.',
        'Provide a concise 1-sentence summary above every list or table.',
      ],
      suggestedFix: `<h3>3 Steps to Get Started with ${brand}</h3>\n<ol>\n  <li><strong>Explore Resources:</strong> Browse featured programs and platform tools.</li>\n  <li><strong>Verify Credentials:</strong> Register your organization for verified access.</li>\n  <li><strong>Deploy Solutions:</strong> Integrate tools with full mobile-ready responsiveness.</li>\n</ol>`,
      suggestedFixLanguage: 'html',
      impactLevel: 'Medium Priority',
    };
  }

  // =========================================================================
  // 4. LINKS & ANCHOR TEXT
  // =========================================================================
  if (
    raw.includes('empty_anchor') ||
    raw.includes('empty anchor') ||
    raw.includes('no_anchor') ||
    raw.includes('links.empty') ||
    raw.startsWith('links')
  ) {
    const targetUrl = extractTargetUrl(observed, snippet, domain);
    const { label: anchorLabel, isSocial } = deriveAnchorDetails(targetUrl, brand);
    const isExternal = isSocial || (targetUrl.startsWith('http') && !targetUrl.includes(domain));
    const targetAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';

    return {
      title: 'Empty Link Anchor Text Detected',
      category: 'On-Page Content',
      whyItMatters:
        'Search engine crawlers and AI bots use anchor text to determine the topic of destination pages. Links with empty or whitespace-only text fail to transfer ranking authority and violate WCAG 2.1 accessibility criteria for screen reader users.',
      actionSteps: [
        `Inspect the affected link pointing to "${targetUrl}" and insert clear, descriptive keyword text between <a> and </a>.`,
        `Add an \`aria-label="${anchorLabel}"\` attribute to ensure screen readers describe the destination.`,
        'Avoid generic placeholders like "click here" or bare raw URLs.',
      ],
      suggestedFix: `<!-- Accessible link to ${targetUrl} with descriptive anchor text -->\n<a href="${targetUrl}" aria-label="${anchorLabel}"${targetAttrs}>\n  <span>${anchorLabel}</span>\n</a>`,
      suggestedFixLanguage: 'html',
      impactLevel: 'Medium Priority',
    };
  }

  // =========================================================================
  // 5. IMAGES & MEDIA (Dimensions & Alt Attributes)
  // =========================================================================
  if (
    raw.includes('missing_dimensions') ||
    raw.includes('missing dimensions') ||
    raw.includes('images.missing') ||
    raw.includes('cls_dimensions') ||
    raw.startsWith('images')
  ) {
    const imgSrc = extractImgSrc(observed, snippet, domain);
    const alt = `${brand} — ${context.pageLabel} Visual`;

    return {
      title: 'Images Missing Explicit Width & Height',
      category: 'Speed & Vitals',
      whyItMatters:
        'When <img> tags lack explicit width and height HTML attributes, the browser cannot reserve layout space before downloading the image file. This causes sudden Cumulative Layout Shift (CLS) as content jumps, degrading user experience and lowering your Core Web Vitals score.',
      actionSteps: [
        `Add explicit \`width="..."\` and \`height="..."\` attributes to "${imgSrc}" matching its native aspect ratio.`,
        'Use CSS `aspect-ratio: auto` or container sizing to ensure responsive scaling across mobile viewports.',
        'In WordPress, insert media via standard Core Image blocks so WordPress automatically outputs responsive dimensions and srcset.',
      ],
      suggestedFix: `<!-- Reserved layout dimensions for ${imgSrc} to eliminate mobile CLS -->\n<img src="${imgSrc}" alt="${alt}" width="1200" height="630" loading="lazy" decoding="async" />`,
      suggestedFixLanguage: 'html',
      impactLevel: 'High Impact',
    };
  }

  if (raw.includes('missing_alt') || raw.includes('images.no_alt')) {
    const imgSrc = extractImgSrc(observed, snippet, domain);
    const alt = `${brand} — ${context.pageLabel} Illustration`;

    return {
      title: 'Images Missing Descriptive Alt Text',
      category: 'On-Page Content',
      whyItMatters:
        'The alt attribute provides alternative text for screen readers and allows Google Image Search to understand the content of your media. Images without alt text fail accessibility audits and miss high-intent image search traffic.',
      actionSteps: [
        `Add a descriptive \`alt="..."\` attribute to "${imgSrc}".`,
        'Describe the subject or function of the image in 4 to 8 words.',
        'Avoid stuffing keywords or using generic phrases like "image" or "picture".',
      ],
      suggestedFix: `<img src="${imgSrc}" alt="${alt}" loading="lazy" />`,
      suggestedFixLanguage: 'html',
      impactLevel: 'Medium Priority',
    };
  }

  // =========================================================================
  // 6. PAGE TITLES & META DESCRIPTIONS (Tailored to Page Context)
  // =========================================================================
  if (raw.includes('title') || raw.startsWith('titles')) {
    let existingTitle = '';
    const match = observed?.match(/["']([^"']{10,})["']/) || snippet?.match(/<title>([^<]+)<\/title>/i);
    if (match && match[1]) existingTitle = match[1].trim();

    let optimizedTitle = '';
    if (existingTitle && existingTitle.length > 58) {
      const segs = existingTitle.split(/\s*[|—–\-]\s*/).map((s) => s.trim()).filter(Boolean);
      if (segs.length >= 2) {
        optimizedTitle = `${segs[0]} — ${segs[1]}`.trim();
        if (optimizedTitle.length > 58) {
          optimizedTitle = optimizedTitle.slice(0, 55).trim() + '...';
        }
      } else {
        optimizedTitle = existingTitle.slice(0, 55).trim() + '...';
      }
    } else {
      switch (context.pageType) {
        case 'cart': optimizedTitle = `Shopping Cart | ${brand}`; break;
        case 'checkout': optimizedTitle = `Secure Checkout | ${brand}`; break;
        case 'about': optimizedTitle = `About Us — Mission & Team | ${brand}`; break;
        case 'contact': optimizedTitle = `Contact Us — Customer Support | ${brand}`; break;
        case 'services': optimizedTitle = `Services & Solutions | ${brand}`; break;
        case 'pricing': optimizedTitle = `Pricing Plans & Options | ${brand}`; break;
        case 'shop': optimizedTitle = `Products & Catalog | ${brand}`; break;
        case 'blog': optimizedTitle = `Blog & Industry Insights | ${brand}`; break;
        case 'account': optimizedTitle = `Customer Account | ${brand}`; break;
        case 'legal': optimizedTitle = `Privacy & Terms | ${brand}`; break;
        case 'home':
        default: optimizedTitle = `${brand} — Official Website & Platform`; break;
      }
    }

    return {
      title: 'Page Title Length or Duplication Defect',
      category: 'On-Page Content',
      whyItMatters:
        'The <title> tag is Google\'s primary headline in search engine result pages (SERPs). Titles under 30 characters fail to capture high-intent search queries, while titles over 60 characters get truncated with an unsightly ellipsis.',
      actionSteps: [
        'Write a unique, descriptive title between 50 and 60 characters (roughly 580 pixels).',
        'Place your primary target keyword near the beginning, followed by brand branding.',
        'Ensure every page on your site has a distinct, non-duplicated title.',
      ],
      suggestedFix: `<title>${optimizedTitle}</title>`,
      suggestedFixLanguage: 'html',
      impactLevel: 'High Impact',
    };
  }

  if (raw.includes('description') || raw.startsWith('descriptions')) {
    let existingDesc = '';
    const match = observed?.match(/["']([^"']{20,})["']/) || snippet?.match(/content=["']([^"']+)["']/i);
    if (match && match[1]) existingDesc = match[1].trim();

    let optimizedDesc = '';
    if (existingDesc && existingDesc.length > 155) {
      const truncated = existingDesc.slice(0, 150);
      const lastDot = truncated.lastIndexOf('.');
      optimizedDesc = lastDot > 80 ? truncated.slice(0, lastDot + 1) : truncated.replace(/[,;:\s]+[^\s]*$/, '') + '...';
    } else {
      switch (context.pageType) {
        case 'cart':
          optimizedDesc = `Review your selected items in the ${brand} shopping cart. Enjoy secure checkout, fast order processing, and reliable customer support.`;
          break;
        case 'checkout':
          optimizedDesc = `Complete your purchase at ${brand}. Encrypted SSL checkout, verified payment options, and instant order confirmation for all customers.`;
          break;
        case 'about':
          optimizedDesc = `Learn about ${brand}: our mission, values, and industry expertise. Discover how our dedicated team delivers trusted results and excellence.`;
          break;
        case 'contact':
          optimizedDesc = `Contact ${brand} today. Reach our support and sales team for assistance, inquiries, and consultations. We are ready to assist you.`;
          break;
        case 'services':
          optimizedDesc = `Explore professional services from ${brand}. High-performance, scalable solutions tailored to help your organization achieve measurable growth.`;
          break;
        case 'pricing':
          optimizedDesc = `View transparent pricing plans from ${brand}. Flexible options, clear deliverables, and no hidden fees. Choose the right plan for your team.`;
          break;
        case 'shop':
          optimizedDesc = `Shop the official ${brand} catalog. Explore high-quality products, competitive pricing, and fast shipping. Order your items online today.`;
          break;
        case 'blog':
          optimizedDesc = `Read the latest news, guides, and industry analysis from ${brand}. Stay informed with expert insights and practical best practices.`;
          break;
        case 'account':
          optimizedDesc = `Access your ${brand} customer account. Manage active orders, review billing history, and update profile preferences securely.`;
          break;
        case 'legal':
          optimizedDesc = `Read the official privacy policy and terms of service for ${brand}. Transparent guidelines on user data protection and service usage.`;
          break;
        case 'home':
        default:
          optimizedDesc = `Welcome to ${brand}: Explore official updates, trusted services, and innovative digital solutions. Built for high performance, reliability, and speed.`;
          break;
      }
    }

    return {
      title: 'Meta Description Length or Missing Tag',
      category: 'On-Page Content',
      whyItMatters:
        'Meta descriptions serve as your organic ad copy in search results. A compelling, 120-155 character description dramatically increases organic click-through rate (CTR), driving more qualified traffic.',
      actionSteps: [
        'Write a concise meta description between 120 and 155 characters.',
        'Include your primary keyword and an active call to action ("Learn more", "Explore", "Start free").',
        'Ensure each page has an individualized description that matches its unique content.',
      ],
      suggestedFix: `<meta name="description" content="${optimizedDesc}" />`,
      suggestedFixLanguage: 'html',
      impactLevel: 'Medium Priority',
    };
  }

  // =========================================================================
  // 7. HEADING STRUCTURE
  // =========================================================================
  if (raw.includes('heading') || raw.startsWith('headings')) {
    const headingText = context.pageType === 'home' ? `${brand} — Official Platform` : `${context.pageLabel} | ${brand}`;
    return {
      title: 'Heading Hierarchy & H1 Architecture',
      category: 'On-Page Content',
      whyItMatters:
        'Search engines and accessibility screen readers navigate page structure using heading hierarchy. A missing H1 or multiple conflicting H1s confuses bots about the true topic of the page.',
      actionSteps: [
        'Ensure exactly one primary `<h1>` tag exists on the page representing the main topic.',
        'Nest subheadings logically (H1 -> H2 -> H3) without skipping heading levels.',
        'Avoid using heading tags solely for visual font styling; use CSS utility classes instead.',
      ],
      suggestedFix: `<h1>${headingText}</h1>\n<section>\n  <h2>Overview</h2>\n  <p>Introductory paragraph describing the page purpose...</p>\n</section>`,
      suggestedFixLanguage: 'html',
      impactLevel: 'Medium Priority',
    };
  }

  // =========================================================================
  // 7.5. DUPLICATE CONTENT CHECKS
  // =========================================================================
  if (
    raw.includes('duplicate_content') ||
    raw.includes('near_duplicate') ||
    raw.includes('duplicate_body') ||
    raw.includes('duplicate content')
  ) {
    const isUtility =
      context.pageType === 'checkout' ||
      context.pageType === 'cart' ||
      context.pageType === 'account' ||
      observed?.toLowerCase().includes('checkout') ||
      observed?.toLowerCase().includes('cart') ||
      snippet?.toLowerCase().includes('checkout') ||
      snippet?.toLowerCase().includes('cart');

    const matchUrl = observed?.match(/https?:\/\/[^\s'")]+/);
    const primaryUrl = matchUrl ? matchUrl[0] : `https://${domain}/`;

    return {
      title: 'Near-Duplicate Body Content Detected',
      category: 'On-Page Content',
      whyItMatters:
        'Search engines penalize pages that share identical or near-identical body text across multiple URLs. Indexing duplicate pages dilutes domain authority, confuses search crawler ranking signals, and wastes crawl budget.',
      actionSteps: isUtility
        ? [
            'Add `<meta name="robots" content="noindex, follow">` to transactional checkout and cart pages.',
            'Allow search crawlers to follow navigation links while excluding duplicate checkout funnels from search indexes.',
            'Update your XML sitemap to exclude non-indexable transactional pages.',
          ]
        : [
            `Add a self-referential or canonical tag pointing to the master authoritative URL: "${primaryUrl}".`,
            'Consolidate thin or duplicate pages using 301 redirects if they serve the same user intent.',
            'Ensure each indexable URL offers unique, substantial textual value.',
          ],
      suggestedFix: isUtility
        ? `<meta name="robots" content="noindex, follow" />`
        : `<link rel="canonical" href="${primaryUrl}" />`,
      suggestedFixLanguage: 'html',
      impactLevel: 'High Impact',
    };
  }

  // =========================================================================
  // 8. CORE TECHNICAL SEO CHECKS (Canonical, Robots, Sitemap, Indexability)
  // =========================================================================
  if (raw.includes('canonical') || raw.startsWith('canonical')) {
    const pageUrl = extractTargetUrl(observed, snippet, domain);
    const resolvedUrl = pageUrl.startsWith('http') ? pageUrl : `https://${domain}${pageUrl}`;
    return {
      title: 'Missing or Inconsistent Canonical URL Tag',
      category: 'Core Technical',
      whyItMatters:
        'A canonical tag explicitly tells search engines which URL represents the authoritative master version of a page. Without one, query parameters (like `?utm_source`), trailing slashes, or HTTP vs HTTPS variations split your ranking authority and risk duplicate content penalties.',
      actionSteps: [
        'Add a `<link rel="canonical" href="...">` tag inside the `<head>` of every indexable page.',
        'Use the absolute, canonical HTTPS URL (including www or non-www consistently).',
        'Ensure the canonical URL points to itself unless the page is an intentional duplicate.',
      ],
      suggestedFix:
        cms === 'Next.js'
          ? `// Next.js App Router: Add to page.tsx or layout.tsx\nexport const metadata: Metadata = {\n  metadataBase: new URL('https://${domain}'),\n  alternates: {\n    canonical: '${resolvedUrl}',\n  },\n};`
          : `<link rel="canonical" href="${resolvedUrl}" />`,
      suggestedFixLanguage: cms === 'Next.js' ? 'typescript' : 'html',
      impactLevel: 'Critical Blocker',
    };
  }

  if (raw.includes('indexability') || raw.startsWith('indexability')) {
    return {
      title: 'Indexability Block Detected (noindex or HTTP Error)',
      category: 'Core Technical',
      whyItMatters:
        'A `noindex` directive or non-200 HTTP status completely blocks search engines from storing and displaying your page in search results. This is often left behind from staging environments or misconfigured server routes.',
      actionSteps: [
        'Inspect your HTML `<head>` for `<meta name="robots" content="noindex">` and remove it.',
        'Check server response headers for `X-Robots-Tag: noindex`.',
        'Verify that your web server returns an HTTP 200 OK status code for all public landing pages.',
      ],
      suggestedFix: `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
      suggestedFixLanguage: 'html',
      impactLevel: 'Critical Blocker',
    };
  }

  if (raw.includes('robots') || raw.startsWith('robots')) {
    return {
      title: 'robots.txt Configuration Defect',
      category: 'Core Technical',
      whyItMatters:
        'Your robots.txt file guides search crawler behavior. Overly restrictive Disallow rules or a missing sitemap reference hinder search engine bots from discovering and crawling your high-value pages.',
      actionSteps: [
        `Verify your robots.txt file exists at \`https://${domain}/robots.txt\`.`,
        `Include a \`Sitemap: https://${domain}/sitemap.xml\` declaration at the bottom.`,
        'Test using RFC 9309 rules to ensure critical paths are accessible.',
      ],
      suggestedFix: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://${domain}/sitemap.xml`,
      suggestedFixLanguage: 'robots',
      impactLevel: 'High Impact',
    };
  }

  if (raw.includes('sitemap') || raw.startsWith('sitemap')) {
    return {
      title: 'Missing or Unreachable XML Sitemap',
      category: 'Core Technical',
      whyItMatters:
        'An XML sitemap provides search engines with an authoritative list of your fresh and canonical URLs. Without one, new pages and updates take substantially longer to get discovered and indexed.',
      actionSteps: [
        'Generate an automated `sitemap.xml` at your site root.',
        'Declare the sitemap location in your `robots.txt` file.',
        'Submit the sitemap directly to Google Search Console for rapid discovery.',
      ],
      suggestedFix: cms === 'Next.js'
        ? `// src/app/sitemap.ts\nimport { MetadataRoute } from 'next';\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [\n    {\n      url: 'https://${domain}',\n      lastModified: new Date(),\n      changeFrequency: 'weekly',\n      priority: 1.0,\n    },\n  ];\n}`
        : `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://${domain}/</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`,
      suggestedFixLanguage: cms === 'Next.js' ? 'typescript' : 'html',
      impactLevel: 'Medium Priority',
    };
  }

  // =========================================================================
  // 9. MOBILE & PERFORMANCE
  // =========================================================================
  if (raw.includes('mobile') || raw.startsWith('mobile')) {
    return {
      title: 'Mobile Viewport & Touch Target Defect',
      category: 'Mobile Usability',
      whyItMatters:
        'Google exclusively uses mobile-first indexing to rank websites. A missing viewport tag, disabled pinch-to-zoom, or tight tap targets degrade touch usability on smartphones and trigger mobile ranking penalties.',
      actionSteps: [
        'Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to your `<head>`.',
        'Do not set `user-scalable=no` or `maximum-scale=1.0` (violates WCAG accessibility guidelines).',
        'Ensure buttons and links have at least 48x48px touch bounding boxes with 8px margins.',
      ],
      suggestedFix: `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
      suggestedFixLanguage: 'html',
      impactLevel: 'High Impact',
    };
  }

  if (raw.includes('performance') || raw.startsWith('performance')) {
    const imgSrc = extractImgSrc(observed, snippet, domain);
    return {
      title: 'Core Web Vitals & Loading Latency Bottleneck',
      category: 'Speed & Vitals',
      whyItMatters:
        'Google uses Core Web Vitals (LCP, CLS, INP) as direct ranking factors. Slow page load times (>2.5s) increase visitor bounce rates by up to 123% and lower search rankings on mobile devices.',
      actionSteps: [
        'Convert heavy PNG/JPEG images into modern WebP or AVIF formats.',
        'Add `width` and `height` attributes to all images to eliminate Cumulative Layout Shift (CLS).',
        'Add `defer` or `async` attributes to non-critical external JavaScript files.',
      ],
      suggestedFix: `<!-- Optimized image loading for LCP/CLS performance -->\n<img src="${imgSrc}" alt="${brand} Visual" width="1200" height="630" loading="eager" fetchpriority="high" />`,
      suggestedFixLanguage: 'html',
      impactLevel: 'High Impact',
    };
  }

  // =========================================================================
  // 10. CLEAN FALLBACK: NEVER REGURGITATE RAW ERROR SNIPPETS AS FIXES
  // =========================================================================
  const humanized = raw.replace(/_/g, ' ').replace(/\./g, ' — ');
  return {
    title: humanized.charAt(0).toUpperCase() + humanized.slice(1),
    category: 'Core Technical',
    whyItMatters:
      'This technical factor deviates from optimal search crawler guidelines. Resolving it ensures search engines and AI agents can index and rank your pages accurately.',
    actionSteps: [
      'Review the observed defect details above against industry crawler standards.',
      `Apply the stack-tailored remedy in your ${cms} template or server configuration.`,
      'Re-run the audit to verify resolution.',
    ],
    // Explicitly undefined: never regurgitate raw error messages, fingerprints, or diagnostic logs as a code fix!
    suggestedFix: undefined,
    suggestedFixLanguage: 'html',
    impactLevel: 'Medium Priority',
  };
}
