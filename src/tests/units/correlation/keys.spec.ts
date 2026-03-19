import { describe, expect, it } from 'vitest';
import { lineToEvent, pickPrimaryCorrelationKey } from '@/correlation/keys';

describe('correlation keys', () => {
  it('extracts service, level, timestamp, and correlation keys', () => {
    const event = lineToEvent(
      '[api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed to fetch dependency'
    );

    expect(event.service).toBe('api');
    expect(event.level).toBe('ERROR');
    expect(event.timestamp).toBe('2026-03-19T10:10:00Z');
    expect(event.correlationKeys.requestId).toBe('abc123');
  });

  it('picks the highest-priority correlation key', () => {
    const key = pickPrimaryCorrelationKey({
      raw: '',
      message: '',
      correlationKeys: { requestId: 'r1', traceId: 't1' }
    });

    expect(key).toEqual(['traceId', 't1']);
  });
});
