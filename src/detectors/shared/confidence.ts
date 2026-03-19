/**************************************************************************************************************************
 Copyright (c) 2026

     Name: confidence.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function scoreToConfidence(score: number): number {
  if (score >= 90) return 0.97;
  if (score >= 75) return 0.93;
  if (score >= 60) return 0.88;
  if (score >= 50) return 0.82;
  if (score >= 40) return 0.72;
  return 0.5;
}
