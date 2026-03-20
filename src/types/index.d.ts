/**************************************************************************************************************************
 Copyright (c) 2026

     Name: index.d.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
type IssueCategory =
  | 'database'
  | 'network'
  | 'runtime'
  | 'filesystem'
  | 'proxy'
  | 'container'
  | 'messaging'
  | 'security'
  | 'orchestration'
  | 'correlation'
  | 'unknown';

interface ContextHint {
  key: string;
  value: string;
  source: string;
}

interface ConfidenceReason {
  label: string;
  impact: number;
  source: 'pattern' | 'context' | 'heuristic';
}

interface DetectionContext {
  raw: string;
  normalized: string;
  lines: string[];
  contextHints: ContextHint[];
}

interface DetectionCandidate {
  detector: string;
  type: string;
  title: string;
  category: IssueCategory;
  confidence: number;
  score: number;
  specificity: number;
  evidence: string[];
  matchedPatterns: string[];
  summary: string;
  metadata?: Record<string, unknown>;
  confidenceReasons?: ConfidenceReason[];
}

interface IssueDetector {
  name: string;
  detect(ctx: DetectionContext): DetectionCandidate | null;
}

interface ExplanationResult {
  issueType: string;
  title: string;
  category: IssueCategory;
  confidence: number;
  explanation: string;
  evidence: string[];
  likelyCauses: string[];
  suggestedFixes: string[];
  debugCommands: string[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
  confidenceReasons?: ConfidenceReason[];
}

interface LogEvent {
  raw: string;
  message: string;
  timestamp?: string;
  level?: string;
  source?: string;
  service?: string;
  correlationKeys: Record<string, string>;
}

interface CorrelatedIncident {
  id: string;
  title: string;
  confidence: number;
  sharedKeys: Record<string, string>;
  timeline: LogEvent[];
  rootCauseHints: string[];
  symptomHints: string[];
  metadata?: Record<string, unknown>;
}

type SourceKind = 'file' | 'stdin' | 'docker-container' | 'system-log';

type ServiceType =
  | 'app'
  | 'postgres'
  | 'redis'
  | 'mongodb'
  | 'nginx'
  | 'ssh'
  | 'system'
  | 'kubernetes'
  | 'unknown';

interface CollectedSource {
  id: string;
  kind: SourceKind;
  displayName: string;
  serviceType: ServiceType;
  raw: string;
  metadata: {
    host: 'local';
    command?: string;
    window?: string;
    truncated?: boolean;
    image?: string;
    container?: string;
    path?: string;
    unit?: string;
  };
}

interface PatternRule {
  pattern: RegExp;
  weight: number;
  label: string;
}

interface ExplainOptions {
  json?: boolean;
  context?: string;
  llm?: boolean;
  llmProvider?: string;
  llmEndpoint?: string;
  llmModel?: string;
  includeReasoning?: boolean;
  container?: string | string[];
  service?: string | string[];
  tail?: string | number;
  since?: string;
}

interface PasteOptions {
  json?: boolean;
  context?: string;
  llm?: boolean;
  llmProvider?: string;
  llmEndpoint?: string;
  llmModel?: string;
  includeReasoning?: boolean;
}

interface LlmExplainInput {
  issue: DetectionCandidate;
  raw: string;
  normalized: string;
  contextHints: ContextHint[];
}

interface LlmProviderConfig {
  enabled: boolean;
  provider: string;
  endpoint?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

interface LlmProvider {
  isEnabled(): boolean;
  enhanceExplanation(input: LlmExplainInput, base: ExplanationResult): Promise<ExplanationResult>;
}

interface ExplainOutputEnvelope {
  schemaVersion: string;
  cliName: string;
  cliVersion: string;
  exitCode: number;
  status: 'detected' | 'unknown';
  result: ExplanationResult;
}

interface CorrelateOptions {
  json?: boolean;
  container?: string | string[];
  service?: string | string[];
  tail?: string | number;
  since?: string;
  includeSystem?: boolean;
  systemSource?: string | string[];
}

interface AnalyzeOptions extends ExplainOptions {
  includeDocker?: boolean;
  includeSystem?: boolean;
  includeServices?: string;
  excludeSources?: string;
}

interface CorrelateOutputResult {
  incidents: CorrelatedIncident[];
  count: number;
  metadata?: Record<string, unknown>;
}

interface CorrelateOutputEnvelope {
  schemaVersion: string;
  cliName: string;
  cliVersion: string;
  exitCode: number;
  status: 'correlated';
  result: CorrelateOutputResult;
}

interface AnalyzeIncident {
  id: string;
  issueType: string;
  title: string;
  category: IssueCategory;
  confidence: number;
  sourceIds: string[];
  sourceNames: string[];
  serviceTypes: ServiceType[];
  explanation: string;
  evidence: string[];
  likelyCauses: string[];
  suggestedFixes: string[];
  relatedCorrelationKeys: Record<string, string>;
  confidenceReasons?: ConfidenceReason[];
}

interface SecurityFinding {
  title: string;
  severity: 'low' | 'medium' | 'high';
  kind: 'incident' | 'posture';
  evidence: string[];
  sourceIds: string[];
  recommendation: string;
}

interface AnalyzeSummary {
  sourceCount: number;
  incidentCount: number;
  correlationCount: number;
  securityFindingCount: number;
  topIssueTitles: string[];
  nextActions: string[];
}

interface AnalyzeOutputResult {
  sources: CollectedSource[];
  incidents: AnalyzeIncident[];
  correlations: CorrelatedIncident[];
  securityFindings: SecurityFinding[];
  summary: AnalyzeSummary;
  metadata?: Record<string, unknown>;
}

interface AnalyzeOutputEnvelope {
  schemaVersion: string;
  cliName: string;
  cliVersion: string;
  exitCode: number;
  status: 'analyzed';
  result: AnalyzeOutputResult;
}
