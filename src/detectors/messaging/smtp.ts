/**************************************************************************************************************************
 Copyright (c) 2026

     Name: smtp.ts
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
export const smtp: IssueDetector = {
  name: 'smtp-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\b535 Authentication Failed\b/i, weight: 45, label: '535 Authentication Failed' },
      { pattern: /\bInvalid login\b/i, weight: 45, label: 'Invalid login' },
      { pattern: /\bSMTPAuthenticationError\b/i, weight: 45, label: 'SMTPAuthenticationError' },
      { pattern: /\b(nodemailer|smtp)\b/i, weight: 20, label: 'smtp' },
      { pattern: /\b(mail|email)\b/i, weight: 15, label: 'email' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'smtp_auth_error',
      title: 'SMTP or email authentication error',
      category: 'messaging',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\b535 Authentication Failed\b/i,
        /\bInvalid login\b/i,
        /\bSMTPAuthenticationError\b/i,
        /\b(nodemailer|smtp)\b/i,
        /\b(mail|email)\b/i
      ]),
      summary: 'The application could not authenticate with the configured SMTP or email provider.'
    };
  }
};
