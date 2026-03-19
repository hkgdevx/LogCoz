/**************************************************************************************************************************
 Copyright (c) 2026

     Name: extract.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { SIGNAL_PATTERNS } from '@/constants/signals';
import { DEFAULT_CONTEXT_LINES } from '@/constants/defaults';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function extractRelevantBlock(input: string, contextLines = DEFAULT_CONTEXT_LINES): string {
  const lines = input.split('\n');
  const hitIndexes = new Set<number>();

  lines.forEach((line, idx) => {
    if (SIGNAL_PATTERNS.some((pattern) => pattern.test(line))) {
      for (
        let i = Math.max(0, idx - contextLines);
        i <= Math.min(lines.length - 1, idx + contextLines);
        i++
      ) {
        hitIndexes.add(i);
      }
    }
  });

  if (hitIndexes.size === 0) {
    return lines.slice(-20).join('\n');
  }

  return [...hitIndexes]
    .sort((a, b) => a - b)
    .map((index) => lines[index])
    .join('\n');
}
