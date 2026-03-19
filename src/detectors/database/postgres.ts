/**************************************************************************************************************************
 Copyright (c) 2026

     Name: postgres.ts
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
export const postgres: IssueDetector = {
  name: 'postgres-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      {
        pattern: /password authentication failed/i,
        weight: 50,
        label: 'password authentication failed'
      },
      {
        pattern: /database .* does not exist/i,
        weight: 45,
        label: 'database does not exist'
      },
      {
        pattern: /Connection terminated unexpectedly/i,
        weight: 40,
        label: 'Connection terminated unexpectedly'
      },
      {
        pattern: /\bpostgres\b|\bpostgresql\b/i,
        weight: 20,
        label: 'postgres'
      },
      {
        pattern: /\b5432\b/,
        weight: 10,
        label: '5432'
      }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'postgres_connection_error',
      title: 'PostgreSQL connection or authentication error',
      category: 'database',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /password authentication failed/i,
        /database .* does not exist/i,
        /Connection terminated unexpectedly/i,
        /postgres/i
      ]),
      summary: 'The application encountered a PostgreSQL connection problem.'
    };
  }
};
