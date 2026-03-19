/**************************************************************************************************************************
 Copyright (c) 2026

     Name: postgres.spec.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { describe, expect, it } from 'vitest';
import { postgres } from '@/detectors/database/postgres';

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

describe('postgresDetector', () => {
  it('detects postgres auth or connection problems', () => {
    const log = `
error: password authentication failed for user "appuser"
Connection terminated unexpectedly
`.trim();

    const result = postgres.detect(createContext(log));

    expect(result).not.toBeNull();
    expect(result?.type).toBe('postgres_connection_error');
    expect(result?.category).toBe('database');
  });
});
