import { describe, expect, it } from 'vitest';
import { oom } from '@/detectors/runtime/oom';

function createContext(normalized: string): DetectionContext {
  return { raw: normalized, normalized, lines: normalized.split('\n'), contextHints: [] };
}

describe('oomDetector', () => {
  it('detects memory failures', () => {
    const result = oom.detect(createContext('FATAL ERROR: JavaScript heap out of memory'));

    expect(result?.type).toBe('out_of_memory_error');
  });
});
