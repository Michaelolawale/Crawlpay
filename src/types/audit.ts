import { ArchetypeProfile } from '../analyzer/archetypeDetector';
import { SeoTechnicalData } from '../analyzer/seoParser';
import { SemanticAnalysis } from '../analyzer/semanticAuditor';
import { PerformanceVitals } from '../analyzer/speedVitals';
import { CodePatches } from '../analyzer/fixGenerator';
import { CrawlExecutionLog } from '../services/buyClient';
import { Finding, FindingGroup, PriorityItem, SeoAuditReport } from '../engine/types';
import { MobileAuditMetrics } from '../engine/checks/mobilePerformance';
import { AeoAnalysisSignals } from '../engine/checks/aeo';
import { GeoAnalysisSignals } from '../engine/checks/geo';

export interface FullAuditReport {
  schemaVersion?: string;
  auditVersion?: string;
  targetUrl: string;
  auditTimestamp: string;
  coverage?: {
    totalChecks: number;
    evaluatedChecks: number;
    unknownChecks: number;
    coveragePercentage: number;
  };
  summary: string;
  scores: {
    overall: number;
    technical: number;
    content: number;
    performance: number;
    social: number;
    mobile?: number;
    aeo: number;
    geo: number;
  };
  aeoSignals?: AeoAnalysisSignals;
  geoSignals?: GeoAnalysisSignals;
  archetype: ArchetypeProfile;
  topNeedleMovers: Array<{
    priority: 'Critical' | 'High' | 'Quick Win';
    title: string;
    description: string;
    action: string;
    snippet?: string;
  }>;
  prioritizedGroups: FindingGroup[];
  prioritiesFromLlm?: PriorityItem[];
  whatPassed: string;
  notChecked: string[];
  allFindings: Finding[];
  pagesChecked: number;
  detectedStack: {
    cms?: string;
    seoPlugin?: string;
    framework?: string;
  };
  technical: SeoTechnicalData;
  semantics: SemanticAnalysis;
  performance: PerformanceVitals;
  mobileMetrics?: MobileAuditMetrics;
  codePatches: CodePatches;
  onchainReceipt: CrawlExecutionLog;
  checkEngineReport?: SeoAuditReport;
}
