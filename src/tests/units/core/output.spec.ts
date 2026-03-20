import { describe, expect, it } from 'vitest';
import { createAnalyzeOutputEnvelope, createExplainOutputEnvelope } from '@/core/output';

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

describe('createAnalyzeOutputEnvelope', () => {
  it('creates a stable analyzed envelope', () => {
    const envelope = createAnalyzeOutputEnvelope({
      sources: [],
      incidents: [],
      correlations: [],
      securityFindings: [],
      summary: {
        sourceCount: 0,
        incidentCount: 0,
        correlationCount: 0,
        securityFindingCount: 0,
        topIssueTitles: [],
        nextActions: []
      }
    });

    expect(envelope.status).toBe('analyzed');
    expect(envelope.exitCode).toBe(0);
  });
});
