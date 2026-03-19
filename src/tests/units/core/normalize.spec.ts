import { describe, expect, it } from 'vitest';
import { normalizeLog } from '@/core/normalize';

describe('normalizeLog', () => {
  it('removes ansi sequences and normalizes whitespace', () => {
    const input = '\u001b[31mError\u001b[0m\r\n\tline\n\n\nnext';

    expect(normalizeLog(input)).toBe('Error\n  line\n\nnext');
  });
});
