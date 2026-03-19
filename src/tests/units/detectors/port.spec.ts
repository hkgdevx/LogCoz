/**************************************************************************************************************************
 Copyright (c) 2026

     Name: port.spec.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { describe, expect, it } from 'vitest';
import { port } from '@/detectors/network/port';

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

describe('portDetector', () => {
  it('detects port already in use errors', () => {
    const log = `
Error: listen EADDRINUSE: address already in use :::3000
`.trim();

    const result = port.detect(createContext(log));

    expect(result).not.toBeNull();
    expect(result?.type).toBe('port_in_use');
  });
});
