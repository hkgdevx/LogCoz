/**************************************************************************************************************************
 Copyright (c) 2026

     Name: docker.ts
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
export const docker: IssueDetector = {
  name: 'docker-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\bhealthcheck\b/i, weight: 20, label: 'healthcheck' },
      { pattern: /\bunhealthy\b/i, weight: 45, label: 'unhealthy' },
      { pattern: /\brestarting\b/i, weight: 40, label: 'restarting' },
      { pattern: /\bexited with code\b/i, weight: 35, label: 'exited with code' },
      { pattern: /\bcontainer\b/i, weight: 10, label: 'container' },
      { pattern: /\bdocker\b/i, weight: 10, label: 'docker' },
      {
        pattern: /\bBack-off restarting failed container\b/i,
        weight: 45,
        label: 'back-off restart'
      },
      { pattern: /\bCrashLoopBackOff\b/i, weight: 50, label: 'CrashLoopBackOff' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    const isHealthcheck =
      matchedPatterns.includes('unhealthy') || matchedPatterns.includes('healthcheck');
    const isRestartLoop =
      matchedPatterns.includes('restarting') ||
      matchedPatterns.includes('back-off restart') ||
      matchedPatterns.includes('CrashLoopBackOff');

    let type = 'docker_container_failure';
    let title = 'Docker container failure';
    let summary = 'The container encountered a runtime failure.';

    if (isHealthcheck) {
      type = 'docker_healthcheck_failed';
      title = 'Docker container health check failed';
      summary = 'The container is running or starting, but failed its health check.';
    } else if (isRestartLoop) {
      type = 'docker_restart_loop';
      title = 'Docker container restart loop';
      summary = 'The container is repeatedly crashing and restarting.';
    }

    return {
      detector: this.name,
      type,
      title,
      category: 'container',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\bunhealthy\b/i,
        /\brestarting\b/i,
        /\bexited with code\b/i,
        /\bhealthcheck\b/i,
        /\bCrashLoopBackOff\b/i,
        /\bBack-off restarting failed container\b/i
      ]),
      summary
    };
  }
};
