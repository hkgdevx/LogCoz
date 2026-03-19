/**************************************************************************************************************************
 Copyright (c) 2026

     Name: mysql.ts
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
export const mysql: IssueDetector = {
  name: 'mysql-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\bER_ACCESS_DENIED_ERROR\b/i, weight: 50, label: 'ER_ACCESS_DENIED_ERROR' },
      { pattern: /\bECONNREFUSED\b/i, weight: 25, label: 'ECONNREFUSED' },
      { pattern: /\bmysql\b/i, weight: 20, label: 'mysql' },
      { pattern: /\b3306\b/, weight: 10, label: '3306' },
      { pattern: /\bUnknown database\b/i, weight: 45, label: 'Unknown database' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'mysql_connection_error',
      title: 'MySQL connection or authentication error',
      category: 'database',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\bER_ACCESS_DENIED_ERROR\b/i,
        /\bUnknown database\b/i,
        /\bmysql\b/i,
        /\bECONNREFUSED\b/i
      ]),
      summary: 'The application encountered a MySQL connectivity or authentication problem.'
    };
  }
};
