/**************************************************************************************************************************
 Copyright (c) 2026

     Name: tls.ts
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
export const tls: IssueDetector = {
  name: 'tls-detector',

  detect(ctx): DetectionCandidate | null {
    const rules = [
      { pattern: /\bcertificate verify failed\b/i, weight: 50, label: 'certificate verify failed' },
      { pattern: /\bself signed certificate\b/i, weight: 45, label: 'self signed certificate' },
      { pattern: /\bSSL routines\b/i, weight: 35, label: 'SSL routines' },
      {
        pattern: /\bUNABLE_TO_VERIFY_LEAF_SIGNATURE\b/i,
        weight: 45,
        label: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
      },
      { pattern: /\bCERT_HAS_EXPIRED\b/i, weight: 45, label: 'CERT_HAS_EXPIRED' },
      { pattern: /\bTLS\b/i, weight: 15, label: 'TLS' }
    ];

    const { score, matchedPatterns, confidenceReasons } = runPatternRules(ctx.normalized, rules);

    if (score < 40) return null;

    return {
      detector: this.name,
      type: 'tls_certificate_error',
      title: 'TLS or certificate validation error',
      category: 'security',
      score,
      confidence: scoreToConfidence(score),
      specificity: 4,
      matchedPatterns,
      confidenceReasons,
      evidence: pickEvidence(ctx.normalized, [
        /\bcertificate verify failed\b/i,
        /\bself signed certificate\b/i,
        /\bSSL routines\b/i,
        /\bUNABLE_TO_VERIFY_LEAF_SIGNATURE\b/i,
        /\bCERT_HAS_EXPIRED\b/i
      ]),
      summary: 'The application failed a TLS handshake or certificate validation step.'
    };
  }
};
