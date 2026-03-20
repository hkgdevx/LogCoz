import { describe, expect, it } from 'vitest';
import { formatAnalyzeReport, formatExplanation } from '@/core/format';

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

describe('formatAnalyzeReport', () => {
  it('renders grouped analysis sections', () => {
    const output = formatAnalyzeReport({
      sources: [
        {
          id: 'redis',
          kind: 'docker-container',
          displayName: 'redis',
          serviceType: 'redis',
          raw: 'redis failed',
          metadata: { host: 'local' }
        }
      ],
      incidents: [
        {
          id: 'incident-1',
          issueType: 'redis_connection_refused',
          title: 'Redis connection refused',
          category: 'database',
          confidence: 0.9,
          sourceIds: ['redis'],
          sourceNames: ['redis'],
          serviceTypes: ['redis'],
          explanation: 'The application failed to connect to Redis.',
          evidence: ['redis'],
          likelyCauses: ['Redis is down'],
          suggestedFixes: ['Verify Redis is running'],
          relatedCorrelationKeys: {}
        }
      ],
      correlations: [],
      securityFindings: [],
      summary: {
        sourceCount: 1,
        incidentCount: 1,
        correlationCount: 0,
        securityFindingCount: 0,
        topIssueTitles: ['Redis connection refused'],
        nextActions: ['Verify Redis is running']
      }
    });

    expect(output).toContain('Discovered sources');
    expect(output).toContain('Top incidents');
    expect(output).toContain('Next actions');
  });
});
