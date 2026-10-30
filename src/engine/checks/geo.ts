import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { RobotsParser, BotRuleEvaluation, BotAccessStatus } from '../utils/robotsParser';

export interface GeoAnalysisSignals {
  aiBots: BotRuleEvaluation[];
  isClientRendered: boolean;
  brandEntityDeclared: boolean;
  declaredSameAsCount: number;
  declaredSameAsLinks: string[];
  hasAuthorAttribution: boolean;
  hasPublicationDates: boolean;
  hasLlmsTxt: boolean;
  wafStatus: 'accessible' | 'waf_blocked' | 'probe_skipped';
}

export interface GeoCheckResult {
  findings: Finding[];
  signals: GeoAnalysisSignals;
}

const AI_BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'] as const;

/**
 * Discrete GEO Check Suite
 * 1. geo.ai_bot_access: RFC 9309 robots.txt evaluation for major AI search bots
 * 2. geo.waf_probe: Edge firewall / WAF reachability under GPTBot User-Agent
 * 3. geo.client_render_barrier: Flags empty client-rendered JS roots that bots cannot parse
 * 4. geo.entity_declared: Validates declared sameAs entity anchors in Schema.org
 * 5. geo.authorship_freshness: E-E-A-T grounding (author schema & ISO-8601 timestamps)
 * 6. geo.llms_txt: Informational check for /llms.txt standard
 */
