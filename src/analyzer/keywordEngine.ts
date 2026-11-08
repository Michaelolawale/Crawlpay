import * as cheerio from 'cheerio';
import { SiteArchetype } from './archetypeDetector';

export interface SiteSummary {
  summary: string;
  targetAudience: string;
  primaryOffering: string;
  businessModel: string;
  detectedBrandName: string;
  confidence: 'High' | 'Moderate' | 'Low (Unclear from page content)';
}

export type OnPagePlacement =
  | 'in_h1'
  | 'in_title'
  | 'in_subheading'
  | 'in_body_only'
  | 'missing_from_page';

export type SearchIntent = 'Commercial' | 'Informational' | 'Transactional' | 'Navigational';

export interface SuggestedKeyword {
  id: string;
  keyword: string;
  angle: 'core_product' | 'buyer_intent' | 'question_answer' | 'comparison' | 'niche_longtail';
  angleLabel: string;
  intent: SearchIntent;
  onPagePlacement: OnPagePlacement;
  relevanceScore: number; // Deterministic 0 - 100 formula
  whyItMatters: string; // Plain-English marketer explanation
  recommendedPlacement: string; // Where to place it (H1, title, meta)
  aeoQuestionMatch?: string; // Conversational prompt for Perplexity/ChatGPT
}

export interface QuestionMatrixItem {
  type: 'how' | 'what' | 'why' | 'can' | 'where' | 'vs' | 'for' | 'with';
  query: string;
  targetContentFormat: 'FAQ Section' | 'Comparison Table' | 'Step-by-Step Guide' | 'Explainer Section' | 'Definition Snippet';
  recommendation: string;
}

export interface QuestionMatrix {
  questions: QuestionMatrixItem[];
  comparisons: QuestionMatrixItem[];
  prepositions: QuestionMatrixItem[];
}

export interface KeywordAlignmentCheck {
  primaryKeyword: string;
  hasTitleMatch: boolean;
  hasH1Match: boolean;
  hasMetaMatch: boolean;
  isFullyAligned: boolean;
  plainDiagnosis: string;
  currentTags: {
    title: string;
    h1: string;
    metaDescription: string;
  };
  recommendedRewrites: {
    title: string;
    h1: string;
    metaDescription: string;
  };
}

export interface KeywordIntelligenceReport {
  siteSummary: SiteSummary;
  primaryKeywordDetected: string;
  suggestedKeywords: SuggestedKeyword[];
  questionMatrix: QuestionMatrix;
  plainLanguageAdvice: string;
  keywordAlignment?: KeywordAlignmentCheck;
}

/**
 * Escapes regex special characters safely
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strict, deterministic relevanceScore formula (0-100):
 * - Title tag match: +35
 * - H1 match: +25
 * - H2/H3 subheadings match: +20
 * - Meta description match: +10
 * - Body text frequency (>= 3 times: +10, 1-2 times: +5)
 * Max = 100
 */
export function calculateRelevanceScore(
  phrase: string,
  title: string,
  h1s: string[],
  subheadings: string[],
  metaDescription: string,
  bodyText: string
): { score: number; placement: OnPagePlacement } {
  const lowerPhrase = phrase.toLowerCase().trim();
  if (!lowerPhrase) {
    return { score: 0, placement: 'missing_from_page' };
  }

  let score = 0;
  let inH1 = false;
  let inTitle = false;
  let inSub = false;
  let inBody = false;

  // 1. Title tag presence: +35
  if (title.toLowerCase().includes(lowerPhrase)) {
    score += 35;
    inTitle = true;
  }

  // 2. <h1> presence: +25
  if (h1s.some((h) => h.toLowerCase().includes(lowerPhrase))) {
    score += 25;
    inH1 = true;
  }

  // 3. <h2>/<h3> subheadings presence: +20
  if (subheadings.some((sh) => sh.toLowerCase().includes(lowerPhrase))) {
    score += 20;
    inSub = true;
  }

  // 4. Meta description presence: +10
  if (metaDescription.toLowerCase().includes(lowerPhrase)) {
    score += 10;
  }

  // 5. Body text frequency: +10 for >= 3 times, +5 for 1-2 times
  try {
    const regex = new RegExp(`\\b${escapeRegExp(lowerPhrase)}\\b`, 'gi');
    const matches = bodyText.match(regex);
    const count = matches ? matches.length : 0;
    if (count >= 3) {
      score += 10;
      inBody = true;
    } else if (count > 0) {
      score += 5;
      inBody = true;
    }
  } catch {
    if (bodyText.toLowerCase().includes(lowerPhrase)) {
      score += 5;
      inBody = true;
    }
  }

  score = Math.min(100, Math.max(0, score));

  let placement: OnPagePlacement = 'missing_from_page';
  if (inH1) placement = 'in_h1';
  else if (inTitle) placement = 'in_title';
  else if (inSub) placement = 'in_subheading';
  else if (inBody) placement = 'in_body_only';

  return { score, placement };
}

