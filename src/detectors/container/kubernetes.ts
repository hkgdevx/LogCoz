/**************************************************************************************************************************
 Copyright (c) 2026

     Name: kubernetes.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { runPatternRules } from '@/detectors/shared/rules';
import { pickEvidence } from '@/detectors/shared/evidence';
import { scoreToConfidence } from '@/detectors/shared/confidence';
import { extractServiceName } from '@/detectors/shared/metadata';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export const kubernetes: IssueDetector = {
  name: 'kubernetes-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\bImagePullBackOff\b/i, weight: 55, label: 'ImagePullBackOff' },
      { pattern: /\bErrImagePull\b/i, weight: 50, label: 'ErrImagePull' },
      { pattern: /\bCrashLoopBackOff\b/i, weight: 45, label: 'CrashLoopBackOff' },
      { pattern: /\bFailedScheduling\b/i, weight: 45, label: 'FailedScheduling' },
      { pattern: /\bBack-off pulling image\b/i, weight: 45, label: 'Back-off pulling image' },
      { pattern: /\bkubelet\b|\bpod\b|\bkubernetes\b/i, weight: 20, label: 'kubernetes runtime' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'kubernetes_workload_failure',
      title: 'Kubernetes workload failure',
      category: 'orchestration',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\bImagePullBackOff\b/i,
        /\bErrImagePull\b/i,
        /\bCrashLoopBackOff\b/i,
        /\bFailedScheduling\b/i,
        /\bBack-off pulling image\b/i
      ]),
      summary:
        'A Kubernetes workload failed due to scheduling, image retrieval, or restart issues.',
      metadata: {
        service: extractServiceName(ctx.normalized)
      }
    };
  }
};
