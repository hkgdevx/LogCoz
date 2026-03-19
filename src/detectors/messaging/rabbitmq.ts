/**************************************************************************************************************************
 Copyright (c) 2026

     Name: rabbitmq.ts
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
export const rabbitmq: IssueDetector = {
  name: 'rabbitmq-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\bACCESS_REFUSED\b/i, weight: 45, label: 'ACCESS_REFUSED' },
      { pattern: /\bCONNECTION_FORCED\b/i, weight: 45, label: 'CONNECTION_FORCED' },
      { pattern: /\bamqp\b|\brabbitmq\b/i, weight: 20, label: 'rabbitmq' },
      { pattern: /\b5672\b/, weight: 10, label: '5672' },
      {
        pattern: /\bSocket closed abruptly during opening handshake\b/i,
        weight: 45,
        label: 'opening handshake failed'
      }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'rabbitmq_connection_error',
      title: 'RabbitMQ connection or broker error',
      category: 'messaging',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\bACCESS_REFUSED\b/i,
        /\bCONNECTION_FORCED\b/i,
        /\bSocket closed abruptly during opening handshake\b/i,
        /\bamqp\b|\brabbitmq\b/i
      ]),
      summary: 'The application encountered an AMQP or RabbitMQ connection failure.'
    };
  }
};
