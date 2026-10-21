import { Finding, PageCrawlData } from '../types';
import { generateStableFindingId, sanitizeSnippet } from '../utils/simhash';

export function checkHeadings(pages: PageCrawlData[]): Finding[] {
  const findings: Finding[] = [];

  for (const page of pages) {
    const { h1s, hierarchy } = page.h1ToH6;

    // 1. Missing H1
    if (h1s.length === 0) {
      findings.push({
        id: generateStableFindingId('headings.missing_h1', page.url, 'empty'),
        checkId: 'headings.missing_h1',
        severity: 'high',
        url: page.url,
        evidence: {
          observed: 'No <h1> heading found on the page.',
          expected: 'Exactly one primary <h1> heading signaling the primary topic to crawlers.',
          snippet: 'Zero <h1> tags found in document body.',
        },
        rootCauseKey: 'headings.missing_h1',
      });
    }
    // 2. Multiple H1s
    else if (h1s.length > 1) {
      findings.push({
        id: generateStableFindingId('headings.multiple_h1', page.url, `${h1s.length}`),
        checkId: 'headings.multiple_h1',
        severity: 'medium',
        url: page.url,
        evidence: {
          observed: `Page contains ${h1s.length} separate <h1> tags: [${h1s.map((h) => `"${h.slice(0, 30)}"`).join(', ')}].`,
          expected: 'Single primary <h1> tag to establish clear document semantic structure.',
          snippet: h1s.slice(0, 3).map((h) => `<h1>${sanitizeSnippet(h, 80)}</h1>`).join('\n'),
        },
        rootCauseKey: 'headings.multiple_h1',
      });
    }

    // 3. H1 Identical to <title>
    if (h1s.length === 1 && page.title) {
      if (h1s[0].toLowerCase().trim() === page.title.toLowerCase().trim()) {
        findings.push({
          id: generateStableFindingId('headings.h1_identical_to_title', page.url, h1s[0]),
          checkId: 'headings.h1_identical_to_title',
          severity: 'low',
          url: page.url,
          evidence: {
            observed: `Primary <h1> is identical to the <title>: "${h1s[0]}".`,
            expected: 'Title should focus on brand and SERP clickability, while H1 should focus on on-page context and intent variants.',
            snippet: `Title: "${page.title}" === H1: "${h1s[0]}"`,
          },
          rootCauseKey: 'headings.h1_identical_to_title',
        });
      }
    }

    // 4. Skipped Heading Levels (e.g. H1 -> H3 without H2)
    let previousLevel = 0;
    for (const heading of hierarchy) {
      if (previousLevel > 0 && heading.level > previousLevel + 1) {
        findings.push({
          id: generateStableFindingId('headings.skipped_level', page.url, `H${previousLevel}->H${heading.level}`),
          checkId: 'headings.skipped_level',
          severity: 'low',
          url: page.url,
          evidence: {
            observed: `Heading level jumped directly from <h${previousLevel}> to <h${heading.level}> without an intermediate <h${previousLevel + 1}>.`,
            expected: 'Maintain sequential hierarchical order (H1 -> H2 -> H3) for semantic clarity and accessibility.',
            snippet: `<h${heading.level}>${sanitizeSnippet(heading.text, 100)}</h${heading.level}>`,
          },
          rootCauseKey: `headings.skipped_level::H${previousLevel}_to_H${heading.level}`,
        });
        break; // Only report the first skipped jump per page to avoid noise
      }
      previousLevel = heading.level;
    }
  }

  return findings;
}
