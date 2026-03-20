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
        },
        metadata: {
          discoveryMode: 'system-scan'
        }
      }
    });

    expect(html).toContain('System Scan Report');
    expect(html).toContain('Discovered Sources');
    expect(html).toContain('Prioritized Incidents');
    expect(html).toContain('Security Findings');
    expect(html).toContain('Next Actions');
    expect(html).toContain('Repeated authentication failures observed');
    expect(html).toContain('overflow-wrap: anywhere;');
  });

  it('renders a timeline-first recon report when reportMode is recon', () => {
    const html = renderAnalyzeHtmlReport({
      schemaVersion: '1.0.0',
      cliName: 'logcozcli',
      cliVersion: '0.1.0',
      exitCode: 0,
      status: 'analyzed',
      result: {
        sources: [
          {
            id: 'api',
            kind: 'docker-container',
            displayName: 'api',
            serviceType: 'app',
            raw: '[api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed to fetch Redis',
            metadata: { host: 'local', command: 'docker logs api' }
          }
        ],
        incidents: [
          {
            id: 'incident-1',
            issueType: 'redis_connection_refused',
            title: 'Redis connection refused',
            category: 'database',
            confidence: 0.95,
            sourceIds: ['api'],
            sourceNames: ['api'],
            serviceTypes: ['app'],
            explanation: 'The application could not connect to Redis.',
            evidence: ['2026-03-19T10:10:00Z ERROR requestId=abc123 failed to fetch Redis'],
            likelyCauses: ['Redis is down'],
            suggestedFixes: ['Verify Redis is running'],
            relatedCorrelationKeys: { requestId: 'abc123' }
          }
        ],
        correlations: [
          {
            id: 'corr-1',
            title: 'Correlated incident: requestId:abc123',
            confidence: 0.9,
            sharedKeys: { requestId: 'abc123' },
            timeline: [
              {
                raw: '[api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed to fetch Redis',
                message: '[api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed to fetch Redis',
                timestamp: '2026-03-19T10:10:00Z',
                level: 'ERROR',
                service: 'api',
                correlationKeys: { requestId: 'abc123' }
              }
            ],
            rootCauseHints: ['failed to fetch Redis'],
            symptomHints: [],
            metadata: { services: ['api'] }
          }
        ],
        securityFindings: [],
        summary: {
          sourceCount: 1,
          incidentCount: 1,
          correlationCount: 1,
          securityFindingCount: 0,
          topIssueTitles: ['Redis connection refused'],
          nextActions: ['Verify Redis is running']
        },
        metadata: {
          discoveryMode: 'system-scan',
          reportMode: 'recon',
          serviceTypesDiscovered: ['app']
        }
      }
    });

    expect(html).toContain('Timeline Recon');
    expect(html).toContain('10:10:00 to 10:10:00');
    expect(html).toContain('Linked findings: Redis connection refused');
    expect(html).toContain('Recommended actions');
  });

  it('labels inferred chronology for partial timestamps in recon reports', () => {
    const html = renderAnalyzeHtmlReport({
      schemaVersion: '1.0.0',
      cliName: 'logcozcli',
      cliVersion: '0.1.0',
      exitCode: 0,
      status: 'analyzed',
      result: {
        sources: [],
        incidents: [
          {
            id: 'incident-date-only',
            issueType: 'ssh_auth_failure',
            title: 'SSH authentication failure or probing activity',
            category: 'security',
            confidence: 0.9,
            sourceIds: ['ssh'],
            sourceNames: ['ssh'],
            serviceTypes: ['ssh'],
            explanation: 'The host is seeing failed SSH logins.',
            evidence: [
              '2026-03-20 failed password for root',
              '08:04:24 connection reset by authenticating user root'
            ],
            likelyCauses: ['Brute-force scanning'],
            suggestedFixes: ['Review SSH exposure'],
            relatedCorrelationKeys: {}
          }
        ],
        correlations: [],
        securityFindings: [],
        summary: {
          sourceCount: 0,
          incidentCount: 1,
          correlationCount: 0,
          securityFindingCount: 0,
          topIssueTitles: ['SSH authentication failure or probing activity'],
          nextActions: ['Review SSH exposure']
        },
        metadata: {
          reportMode: 'recon'
        }
      }
    });

    expect(html).toContain('Some timeline entries use inferred chronology');
    expect(html).toContain('Partial chronology');
    expect(html).toContain('Inferred time');
    expect(html).toContain('Inferred date');
  });

  it('falls back to the standard analyze layout when recon chronology cannot be constructed', () => {
    const html = renderAnalyzeHtmlReport({
      schemaVersion: '1.0.0',
      cliName: 'logcozcli',
      cliVersion: '0.1.0',
      exitCode: 0,
      status: 'analyzed',
      result: {
        sources: [],
        incidents: [
          {
            id: 'incident-1',
            issueType: 'unknown',
            title: 'Unknown issue',
            category: 'unknown',
            confidence: 0.5,
            sourceIds: ['syslog'],
            sourceNames: ['syslog'],
            serviceTypes: ['system'],
            explanation: 'No strong match.',
            evidence: ['line without timestamp'],
            likelyCauses: ['Unknown'],
            suggestedFixes: ['Inspect logs'],
            relatedCorrelationKeys: {}
          }
        ],
        correlations: [],
        securityFindings: [],
        summary: {
          sourceCount: 0,
          incidentCount: 1,
          correlationCount: 0,
          securityFindingCount: 0,
          topIssueTitles: ['Unknown issue'],
          nextActions: ['Inspect logs']
        },
        metadata: {
          reportMode: 'recon'
        }
      }
    });

    expect(html).toContain('Recon chronology could not be constructed');
    expect(html).toContain('Prioritized Incidents');
    expect(html).toContain('Correlations');
  });
});