/**
 * Common English stop words to ignore during n-gram frequency extraction
 */
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'will', 'get', 'use', 'using', 'also', 'one', 'new', 'like', 'free', 'online',
  'click', 'learn', 'terms', 'privacy', 'cookie', 'cookies', 'rights', 'reserved', 'copyright'
]);

/**
 * Extracts clean brand name from title, meta tags, or domain
 */
function extractBrandName(title: string, ogSiteName?: string, domain?: string): string {
  if (ogSiteName && ogSiteName.trim().length > 1) {
    return ogSiteName.trim();
  }
  if (title) {
    // Check common splitters: Title | Brand or Brand — Title
    const parts = title.split(/[|—–•-]/).map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length > 1) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      const firstWords = first.split(' ').length;
      const lastWords = last.split(' ').length;

      // In "Brand | Tagline", Brand is first and has fewer words
      if (firstWords <= 2 && lastWords > firstWords) return first;
      // In "Tagline | Brand", Brand is last and has fewer words
      if (lastWords <= 2 && firstWords > lastWords) return last;
      if (firstWords <= 3 && first.length < 25) return first;
      if (lastWords <= 3 && last.length < 25) return last;
    }
  }
  if (domain) {
    const clean = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return 'This Website';
}

/**
 * Extracts 2-word and 3-word n-grams from text, sorted by frequency
 */
function extractTopNgrams(text: string, topN: number = 10): string[] {
  const cleanWords = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const freq: Record<string, number> = {};

  // Bigrams
  for (let i = 0; i < cleanWords.length - 1; i++) {
    const w1 = cleanWords[i];
    const w2 = cleanWords[i + 1];
    if (!STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
      const phrase = `${w1} ${w2}`;
      freq[phrase] = (freq[phrase] || 0) + 1;
    }
  }

  // Trigrams
  for (let i = 0; i < cleanWords.length - 2; i++) {
    const w1 = cleanWords[i];
    const w2 = cleanWords[i + 1];
    const w3 = cleanWords[i + 2];
    if (!STOP_WORDS.has(w1) && !STOP_WORDS.has(w3)) {
      const phrase = `${w1} ${w2} ${w3}`;
      freq[phrase] = (freq[phrase] || 0) + 1.2; // slight boost for specificity
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([phrase]) => phrase);
}

/**
 * Scans page DOM specifically for real competitor names explicitly mentioned on-page
 */
function detectCompetitorNamesFromPage($: cheerio.CheerioAPI, bodyText: string, brandName: string): string[] {
  const competitors: string[] = [];
  const lowerBrand = brandName.toLowerCase();

  // 1. Look for comparison headings or badges: e.g. "vs Webflow", "Alternative to WordPress", "Migrate from X"
  const comparisonPatterns = [
    /(?:alternative to|alternatives to|switch from|migrate from|vs\.?|versus)\s+([A-Za-z0-9-]+)/gi,
    /(?:compared to)\s+([A-Za-z0-9-]+)/gi,
  ];

  for (const pattern of comparisonPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(bodyText)) !== null) {
      const candidate = match[1].trim().split(/[.,;:!?\n\s]/)[0].trim();
      if (
        candidate.length > 2 &&
        candidate.toLowerCase() !== lowerBrand &&
        !STOP_WORDS.has(candidate.toLowerCase()) &&
        !competitors.includes(candidate)
      ) {
        competitors.push(candidate);
      }
    }
  }

  // 2. Check table headers or comparison lists if any
  $('table th, table td').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 2 && text.length < 20 && text.toLowerCase() !== lowerBrand) {
      if (/(?:competitor|rival|legacy|others)/i.test(text)) {
        // generic marker, ignore
      }
    }
  });

  return competitors;
}

