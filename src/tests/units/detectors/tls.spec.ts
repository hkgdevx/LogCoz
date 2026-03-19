import { describe, expect, it } from 'vitest';
import { tls } from '@/detectors/network/tls';

function createContext(normalized: string): DetectionContext {
  return { raw: normalized, normalized, lines: normalized.split('\n'), contextHints: [] };
}

describe('tlsDetector', () => {
  it('detects certificate validation failures', () => {
    const result = tls.detect(createContext('Error: CERT_HAS_EXPIRED while connecting via TLS'));

    expect(result?.type).toBe('tls_certificate_error');
    expect(result?.category).toBe('security');
  });
});
