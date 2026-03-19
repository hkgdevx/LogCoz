/**************************************************************************************************************************
 Copyright (c) 2026

     Name: kafka.ts
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
export const kafka: IssueDetector = {
  name: 'kafka-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\bKafkaJSConnectionError\b/i, weight: 50, label: 'KafkaJSConnectionError' },
      { pattern: /\bLEADER_NOT_AVAILABLE\b/i, weight: 45, label: 'LEADER_NOT_AVAILABLE' },
      { pattern: /\bbroker.*not available\b/i, weight: 45, label: 'broker not available' },
      { pattern: /\bkafka\b/i, weight: 20, label: 'kafka' },
      { pattern: /\b9092\b/, weight: 10, label: '9092' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'kafka_broker_error',
      title: 'Kafka broker or connectivity error',
      category: 'messaging',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\bKafkaJSConnectionError\b/i,
        /\bLEADER_NOT_AVAILABLE\b/i,
        /\bbroker.*not available\b/i,
        /\bkafka\b/i
      ]),
      summary: 'The application could not reach a healthy Kafka broker or partition leader.'
    };
  }
};
