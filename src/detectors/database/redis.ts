/**************************************************************************************************************************
 Copyright (c) 2026

     Name: redis.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { runPatternRules } from '@/detectors/shared/rules';
import { pickEvidence } from '@/detectors/shared/evidence';
import { scoreToConfidence } from '@/detectors/shared/confidence';
import { extractHostPort } from '@/detectors/shared/metadata';

/**************************************************************************************************************************
 TYPES \ GLOBAL DEFINITIONS
***************************************************************************************************************************/
function getRedisContextBoost(hints: { key: string; value: string }[]): number {
  let boost = 0;

  const hasRedisService = hints.some(
    (hint) => hint.key === 'docker_service' && hint.value === 'redis'
  );
  const hasLocalhostRedis = hints.some(
    (hint) => hint.key === 'REDIS_HOST' && hint.value === 'localhost'
  );

  if (hasRedisService) boost += 10;
  if (hasLocalhostRedis) boost += 15;

  return boost;
}

function getRedisContextReasons(hints: ContextHint[]): ConfidenceReason[] {
  const reasons: ConfidenceReason[] = [];

  if (hints.some((hint) => hint.key === 'docker_service' && hint.value === 'redis')) {
    reasons.push({
      label: 'docker_service=redis',
      impact: 10,
      source: 'context'
    });
  }

  if (hints.some((hint) => hint.key === 'REDIS_HOST' && hint.value === 'localhost')) {
    reasons.push({
      label: 'REDIS_HOST=localhost',
      impact: 15,
      source: 'context'
    });
  }

  return reasons;
}

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export const redis: IssueDetector = {
  name: 'redis-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /ECONNREFUSED/i, weight: 40, label: 'ECONNREFUSED' },
      { pattern: /\bredis\b/i, weight: 25, label: 'redis' },
      { pattern: /\bioredis\b/i, weight: 20, label: 'ioredis' },
      { pattern: /\b6379\b/, weight: 10, label: '6379' },
      { pattern: /\bWRONGPASS\b/i, weight: 40, label: 'WRONGPASS' },
      { pattern: /\bNOAUTH\b/i, weight: 40, label: 'NOAUTH' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    const isAuth = matchedPatterns.includes('WRONGPASS') || matchedPatterns.includes('NOAUTH');

    const contextBoost = getRedisContextBoost(ctx.contextHints);
    const finalScore = score + contextBoost;
    const contextReasons = getRedisContextReasons(ctx.contextHints);

    return {
      detector: this.name,
      type: isAuth ? 'redis_auth_error' : 'redis_connection_refused',
      title: isAuth ? 'Redis authentication error' : 'Redis connection refused',
      category: 'database',
      score: finalScore,
      confidence: scoreToConfidence(finalScore),
      specificity: 4,
      matchedPatterns,
      confidenceReasons: [...confidenceReasons, ...contextReasons],
      evidence: pickEvidence(ctx.normalized, [
        /redis/i,
        /ioredis/i,
        /ECONNREFUSED/i,
        /WRONGPASS/i,
        /NOAUTH/i
      ]),
      summary: isAuth
        ? 'The application reached Redis but authentication failed.'
        : 'The application failed to connect to Redis.',
      metadata: extractHostPort(ctx.normalized)
    };
  }
};
