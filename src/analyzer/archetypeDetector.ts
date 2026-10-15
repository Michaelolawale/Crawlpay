import * as cheerio from 'cheerio';

export type SiteArchetype = 'ecommerce' | 'saas' | 'local_business' | 'publisher' | 'web3' | 'general';

export interface ArchetypeProfile {
  type: SiteArchetype;
  label: string;
  confidence: number;
  detectedSignals: string[];
  primarySchemaNeeded: string;
  keyAuditFocus: string;
}

export function detectSiteArchetype($: cheerio.CheerioAPI, html: string, url: string): ArchetypeProfile {
  const text = $('body').text().toLowerCase();
  const lowerHtml = html.toLowerCase();
  const detectedSignals: string[] = [];

  // 1. Web3 / DApp Detection
  let web3Score = 0;
  if (lowerHtml.includes('walletconnect') || lowerHtml.includes('wagmi') || lowerHtml.includes('web3modal')) {
    web3Score += 3;
    detectedSignals.push('Web3 wallet connector library');
  }
  if (text.includes('connect wallet') || text.includes('metamask') || text.includes('smart contract') || text.includes('celo') || text.includes('mint')) {
    web3Score += 2;
    detectedSignals.push('Web3 keywords (Connect Wallet, Mint, Contract)');
  }

  // 2. E-Commerce Detection
  let ecommerceScore = 0;
  if (lowerHtml.includes('shopify') || lowerHtml.includes('woocommerce') || lowerHtml.includes('bigcommerce')) {
    ecommerceScore += 4;
    detectedSignals.push('E-commerce platform signatures (Shopify/WooCommerce)');
  }
  if (text.includes('add to cart') || text.includes('checkout') || text.includes('shopping cart') || $('[class*="cart"]').length > 0) {
    ecommerceScore += 3;
    detectedSignals.push('Cart & Checkout buttons/elements');
  }
  if ($('[class*="price"]').length > 0 || text.includes('free shipping') || text.includes('return policy')) {
    ecommerceScore += 2;
    detectedSignals.push('Retail pricing & shipping cues');
  }

  // 3. SaaS / B2B Software Detection
  let saasScore = 0;
  if (text.includes('pricing') && (text.includes('monthly') || text.includes('annually') || text.includes('per user'))) {
    saasScore += 3;
    detectedSignals.push('SaaS subscription pricing tiers');
  }
  if (text.includes('start free trial') || text.includes('request demo') || text.includes('sign up free') || text.includes('api documentation')) {
    saasScore += 3;
    detectedSignals.push('SaaS call-to-actions (Free trial, Demo, API)');
  }
  if (lowerHtml.includes('intercom') || lowerHtml.includes('crisp') || lowerHtml.includes('hubspot') || lowerHtml.includes('stripe.com')) {
    saasScore += 2;
    detectedSignals.push('SaaS billing or support SDKs');
  }

  // 4. Local Business / Service
  let localScore = 0;
  if ($('a[href^="tel:"]').length > 0) {
    localScore += 3;
    detectedSignals.push('Click-to-call phone links');
  }
  if (lowerHtml.includes('maps.google') || text.includes('opening hours') || text.includes('mon - fri') || text.includes('location:')) {
    localScore += 3;
    detectedSignals.push('Physical location & operating hours');
  }

  // 5. Publisher / Blog
  let publisherScore = 0;
  if ($('article').length > 0 || $('[class*="author"]').length > 0 || lowerHtml.includes('substack') || lowerHtml.includes('medium.com')) {
    publisherScore += 3;
    detectedSignals.push('Article layout & author bylines');
  }
  if (text.includes('min read') || text.includes('published on') || $('meta[property="article:published_time"]').length > 0) {
    publisherScore += 3;
    detectedSignals.push('Publication dates & read-time metrics');
  }

  // Pick winner
  const scores = [
    { type: 'web3' as SiteArchetype, label: 'Web3 / DApp', score: web3Score, schema: 'SoftwareApplication / Web3Application', focus: 'Mobile wallet browser compatibility, contract trust disclosures & documentation indexing' },
    { type: 'ecommerce' as SiteArchetype, label: 'E-Commerce Store', score: ecommerceScore, schema: 'Product & Offer with Rating', focus: 'Product rich snippets, Google Merchant feed readiness & high-res image compression' },
    { type: 'saas' as SiteArchetype, label: 'B2B / SaaS Product', score: saasScore, schema: 'SoftwareApplication', focus: 'Value proposition clarity, pricing schema & search keyword positioning' },
    { type: 'local_business' as SiteArchetype, label: 'Local Business / Service', score: localScore, schema: 'LocalBusiness', focus: 'Google Maps NAP consistency, mobile click-to-call & local geo-targeting' },
    { type: 'publisher' as SiteArchetype, label: 'Blog / Content Publisher', score: publisherScore, schema: 'Article / BlogPosting', focus: 'Google E-E-A-T author credibility, reading flow & internal cross-linking' },
  ];

  scores.sort((a, b) => b.score - a.score);

  if (scores[0].score >= 2) {
    return {
      type: scores[0].type,
      label: scores[0].label,
      confidence: Math.min(95, 50 + scores[0].score * 12),
      detectedSignals,
      primarySchemaNeeded: scores[0].schema,
      keyAuditFocus: scores[0].focus,
    };
  }

  return {
    type: 'general',
    label: 'Corporate / Brand Website',
    confidence: 70,
    detectedSignals: ['Standard corporate presentation layout'],
    primarySchemaNeeded: 'Organization / WebSite',
    keyAuditFocus: 'Foundational technical health, metadata completeness & Core Web Vitals',
  };
}
