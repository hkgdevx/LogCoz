/**************************************************************************************************************************
 Copyright (c) 2026

     Name: docker.spec.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 STANDARD IMPORTS
***************************************************************************************************************************/

/**************************************************************************************************************************
 USER DEFINED IMPORTS
***************************************************************************************************************************/
import { describe, expect, it } from 'vitest';
import { docker } from '@/detectors/container/docker';

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

describe('dockerDetector', () => {
  it('detects healthcheck failures', () => {
    const log = `
container app marked unhealthy
healthcheck failed: curl: (7) Failed to connect to localhost port 3000
`.trim();

    const result = docker.detect(createContext(log));

    expect(result).not.toBeNull();
    expect(result?.type).toBe('docker_healthcheck_failed');
    expect(result?.category).toBe('container');
  });

  it('detects restart loops', () => {
    const log = `
container app restarting
app exited with code 1
CrashLoopBackOff
`.trim();

    const result = docker.detect(createContext(log));

    expect(result).not.toBeNull();
    expect(result?.type).toBe('docker_restart_loop');
  });
});
