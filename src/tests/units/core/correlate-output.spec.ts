import { describe, expect, it } from 'vitest';
import { createCorrelateOutputEnvelope } from '@/core/output';

describe('createCorrelateOutputEnvelope', () => {
  it('wraps incidents in the shared cli metadata envelope', () => {
    const envelope = createCorrelateOutputEnvelope({
      incidents: [],
      count: 0,
      metadata: { filesAnalyzed: 2 }
    });

    expect(envelope.cliName).toBe('logcozcli');
    expect(envelope.status).toBe('correlated');
    expect(envelope.result.count).toBe(0);
  });
});
