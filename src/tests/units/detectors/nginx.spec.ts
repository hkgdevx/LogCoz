/**************************************************************************************************************************
 Copyright (c) 2026

     Name: nginx.spec.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { describe, expect, it } from 'vitest';
import { nginx } from '@/detectors/proxy/nginx';

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

describe('nginxDetector', () => {
  it('detects nginx upstream failures', () => {
    const log = `
connect() failed (111: Connection refused) while connecting to upstream
upstream prematurely closed connection while reading response header from upstream
502 Bad Gateway
`.trim();

    const result = nginx.detect(createContext(log));

    expect(result).not.toBeNull();
    expect(result?.type).toBe('nginx_upstream_failure');
    expect(result?.category).toBe('proxy');
  });
});
