/**************************************************************************************************************************
 Copyright (c) 2026

     Name: dns.spec.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { describe, expect, it } from 'vitest';
import { dns } from '@/detectors/network/dns';

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

describe('dnsDetector', () => {
  it('detects DNS resolution failures', () => {
    const log = `
Error: getaddrinfo ENOTFOUND redis-service
request failed because hostname could not be resolved
`.trim();

    const result = dns.detect(createContext(log));

    expect(result).not.toBeNull();
    expect(result?.type).toBe('dns_resolution_error');
  });
});
