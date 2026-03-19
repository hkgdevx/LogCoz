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
