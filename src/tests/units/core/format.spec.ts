import { describe, expect, it } from 'vitest';
import { formatExplanation } from '@/core/format';

describe('formatExplanation', () => {
  it('renders versioned header and optional confidence reasons', () => {
    const output = formatExplanation({
      issueType: 'unknown',
      title: 'Unknown issue',
      category: 'unknown',
      confidence: 0.3,
      explanation: 'No strong match.',
      evidence: ['line1'],
      likelyCauses: ['Unknown'],
      suggestedFixes: ['Inspect logs'],
      debugCommands: ['cat log.txt'],
      confidenceReasons: [{ label: 'fallback', impact: 0, source: 'heuristic' }]
    });

    expect(output).toContain('logcozcli');
    expect(output).toContain('Confidence reasons');
  });
});
