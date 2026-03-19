import { describe, expect, it } from 'vitest';
import { createExplainOutputEnvelope } from '@/core/output';

describe('createExplainOutputEnvelope', () => {
  it('marks unknown detections with unknown exit status', () => {
    const envelope = createExplainOutputEnvelope({
      issueType: 'unknown',
      title: 'Unknown issue',
      category: 'unknown',
      confidence: 0.2,
      explanation: 'unknown',
      evidence: [],
      likelyCauses: ['Unknown'],
      suggestedFixes: ['Inspect logs'],
      debugCommands: ['cat log.txt']
    });

    expect(envelope.status).toBe('unknown');
    expect(envelope.exitCode).toBe(2);
  });
});
