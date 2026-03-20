/**************************************************************************************************************************
 Copyright (c) 2026

     Name: format.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import chalk from 'chalk';
import boxen from 'boxen';
import { CLI_NAME, CLI_VERSION } from '@/constants/meta';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
function formatList(title: string, values: string[]): string {
  return `${chalk.yellow.bold(title)}\n${values.map((value) => `- ${value}`).join('\n')}`;
}

function formatConfidenceReasons(result: ExplanationResult): string {
  if (!result.confidenceReasons || result.confidenceReasons.length === 0) {
    return '';
  }

  const values = result.confidenceReasons.map(
    (reason) => `${reason.label} (${reason.source}, +${reason.impact})`
  );
  return `\n${formatList('Confidence reasons', values)}`;
}

function formatSecurityFinding(finding: SecurityFinding): string {
  return `${finding.severity.toUpperCase()} ${finding.kind}: ${finding.title}`;
}

export function formatCorrelateReport(result: CorrelateOutputResult): string {
  if (result.incidents.length === 0) {
    return 'No correlated incidents found.';
  }

  return result.incidents
    .map((incident) =>
      [
        `Incident: ${incident.title}`,
        `Confidence: ${(incident.confidence * 100).toFixed(0)}%`,
        `Shared keys: ${JSON.stringify(incident.sharedKeys)}`,
        'Timeline:',
        ...incident.timeline
          .slice(0, 10)
          .map((event) => `- ${event.timestamp ?? 'unknown-time'} | ${event.message}`)
      ].join('\n')
    )
    .join('\n\n');
}

export function formatExplanation(result: ExplanationResult): string {
  const header = boxen(chalk.cyan.bold(`${CLI_NAME} v${CLI_VERSION}`), {
    padding: 1,
    borderStyle: 'round'
  });

  return [
    header,
    `${chalk.green.bold('Issue:')} ${result.title}`,
    `${chalk.green.bold('Category:')} ${result.category}`,
    `${chalk.green.bold('Confidence:')} ${(result.confidence * 100).toFixed(0)}%`,
    '',
    `${chalk.yellow.bold('Explanation')}\n${result.explanation}`,
    '',
    formatList('Evidence', result.evidence),
    '',
    formatList('Likely causes', result.likelyCauses),
    '',
    formatList('Suggested fixes', result.suggestedFixes),
    '',
    formatList('Debug commands', result.debugCommands),
    formatConfidenceReasons(result)
  ].join('\n');
}

export function formatAnalyzeReport(result: AnalyzeOutputResult): string {
  const header = boxen(chalk.cyan.bold(`${CLI_NAME} v${CLI_VERSION}`), {
    padding: 1,
    borderStyle: 'round'
  });

  const sourceLines = result.sources.map(
    (source) => `${source.displayName} (${source.kind}, ${source.serviceType})`
  );
  const incidentLines =
    result.incidents.length > 0
      ? result.incidents.map(
          (incident) =>
            `${incident.title} [${incident.sourceNames.join(', ')}] (${(
              incident.confidence * 100
            ).toFixed(0)}%)`
        )
      : ['No detected incidents'];
  const correlationLines =
    result.correlations.length > 0
      ? result.correlations.map((incident) => incident.title)
      : ['No correlated incidents'];
  const securityLines =
    result.securityFindings.length > 0
      ? result.securityFindings.map(formatSecurityFinding)
      : ['No security findings'];
  const nextActions =
    result.summary.nextActions.length > 0
      ? result.summary.nextActions
      : ['No follow-up actions generated'];

  return [
    header,
    formatList('Discovered sources', sourceLines),
    '',
    formatList('Top incidents', incidentLines),
    '',
    formatList('Correlations', correlationLines),
    '',
    formatList('Security findings', securityLines),
    '',
    formatList('Next actions', nextActions)
  ].join('\n');
}
