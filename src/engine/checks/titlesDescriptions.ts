import { Finding, PageCrawlData } from '../types';
import { generateStableFindingId, sanitizeSnippet } from '../utils/simhash';

export function checkTitlesAndDescriptions(pages: PageCrawlData[]): Finding[] {
  const findings: Finding[] = [];

  const titleGroups = new Map<string, PageCrawlData[]>();
  const descGroups = new Map<string, PageCrawlData[]>();

  for (const page of pages) {
    const title = page.title.trim();
    const desc = page.metaDescription.trim();

    // 1. Missing Title
    if (!title) {
      findings.push({
        id: generateStableFindingId('titles.missing', page.url, 'empty'),
        checkId: 'titles.missing',
        severity: 'high',
        url: page.url,
        evidence: {
          observed: 'Page has no <title> tag or the title is empty.',
          expected: 'Unique, descriptive page title between 30 and 60 characters.',
          snippet: '<title></title> or missing entirely in <head>',
        },
        rootCauseKey: 'titles.missing',
      });
    } else {
      // Title Length outside 30-60 chars
      if (title.length < 30) {
        findings.push({
          id: generateStableFindingId('titles.too_short', page.url, title),
          checkId: 'titles.too_short',
          severity: 'low',
          url: page.url,
          evidence: {
            observed: `Title is too short (${title.length} characters): "${title}".`,
            expected: 'Titles should be 30–60 characters to optimize SERP visibility and click-through rates.',
            snippet: `<title>${sanitizeSnippet(title, 120)}</title>`,
          },
          rootCauseKey: 'titles.too_short',
        });
      } else if (title.length > 60) {
        findings.push({
          id: generateStableFindingId('titles.too_long', page.url, title),
          checkId: 'titles.too_long',
          severity: 'low',
          url: page.url,
          evidence: {
            observed: `Title is too long (${title.length} characters) and will truncate in Google search: "${title}".`,
            expected: 'Keep page titles within 30–60 characters (under ~600px pixel width).',
            snippet: `<title>${sanitizeSnippet(title, 120)}</title>`,
          },
          rootCauseKey: 'titles.too_long',
        });
      }

      // Grouping duplicate titles
      const normTitle = title.toLowerCase();
      const existing = titleGroups.get(normTitle) || [];
      existing.push(page);
      titleGroups.set(normTitle, existing);
    }

    // 2. Missing Description
    if (!desc) {
      findings.push({
        id: generateStableFindingId('descriptions.missing', page.url, 'empty'),
        checkId: 'descriptions.missing',
        severity: 'medium',
        url: page.url,
        evidence: {
          observed: 'Meta description tag is missing or empty.',
          expected: 'A compelling meta description between 70 and 160 characters describing the page value.',
          snippet: '<meta name="description" content=""> missing',
        },
        rootCauseKey: 'descriptions.missing',
      });
    } else {
      // Description length outside 70-160
      if (desc.length < 70) {
        findings.push({
          id: generateStableFindingId('descriptions.too_short', page.url, desc),
          checkId: 'descriptions.too_short',
          severity: 'low',
          url: page.url,
          evidence: {
            observed: `Meta description is too short (${desc.length} characters): "${desc}".`,
            expected: 'Meta descriptions should be 70–160 characters to avoid auto-snippet replacement by search engines.',
            snippet: `<meta name="description" content="${sanitizeSnippet(desc, 150)}">`,
          },
          rootCauseKey: 'descriptions.too_short',
        });
      } else if (desc.length > 160) {
        findings.push({
          id: generateStableFindingId('descriptions.too_long', page.url, desc),
          checkId: 'descriptions.too_long',
          severity: 'low',
          url: page.url,
          evidence: {
            observed: `Meta description exceeds 160 characters (${desc.length} chars) and will truncate on mobile search results.`,
            expected: 'Keep meta descriptions between 70 and 160 characters.',
            snippet: `<meta name="description" content="${sanitizeSnippet(desc, 150)}">`,
          },
          rootCauseKey: 'descriptions.too_long',
        });
      }

      // Grouping duplicate descriptions
      const normDesc = desc.toLowerCase();
      const existingDesc = descGroups.get(normDesc) || [];
      existingDesc.push(page);
      descGroups.set(normDesc, existingDesc);
    }
  }

  // 3. Flag Duplicates
  for (const [normTitle, groupedPages] of titleGroups.entries()) {
    if (groupedPages.length > 1) {
      const sampleTitle = groupedPages[0].title;
      for (const p of groupedPages) {
        findings.push({
          id: generateStableFindingId('titles.duplicate', p.url, normTitle),
          checkId: 'titles.duplicate',
          severity: 'medium',
          url: p.url,
          evidence: {
            observed: `${groupedPages.length} of ${pages.length} pages share the identical title: "${sampleTitle}".`,
            expected: 'Every indexable page must have a distinct, unique title to prevent keyword cannibalization.',
            snippet: `<title>${sanitizeSnippet(sampleTitle, 120)}</title>`,
          },
          rootCauseKey: `titles.duplicate::"${sampleTitle.slice(0, 30)}"`,
        });
      }
    }
  }

  for (const [normDesc, groupedPages] of descGroups.entries()) {
    if (groupedPages.length > 1) {
      const sampleDesc = groupedPages[0].metaDescription;
      for (const p of groupedPages) {
        findings.push({
          id: generateStableFindingId('descriptions.duplicate', p.url, normDesc),
          checkId: 'descriptions.duplicate',
          severity: 'low',
          url: p.url,
          evidence: {
            observed: `${groupedPages.length} of ${pages.length} pages share the exact same meta description.`,
            expected: 'Each page should feature a unique meta description tailored to its content.',
            snippet: `<meta name="description" content="${sanitizeSnippet(sampleDesc, 150)}">`,
          },
          rootCauseKey: `descriptions.duplicate::"${sampleDesc.slice(0, 30)}"`,
        });
      }
    }
  }

  return findings;
}
