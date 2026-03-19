/**************************************************************************************************************************
 Copyright (c) 2026

     Name: nginx.ts
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
export const nginx: IssueDetector = {
  name: 'nginx-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /502 Bad Gateway/i, weight: 45, label: '502 Bad Gateway' },
      { pattern: /connect\(\) failed/i, weight: 40, label: 'connect() failed' },
      {
        pattern: /upstream prematurely closed connection/i,
        weight: 40,
        label: 'upstream prematurely closed connection'
      },
      { pattern: /\bnginx\b/i, weight: 15, label: 'nginx' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'nginx_upstream_failure',
      title: 'Nginx upstream failure',
      category: 'proxy',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /502 Bad Gateway/i,
        /connect\(\) failed/i,
        /upstream prematurely closed connection/i,
        /nginx/i
      ]),
      summary: 'Nginx could not successfully communicate with the upstream application.'
    };
  }
};
