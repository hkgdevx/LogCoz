import { describe, expect, it } from 'vitest';
import { smtp } from '@/detectors/messaging/smtp';
import { detectIssue } from '@/core/detect';
import { explainIssue } from '@/core/explain';

function createContext(normalized: string): DetectionContext {
  return { raw: normalized, normalized, lines: normalized.split('\n'), contextHints: [] };
}

describe('smtpDetector', () => {
  it('detects smtp authentication failures', () => {
    const result = smtp.detect(
      createContext(
        "Error sending order email Error: Invalid login: 535 Authentication Failed\nresponse: '535 Authentication Failed'"
      )
    );

    expect(result?.type).toBe('smtp_auth_error');
  });

  it('wins the overall detection pipeline for smtp auth logs', () => {
    const candidate = detectIssue(
      createContext(
        "Error sending order email Error: Invalid login: 535 Authentication Failed\nresponse: '535 Authentication Failed'"
      )
    );

    const explanation = explainIssue(candidate);

    expect(candidate.type).toBe('smtp_auth_error');
    expect(explanation.title).toBe('SMTP or email authentication error');
    expect(explanation.suggestedFixes[0]).toContain(
      'Verify SMTP host, port, username, and password'
    );
  });
});
