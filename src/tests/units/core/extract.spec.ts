import { describe, expect, it } from 'vitest';
import { extractRelevantBlock } from '@/core/extract';

describe('extractRelevantBlock', () => {
  it('extracts lines around matching signals', () => {
    const input = ['line1', 'line2', 'error here', 'line4', 'line5'].join('\n');
    const result = extractRelevantBlock(input, 1);

    expect(result).toContain('line2');
    expect(result).toContain('error here');
    expect(result).toContain('line4');
  });

  it('falls back to trailing lines when no signal matches', () => {
    const input = Array.from({ length: 30 }, (_, i) => `line-${i}`).join('\n');
    const result = extractRelevantBlock(input);

    expect(result).toContain('line-29');
    expect(result).not.toContain('line-0');
  });
});
