import { Finding, PageCrawlData } from '../types';
import { generateStableFindingId, sanitizeSnippet } from '../utils/simhash';

export function checkStructuredData(pages: PageCrawlData[]): Finding[] {
  const findings: Finding[] = [];

  for (const page of pages) {
    if (page.jsonLd.length === 0) {
      // Flag missing structured data on key landing pages (depth 0)
      if (page.depth === 0) {
        findings.push({
          id: generateStableFindingId('structured_data.missing_schema', page.url, 'no_json_ld'),
          checkId: 'structured_data.missing_schema',
          severity: 'medium',
          url: page.url,
          evidence: {
            observed: 'No JSON-LD structured data block found on the homepage.',
            expected: 'Add valid Schema.org JSON-LD (e.g. Organization, WebSite, or SoftwareApplication) to enable rich search snippets.',
            snippet: 'Zero <script type="application/ld+json"> tags found.',
          },
          rootCauseKey: 'structured_data.missing_schema',
        });
      }
      continue;
    }

    for (const item of page.jsonLd) {
      // 1. Check for invalid JSON syntax error flagged during crawl
      if (item.__error === 'invalid_json') {
        findings.push({
          id: generateStableFindingId('structured_data.invalid_json', page.url, item.raw),
          checkId: 'structured_data.invalid_json',
          severity: 'high',
          url: page.url,
          evidence: {
            observed: 'Syntax error encountered while parsing JSON-LD script block.',
            expected: 'Valid JSON format conforming to RFC 8259.',
            snippet: sanitizeSnippet(item.raw, 150),
          },
          rootCauseKey: 'structured_data.invalid_json',
        });
        continue;
      }

      // Handle @graph arrays or direct objects
      const schemas: any[] = Array.isArray(item['@graph']) ? item['@graph'] : [item];

      for (const schema of schemas) {
        const type = schema['@type'];
        if (!type) continue;

        // Organization / LocalBusiness validation
        if (type === 'Organization' || type === 'LocalBusiness') {
          if (!schema.name) {
            findings.push({
              id: generateStableFindingId('structured_data.missing_required_property', page.url, `${type}.name`),
              checkId: 'structured_data.missing_required_property',
              severity: 'medium',
              url: page.url,
              evidence: {
                observed: `${type} schema is missing required 'name' property.`,
                expected: `Provide the official business or organization name in '${type}.name'.`,
                snippet: sanitizeSnippet(JSON.stringify(schema), 150),
              },
              rootCauseKey: `structured_data.missing_required_property::${type}.name`,
            });
          }
          if (!schema.url) {
            findings.push({
              id: generateStableFindingId('structured_data.missing_required_property', page.url, `${type}.url`),
              checkId: 'structured_data.missing_required_property',
              severity: 'low',
              url: page.url,
              evidence: {
                observed: `${type} schema is missing recommended 'url' property.`,
                expected: `Include '${type}.url' matching the official website URL.`,
                snippet: sanitizeSnippet(JSON.stringify(schema), 150),
              },
              rootCauseKey: `structured_data.missing_required_property::${type}.url`,
            });
          }
        }

        // Product validation
        if (type === 'Product') {
          if (!schema.name || !schema.offers) {
            findings.push({
              id: generateStableFindingId('structured_data.missing_required_property', page.url, 'Product.offers'),
              checkId: 'structured_data.missing_required_property',
              severity: 'high',
              url: page.url,
              evidence: {
                observed: `Product schema lacks essential 'offers' or 'name' properties for Google Merchant eligibility.`,
                expected: 'Product schema must specify name, image, and offers (price, priceCurrency, availability).',
                snippet: sanitizeSnippet(JSON.stringify(schema), 150),
              },
              rootCauseKey: 'structured_data.missing_required_property::Product.offers',
            });
          }
        }

        // Article validation
        if (type === 'Article' || type === 'BlogPosting' || type === 'NewsArticle') {
          if (!schema.headline || !schema.author) {
            findings.push({
              id: generateStableFindingId('structured_data.missing_required_property', page.url, `${type}.headline`),
              checkId: 'structured_data.missing_required_property',
              severity: 'medium',
              url: page.url,
              evidence: {
                observed: `${type} schema lacks required 'headline' or 'author' field.`,
                expected: 'Article schemas must specify headline, datePublished, and author details.',
                snippet: sanitizeSnippet(JSON.stringify(schema), 150),
              },
              rootCauseKey: `structured_data.missing_required_property::${type}.headline`,
            });
          }
        }

        // BreadcrumbList validation
        if (type === 'BreadcrumbList') {
          if (!Array.isArray(schema.itemListElement) || schema.itemListElement.length === 0) {
            findings.push({
              id: generateStableFindingId('structured_data.missing_required_property', page.url, 'BreadcrumbList.items'),
              checkId: 'structured_data.missing_required_property',
              severity: 'medium',
              url: page.url,
              evidence: {
                observed: "BreadcrumbList schema contains empty or non-array 'itemListElement'.",
                expected: 'itemListElement must be a non-empty array of ListItem elements with position and name.',
                snippet: sanitizeSnippet(JSON.stringify(schema), 150),
              },
              rootCauseKey: 'structured_data.missing_required_property::BreadcrumbList.items',
            });
          }
        }
      }
    }
  }

  return findings;
}
