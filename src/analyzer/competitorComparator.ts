import { FullAuditReport } from '../server';

export interface CompetitorComparison {
  target: {
    url: string;
    score: number;
    lcpSeconds: number;
    heading: string;
    schemaCount: number;
  };
  competitor: {
    url: string;
    score: number;
    lcpSeconds: number;
    heading: string;
    schemaCount: number;
  };
  winner: 'target' | 'competitor' | 'tie';
  scoreDelta: number;
  speedAdvantage: string;
  whyTheyAreWinning: string[];
  threeStepsToBeatThem: string[];
}

export function compareCompetitors(
  targetReport: FullAuditReport,
  competitorReport: FullAuditReport
): CompetitorComparison {
  const targetScore = targetReport.scores.overall;
  const compScore = competitorReport.scores.overall;
  const scoreDelta = compScore - targetScore;

  let winner: 'target' | 'competitor' | 'tie' = 'tie';
  if (compScore > targetScore) winner = 'competitor';
  else if (targetScore > compScore) winner = 'target';

  const targetLcp = targetReport.performance.lcpEstimateSeconds;
  const compLcp = competitorReport.performance.lcpEstimateSeconds;

  let speedAdvantage = '';
  if (compLcp < targetLcp) {
    const diff = (targetLcp - compLcp).toFixed(1);
    speedAdvantage = `Competitor renders ${diff}s faster, winning mobile ranking points.`;
  } else {
    const diff = (compLcp - targetLcp).toFixed(1);
    speedAdvantage = `Your site renders ${diff}s faster than your competitor!`;
  }

  const whyTheyAreWinning: string[] = [];
  const threeStepsToBeatThem: string[] = [];

  if (competitorReport.technical.openGraph.hasCompleteOg && !targetReport.technical.openGraph.hasCompleteOg) {
    whyTheyAreWinning.push('Competitor has complete OpenGraph cards, dominating social shares and CTR.');
    threeStepsToBeatThem.push('Deploy CrawlPay’s auto-generated OpenGraph meta tags immediately.');
  }

  if (compLcp < targetLcp) {
    whyTheyAreWinning.push(`Competitor's First Contentful Paint is ${compLcp}s vs your ${targetLcp}s.`);
    threeStepsToBeatThem.push('Convert all PNGs to WebP and defer render-blocking scripts to close the speed gap.');
  }

  if (competitorReport.technical.technical.hasJsonLd && !targetReport.technical.technical.hasJsonLd) {
    whyTheyAreWinning.push('Competitor has structured Schema.org markup eligible for rich Google search snippets.');
    threeStepsToBeatThem.push(`Inject CrawlPay’s custom ${targetReport.archetype.primarySchemaNeeded} JSON-LD schema into your <head>.`);
  }

  if (competitorReport.semantics.h1Quality === 'strong' && targetReport.semantics.h1Quality !== 'strong') {
    whyTheyAreWinning.push('Competitor uses intent-matched keyword headings rather than vague marketing slogans.');
    threeStepsToBeatThem.push(`Change your H1 to "${targetReport.semantics.recommendedH1}" to capture target search volume.`);
  }

  if (whyTheyAreWinning.length === 0) {
    whyTheyAreWinning.push('Your site is technically neck-and-neck with this competitor.');
    threeStepsToBeatThem.push('Target long-tail content queries to expand keyword dominance.');
  }

  return {
    target: {
      url: targetReport.targetUrl,
      score: targetScore,
      lcpSeconds: targetLcp,
      heading: targetReport.semantics.currentH1 || '(None)',
      schemaCount: targetReport.technical.technical.existingSchemas.length,
    },
    competitor: {
      url: competitorReport.targetUrl,
      score: compScore,
      lcpSeconds: compLcp,
      heading: competitorReport.semantics.currentH1 || '(None)',
      schemaCount: competitorReport.technical.technical.existingSchemas.length,
    },
    winner,
    scoreDelta,
    speedAdvantage,
    whyTheyAreWinning,
    threeStepsToBeatThem: threeStepsToBeatThem.slice(0, 3),
  };
}
