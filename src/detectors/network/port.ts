/**************************************************************************************************************************
 Copyright (c) 2026

     Name: port.ts
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
export const port: IssueDetector = {
  name: 'port-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /EADDRINUSE/i, weight: 50, label: 'EADDRINUSE' },
      { pattern: /address already in use/i, weight: 45, label: 'address already in use' },
      { pattern: /bind failed/i, weight: 35, label: 'bind failed' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'port_in_use',
      title: 'Port already in use',
      category: 'network',
      score,
      confidence: scoreToConfidence(score),
      specificity: 3,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /EADDRINUSE/i,
        /address already in use/i,
        /bind failed/i
      ]),
      summary: 'The process tried to bind to a port that is already occupied.'
    };
  }
};
