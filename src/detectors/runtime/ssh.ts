/**************************************************************************************************************************
 Copyright (c) 2026

     Name: ssh.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { scoreToConfidence } from '@/detectors/shared/confidence';
import { pickEvidence } from '@/detectors/shared/evidence';
import { runPatternRules } from '@/detectors/shared/rules';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export const ssh: IssueDetector = {
  name: 'ssh-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\bsshd\b/i, weight: 20, label: 'sshd' },
      { pattern: /\bFailed password\b/i, weight: 40, label: 'Failed password' },
      { pattern: /\binvalid user\b/i, weight: 20, label: 'invalid user' },
      {
        pattern: /\bConnection closed by authenticating user\b/i,
        weight: 25,
        label: 'connection closed by authenticating user'
      },
      {
        pattern: /\bConnection reset by authenticating user\b/i,
        weight: 25,
        label: 'connection reset by authenticating user'
      },
      { pattern: /\[preauth\]/i, weight: 15, label: 'preauth' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'ssh_auth_failure',
      title: 'SSH authentication failure or probing activity',
      category: 'security',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\bFailed password\b/i,
        /\binvalid user\b/i,
        /\bConnection closed by authenticating user\b/i,
        /\bConnection reset by authenticating user\b/i,
        /\[preauth\]/i
      ]),
      summary:
        'The host is receiving failed SSH authentication attempts or pre-auth probing activity.'
    };
  }
};
