import { describe, expect, it } from 'vitest';
import { correlateLogs } from '@/correlation/correlate';

describe('correlateLogs', () => {
  it('groups related events and extracts hints', () => {
    const incidents = correlateLogs([
      '[api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed to fetch Redis',
      '[nginx] 2026-03-19T10:10:01Z WARN requestId=abc123 upstream returned 502'
    ]);

    expect(incidents).toHaveLength(1);
    expect(incidents[0]?.sharedKeys.requestId).toBe('abc123');
    expect(incidents[0]?.rootCauseHints.length).toBeGreaterThan(0);
    expect(incidents[0]?.metadata).toBeDefined();
  });
});
