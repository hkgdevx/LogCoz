/**************************************************************************************************************************
 Copyright (c) 2026

     Name: timeout.spec.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { describe, expect, it } from 'vitest';
import { timeout } from '@/detectors/network/timeout';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
function createContext(normalized: string): DetectionContext {
  return {
    raw: normalized,
    normalized,
    lines: normalized.split('\n'),
    contextHints: []
  };
}

describe('timeoutDetector', () => {
  it('detects timeout issues', () => {
    const log = `
Error: connect ETIMEDOUT 10.0.0.25:5432
request timed out after 30000ms
`.trim();

    const result = timeout.detect(createContext(log));

    expect(result).not.toBeNull();
    expect(result?.type).toBe('network_timeout');
    expect(result?.category).toBe('network');
  });
});
