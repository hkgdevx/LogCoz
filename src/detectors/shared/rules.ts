/**************************************************************************************************************************
 Copyright (c) 2026

     Name: rules.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function runPatternRules(
  input: string,
  rules: PatternRule[]
): { score: number; matchedPatterns: string[]; confidenceReasons: ConfidenceReason[] } {
  let score = 0;
  const matchedPatterns: string[] = [];
  const confidenceReasons: ConfidenceReason[] = [];

  for (const rule of rules) {
    if (rule.pattern.test(input)) {
      score += rule.weight;
      matchedPatterns.push(rule.label);
      confidenceReasons.push({
        label: rule.label,
        impact: rule.weight,
        source: 'pattern'
      });
    }
  }

  return { score, matchedPatterns, confidenceReasons };
}
