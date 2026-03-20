import { describe, expect, it } from 'vitest';
import { lineToEvent, parseTimestampFromLine, pickPrimaryCorrelationKey } from '@/correlation/keys';

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

  it('normalizes syslog-style timestamps for host events', () => {
    const event = lineToEvent(
      'Mar 20 08:04:24 host sshd[123]: Failed password for root from 2.57.121.69 port 40146 ssh2'
    );

    expect(event.timestamp).toContain('03-20T08:04:24');
  });

  it('classifies exact, partial, and missing timestamps', () => {
    expect(parseTimestampFromLine('2026-03-20T08:04:24Z something happened')).toMatchObject({
      normalized: '2026-03-20T08:04:24Z',
      status: 'exact'
    });

    expect(parseTimestampFromLine('Mar 20 08:04:24 host sshd[123]: failed')).toMatchObject({
      status: 'inferred-year'
    });

    expect(parseTimestampFromLine('08:04:24 worker crashed')).toMatchObject({
      status: 'inferred-date'
    });

    expect(parseTimestampFromLine('2026-03-20 backup completed')).toMatchObject({
      normalized: '2026-03-20T00:00:00',
      status: 'inferred-time'
    });

    expect(parseTimestampFromLine('no timestamp here')).toMatchObject({
      status: 'missing'
    });
  });
});
