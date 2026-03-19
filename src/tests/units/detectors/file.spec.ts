/**************************************************************************************************************************
 Copyright (c) 2026

     Name: file.spec.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { describe, expect, it } from 'vitest';
import { file } from '@/detectors/runtime/file';

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

describe('fileDetector', () => {
  it('detects missing file errors', () => {
    const log = `
Error: ENOENT: no such file or directory, open './config/production.json'
Cannot find module '/app/dist/main.js'
`.trim();

    const result = file.detect(createContext(log));

    expect(result).not.toBeNull();
    expect(result?.type).toBe('missing_file');
    expect(result?.category).toBe('filesystem');
  });
});
