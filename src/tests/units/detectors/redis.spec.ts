/**************************************************************************************************************************
 Copyright (c) 2026

     Name: redis.spec.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { describe, expect, it } from 'vitest';
import { redis } from '@/detectors/database/redis';

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

describe('redis', () => {
  it('detects Redis connection refused', () => {
    const log = `
Error: connect ECONNREFUSED 127.0.0.1:6379
[ioredis] Unhandled error event
`.trim();

    const result = redis.detect(createContext(log));

    expect(result).not.toBeNull();
    expect(result?.type).toBe('redis_connection_refused');
    expect(result?.category).toBe('database');
  });

  it('detects Redis auth error', () => {
    const log = `
ReplyError: WRONGPASS invalid username-password pair or user is disabled.
ReplyError: NOAUTH Authentication required.
`.trim();

    const result = redis.detect(createContext(log));

    expect(result).not.toBeNull();
    expect(result?.type).toBe('redis_auth_error');
  });
});
