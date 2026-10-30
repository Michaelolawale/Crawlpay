import * as cheerio from 'cheerio';
import { Finding, PageCrawlData, SiteMetadata } from '../types';

export interface AeoAnalysisSignals {
  questionHeadingsCount: number;
  questionHeadings: string[];
  hasFaqSchema: boolean;
  hasStructuredListsOrTables: boolean;
  directAnswerSignal: 'Present' | 'Partial' | 'Absent'; // Clearly labeled as a heuristic signal
}

export interface AeoCheckResult {
  findings: Finding[];
  signals: AeoAnalysisSignals;
}

const QUESTION_STARTERS = [
  'what',
  'how',
  'why',
  'when',
  'where',
  'who',
  'which',
  'can',
  'does',
  'is',
  'should',
  'could',
  'would',
  'do',
  'are',
  'will',
];

function isQuestionHeading(text: string): boolean {
  const clean = text.trim().toLowerCase();
  if (clean.endsWith('?')) return true;
  const firstWord = clean.split(/\s+/)[0]?.replace(/[^a-z]/g, '');
  return Boolean(firstWord && QUESTION_STARTERS.includes(firstWord));
}

/**
 * Discrete AEO Check Suite
 * 1. aeo.question_headings: True interrogative subheadings for query mapping
 * 2. aeo.faq_schema: Machine-readable FAQPage / QAPage JSON-LD
 * 3. aeo.structured_answers: HTML lists/tables for procedural and comparative queries
 */
export function checkAEO(pages: PageCrawlData[], metadata: SiteMetadata): AeoCheckResult {
  const findings: Finding[] = [];
  const rootPage = pages[0];

  let totalQuestionHeadings = 0;
  const detectedQuestionHeadings: string[] = [];
  let siteHasFaqSchema = false;
  let siteHasStructuredListsOrTables = false;

  for (const page of pages) {
    const subheadings = [...(page.h1ToH6?.h2s || []), ...(page.h1ToH6?.h3s || [])];
    const pageQuestionHeadings = subheadings.filter(isQuestionHeading);
    totalQuestionHeadings += pageQuestionHeadings.length;
    detectedQuestionHeadings.push(...pageQuestionHeadings);

    // 1. aeo.question_headings check
    if (page.depth <= 1 && pageQuestionHeadings.length === 0 && subheadings.length > 0) {
      findings.push({
        id: `aeo.question_headings.${page.url}`,
        checkId: 'aeo.question_headings',
        severity: 'medium',
        url: page.url,
        rootCauseKey: 'aeo.question_headings',
        evidence: {
          observed: `0 question-phrased headings found among ${subheadings.length} subheadings (H2/H3).`,
          expected: 'At least 1-2 subheadings formulated as explicit questions (What, How, Why, Can...) to align with answer engine queries.',
          snippet: subheadings.slice(0, 3).join(' | '),
        },
      });
    }

    // 2. aeo.faq_schema check
    const hasFaq = (page.jsonLd || []).some((item: any) => {
      const type = item?.['@type'] || item?.type;
      if (Array.isArray(type)) {
        return type.some((t) => t === 'FAQPage' || t === 'QAPage');
      }
      return type === 'FAQPage' || type === 'QAPage';
    });

    if (hasFaq) {
      siteHasFaqSchema = true;
    }

    // 3. aeo.structured_answers check
    const $ = cheerio.load(page.html || '');
    const listCount = $('ol, ul').length;
    const tableCount = $('table').length;
    if (listCount > 0 || tableCount > 0) {
      siteHasStructuredListsOrTables = true;
    }

    // Check procedural intent without structured formats
    const hasProceduralHeading = subheadings.some((h) => {
      const lower = h.toLowerCase();
      return (
        lower.startsWith('how to') ||
        lower.includes('steps to') ||
        lower.includes('comparison') ||
        lower.includes('vs ') ||
        lower.includes('pricing')
      );
    });

    if (hasProceduralHeading && listCount === 0 && tableCount === 0) {
      findings.push({
        id: `aeo.structured_answers.${page.url}`,
        checkId: 'aeo.structured_answers',
        severity: 'low',
        url: page.url,
        rootCauseKey: 'aeo.structured_answers',
        evidence: {
          observed: 'Procedural or comparative headings detected without supporting HTML lists (<ol>, <ul>) or tables (<table>).',
          expected: 'Structure procedural step-by-step instructions or comparison data with explicit HTML lists or tables for deterministic answer extraction.',
        },
      });
    }
  }

  // Root site FAQ schema finding if completely absent across crawl
  if (!siteHasFaqSchema && rootPage) {
    findings.push({
      id: `aeo.faq_schema.${rootPage.url}`,
      checkId: 'aeo.faq_schema',
      severity: 'low',
      url: rootPage.url,
      rootCauseKey: 'aeo.faq_schema',
      evidence: {
        observed: 'No FAQPage or QAPage JSON-LD schema detected across audited pages.',
        expected: 'Provide machine-readable FAQPage JSON-LD schema matching visible on-page Q&A to facilitate direct answer extraction by AI search engines.',
      },
    });
  }

  // Determine heuristic signal
  let directAnswerSignal: 'Present' | 'Partial' | 'Absent' = 'Absent';
  if (totalQuestionHeadings >= 2 && siteHasStructuredListsOrTables) {
    directAnswerSignal = 'Present';
  } else if (totalQuestionHeadings >= 1 || siteHasStructuredListsOrTables) {
    directAnswerSignal = 'Partial';
  }

  return {
    findings,
    signals: {
      questionHeadingsCount: totalQuestionHeadings,
      questionHeadings: detectedQuestionHeadings.slice(0, 10),
      hasFaqSchema: siteHasFaqSchema,
      hasStructuredListsOrTables: siteHasStructuredListsOrTables,
      directAnswerSignal,
    },
  };
}

