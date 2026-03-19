/**************************************************************************************************************************
 Copyright (c) 2026

     Name: dns.ts
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
export const dns: IssueDetector = {
  name: 'dns-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /ENOTFOUND/i, weight: 45, label: 'ENOTFOUND' },
      { pattern: /getaddrinfo/i, weight: 35, label: 'getaddrinfo' },
      {
        pattern: /Temporary failure in name resolution/i,
        weight: 45,
        label: 'Temporary failure in name resolution'
      }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'dns_resolution_error',
      title: 'Hostname or DNS resolution failure',
      category: 'network',
      score,
      confidence: scoreToConfidence(score),
      specificity: 3,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [/ENOTFOUND/i, /getaddrinfo/i, /name resolution/i]),
      summary: 'The application could not resolve the target hostname.'
    };
  }
};
