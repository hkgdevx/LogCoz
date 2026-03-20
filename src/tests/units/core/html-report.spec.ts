import { describe, expect, it } from 'vitest';
import { renderAnalyzeHtmlReport, renderCorrelateHtmlReport } from '@/core/html-report';

describe('renderCorrelateHtmlReport', () => {
  it('renders a self-contained correlate report with incident details', () => {
    const html = renderCorrelateHtmlReport({
      schemaVersion: '1.0.0',
      cliName: 'logcozcli',
      cliVersion: '0.1.0',
      exitCode: 0,
      status: 'correlated',
      result: {
        count: 1,
        metadata: {
          filesAnalyzed: 2,
          sourceNames: ['api.log', 'nginx.log']
        },
        incidents: [
          {
            id: 'incident-1',
            title: 'Correlated incident: requestId:abc123',
            confidence: 0.92,
            sharedKeys: { requestId: 'abc123' },
            rootCauseHints: ['Redis request failed in app'],
            symptomHints: ['Nginx returned 502'],
            timeline: [
              {
                raw: 'raw line',
                message: 'failed to fetch Redis',
                timestamp: '2026-03-19T10:10:00Z',
                correlationKeys: {}
              }
            ]
          }
        ]
      }
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Correlation Report');
    expect(html).toContain('Correlated incident: requestId:abc123');
    expect(html).toContain('Shared keys');
    expect(html).toContain('Timeline');
    expect(html).toContain('Self-contained offline report');
    expect(html).toContain('overflow-wrap: anywhere;');
    expect(html).toContain('word-break: break-word;');
  });
});

describe('renderAnalyzeHtmlReport', () => {
  it('renders grouped runtime analysis sections', () => {
    const html = renderAnalyzeHtmlReport({
      schemaVersion: '1.0.0',
      cliName: 'logcozcli',
      cliVersion: '0.1.0',
      exitCode: 0,
      status: 'analyzed',
      result: {
        sources: [
          {
            id: 'redis',
            kind: 'docker-container',
            displayName: 'redis',
            serviceType: 'redis',
            raw: 'redis failure',
            metadata: { host: 'local', command: 'docker logs redis' }
          }
        ],
        incidents: [
          {
            id: 'incident-1',
            issueType: 'redis_connection_refused',
            title: 'Redis connection refused',
            category: 'database',
            confidence: 0.95,
            sourceIds: ['redis'],
            sourceNames: ['redis'],
            serviceTypes: ['redis'],
            explanation: 'The application could not connect to Redis.',
            evidence: ['Error: connect ECONNREFUSED'],
            likelyCauses: ['Redis is down'],
            suggestedFixes: ['Verify Redis is running'],
            relatedCorrelationKeys: { requestId: 'redis-123' }
          }
        ],
        correlations: [],
        securityFindings: [
          {
            title: 'Repeated authentication failures observed',
            severity: 'high',
            kind: 'posture',
            evidence: ['Failed password for invalid user root'],
            sourceIds: ['ssh'],
            recommendation: 'Review credentials and access attempts.'
          }
        ],
        summary: {
          sourceCount: 1,
          incidentCount: 1,
          correlationCount: 0,
          securityFindingCount: 1,
          topIssueTitles: ['Redis connection refused'],
          nextActions: ['Verify Redis is running']
        }
      }
    });

    expect(html).toContain('Runtime Analysis Report');
    expect(html).toContain('Discovered Sources');
    expect(html).toContain('Prioritized Incidents');
    expect(html).toContain('Security Findings');
    expect(html).toContain('Next Actions');
    expect(html).toContain('Repeated authentication failures observed');
    expect(html).toContain('overflow-wrap: anywhere;');
  });
});
