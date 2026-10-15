import { ArchetypeProfile } from '../analyzer/archetypeDetector';
import { SeoTechnicalData } from '../analyzer/seoParser';
import { SemanticAnalysis } from '../analyzer/semanticAuditor';
import { PerformanceVitals } from '../analyzer/speedVitals';
import { CodePatches } from '../analyzer/fixGenerator';
import { CrawlExecutionLog } from '../services/buyClient';

export interface FullAuditReport {
  targetUrl: string;
  auditTimestamp: string;
  scores: {
    overall: number;
    technical: number;
    content: number;
    performance: number;
    social: number;
  };
  archetype: ArchetypeProfile;
  topNeedleMovers: Array<{
    priority: 'Critical' | 'High' | 'Quick Win';
    title: string;
    description: string;
    action: string;
  }>;
  technical: SeoTechnicalData;
  semantics: SemanticAnalysis;
  performance: PerformanceVitals;
  codePatches: CodePatches;
  onchainReceipt: CrawlExecutionLog;
}
