/**************************************************************************************************************************
 Copyright (c) 2026

     Name: mongodb.ts
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
export const mongodb: IssueDetector = {
  name: 'mongodb-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\bMongoNetworkError\b/i, weight: 45, label: 'MongoNetworkError' },
      { pattern: /\bAuthentication failed\b/i, weight: 40, label: 'Authentication failed' },
      { pattern: /\bmongodb\b|\bmongo\b/i, weight: 20, label: 'mongodb' },
      { pattern: /\b27017\b/, weight: 10, label: '27017' },
      {
        pattern: /\bfailed to connect to server\b/i,
        weight: 45,
        label: 'failed to connect to server'
      }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'mongodb_connection_error',
      title: 'MongoDB connection or authentication error',
      category: 'database',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\bMongoNetworkError\b/i,
        /\bAuthentication failed\b/i,
        /\bfailed to connect to server\b/i,
        /\bmongodb\b|\bmongo\b/i
      ]),
      summary: 'The application encountered a MongoDB connection or authentication failure.'
    };
  }
};
