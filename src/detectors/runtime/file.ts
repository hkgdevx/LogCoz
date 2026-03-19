/**************************************************************************************************************************
 Copyright (c) 2026

     Name: file.ts
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
export const file: IssueDetector = {
  name: 'file-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /ENOENT/i, weight: 45, label: 'ENOENT' },
      { pattern: /no such file or directory/i, weight: 40, label: 'no such file or directory' },
      { pattern: /Cannot find module/i, weight: 35, label: 'Cannot find module' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'missing_file',
      title: 'Missing file or path',
      category: 'filesystem',
      score,
      confidence: scoreToConfidence(score),
      specificity: 3,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /ENOENT/i,
        /no such file or directory/i,
        /Cannot find module/i
      ]),
      summary: 'The application tried to access a file, module, or path that does not exist.'
    };
  }
};
