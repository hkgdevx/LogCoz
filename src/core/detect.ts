/**************************************************************************************************************************
 Copyright (c) 2026

     Name: detect.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { detectors } from '@/detectors';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
const getFallbackCandidate = (ctx: DetectionContext): DetectionCandidate => ({
  detector: 'unknown',
  type: 'unknown',
  title: 'Unknown issue',
  category: 'unknown',
  confidence: 0.3,
  score: 0,
  specificity: 0,
  evidence: ctx.lines.slice(0, 5),
  matchedPatterns: [],
  summary: 'No known issue pattern matched strongly enough.',
  confidenceReasons: []
});

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function detectIssue(ctx: DetectionContext): DetectionCandidate {
  const matches = detectors
    .map((detector) => detector.detect(ctx))
    .filter((candidate): candidate is DetectionCandidate => candidate !== null);

  if (matches.length === 0) {
    return getFallbackCandidate(ctx);
  }

  const best = matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.specificity !== a.specificity) return b.specificity - a.specificity;
    return b.confidence - a.confidence;
  })[0];

  if (!best) {
    return getFallbackCandidate(ctx);
  }

  return best;
}
