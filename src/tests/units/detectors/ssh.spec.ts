import { describe, expect, it } from 'vitest';
import { detectIssue } from '@/core/detect';
import { explainIssue } from '@/core/explain';
import { ssh } from '@/detectors/runtime/ssh';

function createContext(normalized: string): DetectionContext {
  return { raw: normalized, normalized, lines: normalized.split('\n'), contextHints: [] };
}

describe('sshDetector', () => {
  it('detects ssh failed-password and preauth activity', () => {
    const result = ssh.detect(
      createContext(`Mar 20 08:04:24 host sshd[260815]: Connection closed by authenticating user root 157.66.144.16 port 55144 [preauth]
Mar 20 08:04:25 host sshd[260625]: Failed password for root from 2.57.121.69 port 40146 ssh2
Mar 20 08:04:25 host sshd[260625]: Connection reset by authenticating user root 2.57.121.69 port 40146 [preauth]`)
    );

    expect(result?.type).toBe('ssh_auth_failure');
    expect(result?.category).toBe('security');
  });

  it('wins the main detection pipeline for ssh probing logs', () => {
    const candidate = detectIssue(
      createContext(`Mar 20 08:04:24 host sshd[260815]: Connection closed by authenticating user root 157.66.144.16 port 55144 [preauth]
Mar 20 08:04:25 host sshd[260625]: Failed password for root from 2.57.121.69 port 40146 ssh2
Mar 20 08:04:25 host sshd[260625]: Connection reset by authenticating user root 2.57.121.69 port 40146 [preauth]`)
    );

    const explanation = explainIssue(candidate);

    expect(candidate.type).toBe('ssh_auth_failure');
    expect(explanation.title).toBe('SSH authentication failure or probing activity');
    expect(explanation.suggestedFixes[0]).toContain('Review SSH exposure');
  });
});
