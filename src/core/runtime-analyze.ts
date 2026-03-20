/**************************************************************************************************************************
 Copyright (c) 2026

     Name: runtime-analyze.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import crypto from 'node:crypto';
import { analyzeExplanation } from '@/core/analyze';
import { correlateLogs } from '@/correlation/correlate';
import { createAnalyzeOutputEnvelope } from '@/core/output';
import { annotateSourceForCorrelation } from '@/runtime/collect';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
interface AnalyzedSource {
  source: CollectedSource;
  explanation: ExplanationResult;
}

function toAnalyzeIncident(
  item: AnalyzedSource,
  correlations: CorrelatedIncident[]
): AnalyzeIncident {
  const relatedCorrelationKeys = correlations
    .filter((correlation) => {
      const services = correlation.metadata?.services;
      return Array.isArray(services) && services.includes(item.source.displayName);
    })
    .reduce<Record<string, string>>((accumulator, correlation) => {
      Object.assign(accumulator, correlation.sharedKeys);
      return accumulator;
    }, {});

  return {
    id: crypto
      .createHash('sha1')
      .update(`${item.source.id}:${item.explanation.issueType}`)
      .digest('hex')
      .slice(0, 12),
    issueType: item.explanation.issueType,
    title: item.explanation.title,
    category: item.explanation.category,
    confidence: item.explanation.confidence,
    sourceIds: [item.source.id],
    sourceNames: [item.source.displayName],
    serviceTypes: [item.source.serviceType],
    explanation: item.explanation.explanation,
    evidence: item.explanation.evidence,
    likelyCauses: item.explanation.likelyCauses,
    suggestedFixes: item.explanation.suggestedFixes,
    relatedCorrelationKeys,
    confidenceReasons: item.explanation.confidenceReasons ?? []
  };
}

function inferSecuritySeverity(input: string): SecurityFinding['severity'] {
  if (/\b(root|denied|certificate|handshake|unauthorized|failed password)\b/i.test(input)) {
    return 'high';
  }

  if (/\b(auth|ssh|tls|permission)\b/i.test(input)) {
    return 'medium';
  }

  return 'low';
}

function buildSecurityFindings(items: AnalyzedSource[]): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  for (const item of items) {
    const summaryText = `${item.explanation.title} ${item.explanation.explanation} ${item.source.raw}`;

    if (
      item.explanation.category === 'security' ||
      /\b(auth|ssh|tls|certificate|permission denied|failed password|unauthorized)\b/i.test(
        summaryText
      )
    ) {
      findings.push({
        title: item.explanation.title,
        severity: inferSecuritySeverity(summaryText),
        kind: 'incident',
        evidence: item.explanation.evidence.slice(0, 3),
        sourceIds: [item.source.id],
        recommendation: item.explanation.suggestedFixes[0] ?? 'Inspect the collected evidence.'
      });
    }

    if (
      item.source.kind === 'docker-container' &&
      /\blocalhost\b/i.test(item.source.raw) &&
      /\b(redis|postgres|mongo|mongodb|mysql)\b/i.test(item.source.raw)
    ) {
      findings.push({
        title: 'Potential container localhost dependency mismatch',
        severity: 'medium',
        kind: 'posture',
        evidence: item.source.raw
          .split('\n')
          .filter((line) => /\blocalhost\b/i.test(line))
          .slice(0, 3),
        sourceIds: [item.source.id],
        recommendation:
          'Use service discovery or container names instead of localhost inside containers.'
      });
    }

    const authFailureLines = item.source.raw
      .split('\n')
      .filter((line) =>
        /\b(failed password|authentication failed|access refused|noauth|wrongpass)\b/i.test(line)
      );
    if (authFailureLines.length >= 2) {
      findings.push({
        title: 'Repeated authentication failures observed',
        severity: 'high',
        kind: 'posture',
        evidence: authFailureLines.slice(0, 3),
        sourceIds: [item.source.id],
        recommendation:
          'Review credentials, rate limits, and possible unauthorized access attempts.'
      });
    }
  }

  return findings;
}

function buildSummary(
  sources: CollectedSource[],
  incidents: AnalyzeIncident[],
  correlations: CorrelatedIncident[],
  securityFindings: SecurityFinding[]
): AnalyzeSummary {
  return {
    sourceCount: sources.length,
    incidentCount: incidents.length,
    correlationCount: correlations.length,
    securityFindingCount: securityFindings.length,
    topIssueTitles: incidents.slice(0, 3).map((incident) => incident.title),
    nextActions: [...new Set(incidents.flatMap((incident) => incident.suggestedFixes).slice(0, 5))]
  };
}

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function analyzeCollectedSources(
  sources: CollectedSource[],
  options: AnalyzeOptions
): Promise<AnalyzeOutputEnvelope> {
  const analyzedSources: AnalyzedSource[] = await Promise.all(
    sources.map(async (source) => ({
      source,
      explanation: await analyzeExplanation(source.raw, options)
    }))
  );

  const correlations = correlateLogs(sources.map((source) => annotateSourceForCorrelation(source)));
  const incidents = analyzedSources
    .filter((item) => item.explanation.issueType !== 'unknown')
    .map((item) => toAnalyzeIncident(item, correlations))
    .sort((left, right) => right.confidence - left.confidence);

  const securityFindings = buildSecurityFindings(analyzedSources);
  const summary = buildSummary(sources, incidents, correlations, securityFindings);

  return createAnalyzeOutputEnvelope({
    sources,
    incidents,
    correlations,
    securityFindings,
    summary,
    metadata: {
      discoveryMode: 'guided-auto',
      includeDocker: Boolean(options.includeDocker),
      includeSystem: Boolean(options.includeSystem),
      includeServices: options.includeServices
        ? options.includeServices
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : []
    }
  });
}
