/**************************************************************************************************************************
 Copyright (c) 2026

     Name: detect.spec.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { describe, expect, it } from 'vitest';
import { detectIssue } from '@/core/detect';

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

describe('detectIssue', () => {
  it('returns fallback unknown issue when nothing matches', () => {
    const ctx = createContext('application started successfully');

    const result = detectIssue(ctx);

    expect(result.type).toBe('unknown');
    expect(result.category).toBe('unknown');
  });

  it('prefers more specific matched issue', () => {
    const ctx = createContext(
      `
Error: connect ECONNREFUSED 127.0.0.1:6379
[ioredis] Unhandled error event
timeout after 3000ms
`.trim()
    );

    const result = detectIssue(ctx);

    expect(result.type).toBe('redis_connection_refused');
  });
});
