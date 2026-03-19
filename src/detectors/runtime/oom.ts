/**************************************************************************************************************************
 Copyright (c) 2026

     Name: oom.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { runPatternRules } from '@/detectors/shared/rules';
import { pickEvidence } from '@/detectors/shared/evidence';
import { scoreToConfidence } from '@/detectors/shared/confidence';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export const oom: IssueDetector = {
  name: 'oom-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\bout of memory\b/i, weight: 45, label: 'out of memory' },
      {
        pattern: /\bJavaScript heap out of memory\b/i,
        weight: 55,
        label: 'JavaScript heap out of memory'
      },
      { pattern: /\bOOMKilled\b/i, weight: 55, label: 'OOMKilled' },
      { pattern: /\bKilled process\b/i, weight: 40, label: 'Killed process' },
      { pattern: /\bCannot allocate memory\b/i, weight: 45, label: 'Cannot allocate memory' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'out_of_memory_error',
      title: 'Out-of-memory or memory pressure failure',
      category: 'runtime',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\bout of memory\b/i,
        /\bJavaScript heap out of memory\b/i,
        /\bOOMKilled\b/i,
        /\bKilled process\b/i,
        /\bCannot allocate memory\b/i
      ]),
      summary: 'The process or container exhausted available memory.'
    };
  }
};