/**
 * Formulates the heuristic Site Summary (Detected from Page Content)
 */
export function generateSiteSummary(
  $: cheerio.CheerioAPI,
  title: string,
  metaDescription: string,
  h1: string,
  archetype: SiteArchetype,
  normalizedUrl: string
): SiteSummary {
  const ogSiteName = $('meta[property="og:site_name" i]').attr('content');
  const domain = new URL(normalizedUrl.startsWith('http') ? normalizedUrl : `https://${normalizedUrl}`).hostname;
  const brandName = extractBrandName(title, ogSiteName, domain);

  let targetAudience = 'General web visitors and potential customers';
  let businessModel = 'Online Service';
  let primaryOffering = metaDescription || h1 || 'Digital products, content, or services';

  if (archetype === 'saas') {
    businessModel = 'B2B Software / SaaS Platform';
    targetAudience = 'Teams, developers, and business professionals seeking productivity tools';
  } else if (archetype === 'ecommerce') {
    businessModel = 'E-Commerce Store';
    targetAudience = 'Online shoppers and retail consumers';
  } else if (archetype === 'web3') {
    businessModel = 'Web3 Protocol / Decentralized Application (dApp)';
    targetAudience = 'Crypto users, web3 builders, and DeFi participants';
  } else if (archetype === 'publisher') {
    businessModel = 'Content Publisher / Online Media';
    targetAudience = 'Readers, researchers, and topic enthusiasts';
  } else if (archetype === 'local_business') {
    businessModel = 'Local Business / Service Provider';
    targetAudience = 'Local residents and clients in the provider’s service area';
  } else if ((archetype as string) === 'portfolio') {
    businessModel = 'Professional Portfolio / Consultant';
    targetAudience = 'Hiring managers, founders, and prospective clients';
  } else {
    businessModel = 'Online Platform / Website';
    targetAudience = 'General visitors and prospective users';
  }

  // Formulate concise plain-English summary sentence
  let summary = '';
  let confidence: 'High' | 'Moderate' | 'Low (Unclear from page content)' = 'High';

  const hasGoodTitle = title && title.length >= 10;
  const hasGoodH1 = h1 && h1.length >= 8;
  const hasGoodMeta = metaDescription && metaDescription.length >= 20;

  if (hasGoodTitle && hasGoodH1 && hasGoodMeta) {
    confidence = 'High';
    summary = `${brandName} operates as a ${businessModel} for ${targetAudience.toLowerCase()}. Its primary offering is: "${metaDescription.slice(0, 160).trim()}".`;
  } else if (hasGoodH1 || hasGoodMeta) {
    confidence = 'Moderate';
    const core = metaDescription || h1 || title;
    summary = `${brandName} appears to be a ${businessModel} offering ${core.slice(0, 140).trim()}.`;
  } else {
    confidence = 'Low (Unclear from page content)';
    summary = `The purpose of ${brandName} could not be determined with high confidence from on-page tags alone. Adding a descriptive title, meta description, and <h1> heading will help both visitors and search engines understand your exact offer.`;
  }

  return {
    summary,
    targetAudience,
    primaryOffering: primaryOffering.slice(0, 180),
    businessModel,
    detectedBrandName: brandName,
    confidence,
  };
}

/**
 * Generates Keyword Research with:
 * - Up to 5 distinct suggested keywords (Core, Buyer Intent, Question/How-To, Comparison if real competitor on page, Niche Long-Tail)
 * - Deterministic relevanceScore formula (0-100)
 * - No fake metrics
 * - AnswerThePublic-style Question Matrix
 */
