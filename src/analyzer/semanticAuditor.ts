import * as cheerio from 'cheerio';
import { SiteArchetype } from './archetypeDetector';

export interface SemanticAnalysis {
  h1Quality: 'strong' | 'acceptable' | 'vague_jargon' | 'missing';
  currentH1: string;
  recommendedH1: string;
  primaryKeywordDetected: string;
  searchIntent: 'Commercial / Transactional' | 'Informational' | 'Navigational';
  contentDepthWordCount: number;
  jargonDetected: string[];
  editorialVerdict: string;
}

const VAGUE_JARGON_TERMS = [
  'the future of',
  'revolutionizing',
  'next-gen',
  'next generation',
  'all-in-one platform',
  'seamless experience',
  'welcome to',
  'empowering',
  'transforming how',
  'innovative solution',
  'supercharge your',
  'world-class',
];

export function auditSemantics(
  $: cheerio.CheerioAPI,
  archetype: SiteArchetype,
  h1s: string[],
  pageTitle: string
): SemanticAnalysis {
  const currentH1 = h1s.length > 0 ? h1s[0] : '';
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter(w => w.length > 0).length;

  // Extract frequent meaningful keywords (ignoring stop words)
  const stopWords = new Set([
    'the','and','a','to','of','in','i','is','that','it','on','you','this','for','but','with','are','have','be','at','or','as','was','so','if','out','not','can','all','we','your','our','from'
  ]);
  const words = bodyText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ');
  const wordFreq: Record<string, number> = {};
  for (const w of words) {
    if (w.length > 3 && !stopWords.has(w)) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  }

  const sortedKeywords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]);
  const topKeyword = sortedKeywords.length > 0 ? sortedKeywords[0][0] : 'platform';
  const secondaryKeyword = sortedKeywords.length > 1 ? sortedKeywords[1][0] : 'service';

  // Check for vague jargon in H1
  const lowerH1 = currentH1.toLowerCase();
  const jargonFound: string[] = [];
  for (const term of VAGUE_JARGON_TERMS) {
    if (lowerH1.includes(term)) {
      jargonFound.push(term);
    }
  }

  let h1Quality: 'strong' | 'acceptable' | 'vague_jargon' | 'missing' = 'acceptable';
  let recommendedH1 = currentH1;
  let editorialVerdict = '';

  if (!currentH1) {
    h1Quality = 'missing';
    recommendedH1 = `${capitalize(topKeyword)} ${capitalize(secondaryKeyword)} for Fast Results`;
    editorialVerdict = 'No <h1> heading detected. Search engines cannot infer the primary focal topic of this page.';
  } else if (jargonFound.length > 0 || currentH1.length < 15) {
    h1Quality = 'vague_jargon';
    const keywordCapitalized = `${capitalize(topKeyword)} ${capitalize(secondaryKeyword)}`;
    if (archetype === 'saas') {
      recommendedH1 = `Automated ${keywordCapitalized} — Built for High-Growth Teams`;
    } else if (archetype === 'ecommerce') {
      recommendedH1 = `Premium ${keywordCapitalized} — Fast Delivery & Best Quality`;
    } else if (archetype === 'web3') {
      recommendedH1 = `Decentralized ${keywordCapitalized} on Celo — Sub-Cent Fees`;
    } else {
      recommendedH1 = `Professional ${keywordCapitalized} — Designed for Modern Businesses`;
    }
    editorialVerdict = `Current H1 contains generic marketing phrasing ("${jargonFound.join('", "')}"). Google prioritizes headings that explicitly answer exact user search queries.`;
  } else {
    h1Quality = 'strong';
    editorialVerdict = 'Your H1 uses clear, descriptive vocabulary matching the topical body content of your page.';
  }

  // Determine search intent based on archetype
  let searchIntent: 'Commercial / Transactional' | 'Informational' | 'Navigational' = 'Informational';
  if (archetype === 'ecommerce' || archetype === 'saas') {
    searchIntent = 'Commercial / Transactional';
  } else if (archetype === 'publisher') {
    searchIntent = 'Informational';
  } else {
    searchIntent = 'Commercial / Transactional';
  }

  return {
    h1Quality,
    currentH1,
    recommendedH1,
    primaryKeywordDetected: `${topKeyword} ${secondaryKeyword}`,
    searchIntent,
    contentDepthWordCount: wordCount,
    jargonDetected: jargonFound,
    editorialVerdict,
  };
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