export function checkGEO(
  pages: PageCrawlData[],
  metadata: SiteMetadata,
  robotsParser: RobotsParser,
  wafProbeResult?: { accessible: boolean; status: number; blockedReason?: string },
  llmsTxtFound?: boolean
): GeoCheckResult {
  const findings: Finding[] = [];
  const rootPage = pages[0] || { url: metadata.baseUrl, isClientRendered: false, jsonLd: [], headers: {}, html: '' };

  // 1. Evaluate RFC 9309 robots.txt rules for AI bots
  const botEvaluations: BotRuleEvaluation[] = AI_BOTS.map((bot) =>
    robotsParser.evaluateBot(bot, '/')
  );

  const blockedBots = botEvaluations.filter((b) => b.status === 'blocked');
  if (blockedBots.length > 0) {
    findings.push({
      id: `geo.ai_bot_access.${metadata.hostname}`,
      checkId: 'geo.ai_bot_access',
      severity: 'high',
      url: metadata.baseUrl,
      rootCauseKey: 'geo.ai_bot_access',
      evidence: {
        observed: `robots.txt blocks ${blockedBots.length} AI bot(s): ${blockedBots.map((b) => `${b.bot} via "${b.matchedRule}"`).join(', ')}.`,
        expected: 'Remove broad Disallow directives in robots.txt for verified AI search crawlers (e.g. GPTBot, PerplexityBot) to enable generative search indexing.',
      },
    });
  }

  // 2. Evaluate WAF probe
  let wafStatus: 'accessible' | 'waf_blocked' | 'probe_skipped' = 'probe_skipped';
  if (wafProbeResult) {
    wafStatus = wafProbeResult.accessible ? 'accessible' : 'waf_blocked';
    if (!wafProbeResult.accessible) {
      findings.push({
        id: `geo.waf_probe.${metadata.hostname}`,
        checkId: 'geo.waf_probe',
        severity: 'high',
        url: metadata.baseUrl,
        rootCauseKey: 'geo.waf_probe',
        evidence: {
          observed: `Edge WAF returned HTTP ${wafProbeResult.status} when probed with User-Agent: GPTBot (${wafProbeResult.blockedReason || 'Blocked'}).`,
          expected: 'Configure edge firewall (Cloudflare, AWS WAF) security rules to permit legitimate AI search crawlers rather than serving 403 or challenge pages.',
        },
      });
    }
  }

  // 3. Client Render Barrier (Raw vs Rendered HTML)
  const clientRenderedPages = pages.filter((p) => p.isClientRendered);
  if (clientRenderedPages.length > 0) {
    findings.push({
      id: `geo.client_render_barrier.${clientRenderedPages[0].url}`,
      checkId: 'geo.client_render_barrier',
      severity: 'high',
      url: clientRenderedPages[0].url,
      rootCauseKey: 'geo.client_render_barrier',
      evidence: {
        observed: `${clientRenderedPages.length} page(s) appear client-rendered with an empty root container and <250 bytes visible text.`,
        expected: 'Implement Server-Side Rendering (SSR) or Static Site Generation (SSG) so raw HTML is visible to AI scrapers that do not execute client-side JavaScript.',
        snippet: clientRenderedPages.map((p) => p.url).slice(0, 3).join(', '),
      },
    });
  }

  // 4. Entity Grounding: Check declared sameAs links in JSON-LD
  const allSameAsLinks: string[] = [];
  let hasEntityDeclared = false;

  for (const page of pages) {
    for (const item of page.jsonLd || []) {
      const type = item?.['@type'] || item?.type;
      const isEntity =
        type === 'Organization' ||
        type === 'Corporation' ||
        type === 'SoftwareApplication' ||
        type === 'WebSite' ||
        type === 'Person';

      if (isEntity && item?.sameAs) {
        hasEntityDeclared = true;
        const links = Array.isArray(item.sameAs) ? item.sameAs : [item.sameAs];
        for (const l of links) {
          if (typeof l === 'string' && l.startsWith('http') && !allSameAsLinks.includes(l)) {
            allSameAsLinks.push(l);
          }
        }
      }
    }
  }

  if (!hasEntityDeclared && rootPage) {
    findings.push({
      id: `geo.entity_declared.${rootPage.url}`,
      checkId: 'geo.entity_declared',
      severity: 'medium',
      url: rootPage.url,
      rootCauseKey: 'geo.entity_declared',
      evidence: {
        observed: 'No declared sameAs entity anchors found in Organization / SoftwareApplication schema.',
        expected: 'Declare verified sameAs URIs (e.g. Wikidata, Wikipedia, official GitHub, Crunchbase) in schema to anchor brand entity in LLM knowledge graphs.',
      },
    });
  }

  // 5. Authorship & Freshness signals
  let hasAuthorAttribution = false;
  let hasPublicationDates = false;

  for (const page of pages) {
    // Check Schema.org
    for (const item of page.jsonLd || []) {
      if (item?.author || item?.creator) hasAuthorAttribution = true;
      if (item?.dateModified || item?.datePublished) hasPublicationDates = true;
    }

    // Check meta tags & HTML
    const htmlLower = (page.html || '').toLowerCase();
    if (htmlLower.includes('name="author"') || htmlLower.includes('property="article:author"')) {
      hasAuthorAttribution = true;
    }
    if (
      htmlLower.includes('property="article:published_time"') ||
      htmlLower.includes('property="article:modified_time"') ||
      htmlLower.includes('<time')
    ) {
      hasPublicationDates = true;
    }
  }

  if (!hasAuthorAttribution && !hasPublicationDates && rootPage) {
    findings.push({
      id: `geo.authorship_freshness.${rootPage.url}`,
      checkId: 'geo.authorship_freshness',
      severity: 'low',
      url: rootPage.url,
      rootCauseKey: 'geo.authorship_freshness',
      evidence: {
        observed: 'Zero author attribution signals and zero publication/modification dates detected across crawl.',
        expected: 'Provide clear author attribution (<meta name="author"> or Person schema) and ISO-8601 timestamps to support freshness and credibility signals.',
      },
    });
  }

  // 6. llms.txt check (informational, zero penalty)
  const hasLlmsTxt = Boolean(llmsTxtFound);
  if (!hasLlmsTxt && rootPage) {
    findings.push({
      id: `geo.llms_txt.${rootPage.url}`,
      checkId: 'geo.llms_txt',
      severity: 'info',
      url: rootPage.url,
      rootCauseKey: 'geo.llms_txt',
      evidence: {
        observed: 'No /llms.txt file detected on origin server.',
        expected: 'Optionally provide an /llms.txt file summarizing your website, documentation, and key resources for LLM agents.',
      },
    });
  }

  return {
    findings,
    signals: {
      aiBots: botEvaluations,
      isClientRendered: clientRenderedPages.length > 0,
      brandEntityDeclared: hasEntityDeclared,
      declaredSameAsCount: allSameAsLinks.length,
      declaredSameAsLinks: allSameAsLinks.slice(0, 5),
      hasAuthorAttribution,
      hasPublicationDates,
      hasLlmsTxt,
      wafStatus,
    },
  };
}