export async function generateKeywordIntelligence(
  $: cheerio.CheerioAPI,
  normalizedUrl: string,
  title: string,
  metaDescription: string,
  h1s: string[],
  h2s: string[],
  h3s: string[],
  archetype: SiteArchetype
): Promise<KeywordIntelligenceReport> {
  const currentH1 = h1s[0] || '';
  const subheadings = [...h2s, ...h3s];
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

  // 1. Generate Site Summary
  const siteSummary = generateSiteSummary($, title, metaDescription, currentH1, archetype, normalizedUrl);
  const brandName = siteSummary.detectedBrandName;

  // 2. Extract Top N-Grams
  const topNgrams = extractTopNgrams(`${title} ${metaDescription} ${currentH1} ${subheadings.slice(0, 8).join(' ')} ${bodyText.slice(0, 2000)}`);

  // Detect Core Subject / Seed Keyword
  let coreKeyword = topNgrams[0] || 'online platform';
  if (coreKeyword.split(' ').length === 1 && topNgrams[1]) {
    coreKeyword = topNgrams[1];
  }

  // 3. Scan for real competitor names explicitly on page
  const detectedCompetitors = detectCompetitorNamesFromPage($, bodyText, brandName);

  // 4. Formulate the 5 Distinct Keyword Angles
  const suggestedKeywords: SuggestedKeyword[] = [];

  // Angle 1: Core Subject / Product
  const coreScore = calculateRelevanceScore(coreKeyword, title, h1s, subheadings, metaDescription, bodyText);
  suggestedKeywords.push({
    id: 'kw_core',
    keyword: coreKeyword,
    angle: 'core_product',
    angleLabel: 'What You Sell (Core Keyword)',
    intent: 'Commercial',
    onPagePlacement: coreScore.placement,
    relevanceScore: coreScore.score,
    whyItMatters: `This phrase is the focal topic detected across your headlines and body text. Search engines use it to classify what your business does.`,
    recommendedPlacement: `Ensure this appears near the start of your <title> and in your primary <h1> heading.`,
    aeoQuestionMatch: `What is the best ${coreKeyword}?`,
  });

  // Angle 2: Buyer / Action Intent
  let buyerKeyword = '';
  if (archetype === 'saas') {
    buyerKeyword = `${coreKeyword} software`;
  } else if (archetype === 'ecommerce') {
    buyerKeyword = `buy ${coreKeyword}`;
  } else if (archetype === 'web3') {
    buyerKeyword = `${coreKeyword} app`;
  } else if (archetype === 'local_business') {
    buyerKeyword = `${coreKeyword} services`;
  } else {
    buyerKeyword = `best ${coreKeyword} platform`;
  }

  const buyerScore = calculateRelevanceScore(buyerKeyword, title, h1s, subheadings, metaDescription, bodyText);
  suggestedKeywords.push({
    id: 'kw_buyer',
    keyword: buyerKeyword,
    angle: 'buyer_intent',
    angleLabel: 'Ready-to-Buy Search',
    intent: 'Transactional',
    onPagePlacement: buyerScore.placement,
    relevanceScore: buyerScore.score,
    whyItMatters: `Captures searchers actively looking to adopt, buy, or subscribe rather than casual browsers.`,
    recommendedPlacement: `Feature in calls-to-action (CTAs), pricing tables, and product benefit headers.`,
    aeoQuestionMatch: `Where can I get ${buyerKeyword}?`,
  });

  // Angle 3: Question / How-To (AnswerThePublic Informational Angle)
  const questionKeyword = `how does ${coreKeyword} work`;
  const questionScore = calculateRelevanceScore(questionKeyword, title, h1s, subheadings, metaDescription, bodyText);
  suggestedKeywords.push({
    id: 'kw_question',
    keyword: questionKeyword,
    angle: 'question_answer',
    angleLabel: 'How-To & Guides',
    intent: 'Informational',
    onPagePlacement: questionScore.placement,
    relevanceScore: questionScore.score,
    whyItMatters: `Informational queries are prioritized by Google AI Overviews and Perplexity to generate direct answer citations.`,
    recommendedPlacement: `Use as an <h2> subheading in your FAQ or 'How it Works' section paired with a direct 2-3 sentence answer.`,
    aeoQuestionMatch: `How does ${coreKeyword} work and what are the benefits?`,
  });

  // Angle 4: Comparison / Alternative (ONLY if real competitor detected on-page; never fabricate!)
  if (detectedCompetitors.length > 0) {
    const compName = detectedCompetitors[0];
    const comparisonKeyword = `${brandName} vs ${compName}`;
    const compScore = calculateRelevanceScore(comparisonKeyword, title, h1s, subheadings, metaDescription, bodyText);
    suggestedKeywords.push({
      id: 'kw_comparison',
      keyword: comparisonKeyword,
      angle: 'comparison',
      angleLabel: 'Competitor Alternative',
      intent: 'Commercial',
      onPagePlacement: compScore.placement,
      relevanceScore: compScore.score,
      whyItMatters: `High-conversion search term used by prospects evaluating your offering directly against ${compName}.`,
      recommendedPlacement: `Create a dedicated comparison landing page or table detailing key differences and advantages.`,
      aeoQuestionMatch: `What is the difference between ${brandName} and ${compName}?`,
    });
  }

  // Angle 5: Niche Long-Tail Opportunity
  let nicheKeyword = '';
  for (const ng of topNgrams.slice(1)) {
    if (ng !== coreKeyword && ng.length > 8 && !ng.includes(brandName.toLowerCase())) {
      nicheKeyword = ng;
      break;
    }
  }
  if (!nicheKeyword && subheadings.length > 0) {
    nicheKeyword = subheadings[0].slice(0, 35).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  }
  if (!nicheKeyword) {
    nicheKeyword = `${coreKeyword} solutions`;
  }

  const nicheScore = calculateRelevanceScore(nicheKeyword, title, h1s, subheadings, metaDescription, bodyText);
  suggestedKeywords.push({
    id: 'kw_niche',
    keyword: nicheKeyword,
    angle: 'niche_longtail',
    angleLabel: 'Low Competition Search',
    intent: 'Informational',
    onPagePlacement: nicheScore.placement,
    relevanceScore: nicheScore.score,
    whyItMatters: `Targeting specific multi-word phrases allows you to rank faster and attract visitors with exact intent.`,
    recommendedPlacement: `Include in descriptive subheadings and explanatory paragraph copy.`,
    aeoQuestionMatch: `What are the best approaches for ${nicheKeyword}?`,
  });

  // 5. Build AnswerThePublic-Style Question & Query Matrix
  const questionMatrix: QuestionMatrix = {
    questions: [
      {
        type: 'what',
        query: `What is ${coreKeyword}?`,
        targetContentFormat: 'Definition Snippet',
        recommendation: `Provide a concise 1-2 sentence definition directly under your first <h2> to capture Google AI summary snippets.`,
      },
      {
        type: 'how',
        query: `How to get started with ${coreKeyword}?`,
        targetContentFormat: 'Step-by-Step Guide',
        recommendation: `Add a numbered 3-step onboarding guide on your page with clear action verbs.`,
      },
      {
        type: 'why',
        query: `Why choose ${brandName} for ${coreKeyword}?`,
        targetContentFormat: 'FAQ Section',
        recommendation: `Highlight your 3 strongest unique selling points in an expandable FAQ accordion.`,
      },
      {
        type: 'can',
        query: `Can I use ${coreKeyword} for my business?`,
        targetContentFormat: 'FAQ Section',
        recommendation: `Address qualification and compatibility questions directly so prospects self-identify.`,
      },
    ],
    comparisons: detectedCompetitors.length > 0
      ? [
          {
            type: 'vs',
            query: `${brandName} vs ${detectedCompetitors[0]}`,
            targetContentFormat: 'Comparison Table',
            recommendation: `Publish a side-by-side feature and pricing comparison table.`,
          },
        ]
      : [
          {
            type: 'vs',
            query: `${coreKeyword} vs traditional alternatives`,
            targetContentFormat: 'Comparison Table',
            recommendation: `Compare modern automated workflows against manual or legacy methods.`,
          },
        ],
    prepositions: [
      {
        type: 'for',
        query: `${coreKeyword} for ${siteSummary.targetAudience.split(' ')[0].toLowerCase()}`,
        targetContentFormat: 'Explainer Section',
        recommendation: `Create dedicated sections speaking directly to your core audience's unique challenges.`,
      },
      {
        type: 'with',
        query: `${coreKeyword} with instant setup`,
        targetContentFormat: 'Explainer Section',
        recommendation: `Emphasize time-to-value and low barrier to entry in your hero copy.`,
      },
    ],
  };

  // 6. Build Keyword Alignment Diagnosis & 1-Click Tag Rewrites
  const lowerCore = coreKeyword.toLowerCase();
  const currentTitle = title || '';
  const currentMeta = metaDescription || '';

  const hasTitleMatch = currentTitle.toLowerCase().includes(lowerCore);
  const hasH1Match = h1s.some((h) => h.toLowerCase().includes(lowerCore));
  const hasMetaMatch = currentMeta.toLowerCase().includes(lowerCore);
  const isFullyAligned = hasTitleMatch && hasH1Match && hasMetaMatch;

  let plainDiagnosis = '';
  if (isFullyAligned) {
    plainDiagnosis = `Optimal Alignment: Your page title, main headline, and meta description all target your primary topic ("${coreKeyword}").`;
  } else if (!hasTitleMatch && !hasH1Match) {
    plainDiagnosis = `Targeting Mismatch: Neither your page <title> nor your main <h1> headline contains your core search term ("${coreKeyword}"). Search engines are forced to guess your page topic.`;
  } else if (hasTitleMatch && !hasH1Match) {
    plainDiagnosis = `Headline Mismatch: Your page title targets "${coreKeyword}", but your main headline (${currentH1 ? `"${currentH1}"` : 'missing'}) uses different words. Aligning both gives search engines a unified ranking signal.`;
  } else if (!hasTitleMatch && hasH1Match) {
    plainDiagnosis = `Title Mismatch: Your main headline targets "${coreKeyword}", but your page <title> does not include it. Google uses the title tag as the clickable headline in search results.`;
  } else {
    plainDiagnosis = `Description Gap: Your headline targets "${coreKeyword}", but your meta description is missing this phrase. Adding it improves your organic click-through rate.`;
  }

  const audienceLabel = siteSummary.targetAudience.split(' ')[0] || 'Modern Teams';
  const recommendedTitle = `${coreKeyword.charAt(0).toUpperCase() + coreKeyword.slice(1)} — ${brandName} | Built for ${audienceLabel}`.slice(0, 60);
  const recommendedH1 = `${coreKeyword.charAt(0).toUpperCase() + coreKeyword.slice(1)} for ${audienceLabel}`;
  const recommendedMeta = `Looking for ${coreKeyword}? ${brandName} provides ${siteSummary.primaryOffering.slice(0, 80).trim().replace(/\.$/, '')}. Explore features, view solutions, and get started today!`.slice(0, 155);

  const keywordAlignment: KeywordAlignmentCheck = {
    primaryKeyword: coreKeyword,
    hasTitleMatch,
    hasH1Match,
    hasMetaMatch,
    isFullyAligned,
    plainDiagnosis,
    currentTags: {
      title: currentTitle || 'Missing <title> tag',
      h1: currentH1 || 'Missing <h1> headline',
      metaDescription: currentMeta || 'Missing meta description',
    },
    recommendedRewrites: {
      title: recommendedTitle,
      h1: recommendedH1,
      metaDescription: recommendedMeta,
    },
  };

  const plainLanguageAdvice = `Focus on aligning your main headline and meta description around "${coreKeyword}". Adding direct answers to customer questions like "${questionMatrix.questions[0].query}" will improve your visibility in both Google and AI search engines like Perplexity.`;

  return {
    siteSummary,
    primaryKeywordDetected: coreKeyword,
    suggestedKeywords,
    questionMatrix,
    plainLanguageAdvice,
    keywordAlignment,
  };
}

