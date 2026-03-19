/**************************************************************************************************************************
 Copyright (c) 2026

     Name: timeout.ts
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
export const timeout: IssueDetector = {
  name: 'timeout-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\bETIMEDOUT\b/i, weight: 50, label: 'ETIMEDOUT' },
      { pattern: /\btimeout\b/i, weight: 35, label: 'timeout' },
      { pattern: /\bConnection timed out\b/i, weight: 45, label: 'Connection timed out' },
      { pattern: /\boperation timed out\b/i, weight: 40, label: 'operation timed out' },
      { pattern: /\bnetwork is unreachable\b/i, weight: 40, label: 'network is unreachable' },
      { pattern: /\brequest timed out\b/i, weight: 40, label: 'request timed out' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'network_timeout',
      title: 'Network timeout or unreachable service',
      category: 'network',
      score,
      confidence: scoreToConfidence(score),
      specificity: 3,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\bETIMEDOUT\b/i,
        /\btimeout\b/i,
        /\bConnection timed out\b/i,
        /\boperation timed out\b/i,
        /\bnetwork is unreachable\b/i,
        /\brequest timed out\b/i
      ]),
      summary: 'The application could not reach the target service in time.'
    };
  }
};
