import { describe, expect, it } from 'vitest';
import { explainIssue } from '@/core/explain';

describe('explainIssue', () => {
  it('includes confidence reasons and metadata in explanation output', () => {
    const result = explainIssue({
      detector: 'tls-detector',
      type: 'tls_certificate_error',
      title: 'TLS or certificate validation error',
      category: 'security',
      confidence: 0.9,
      score: 90,
      specificity: 4,
      evidence: ['CERT_HAS_EXPIRED'],
      matchedPatterns: ['CERT_HAS_EXPIRED'],
      summary: 'tls failed',
      metadata: { host: 'api.internal' },
      confidenceReasons: [{ label: 'CERT_HAS_EXPIRED', impact: 45, source: 'pattern' }]
    });

    expect(result.debugCommands.length).toBeGreaterThan(0);
    expect(result.metadata).toEqual({ host: 'api.internal' });
    expect(result.confidenceReasons?.[0]?.label).toBe('CERT_HAS_EXPIRED');
  });
});
