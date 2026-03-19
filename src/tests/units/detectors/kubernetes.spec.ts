import { describe, expect, it } from 'vitest';
import { kubernetes } from '@/detectors/container/kubernetes';

function createContext(normalized: string): DetectionContext {
  return { raw: normalized, normalized, lines: normalized.split('\n'), contextHints: [] };
}

describe('kubernetesDetector', () => {
  it('detects kubernetes workload failures', () => {
    const result = kubernetes.detect(
      createContext('pod api CrashLoopBackOff\nBack-off pulling image registry/app:latest')
    );

    expect(result?.type).toBe('kubernetes_workload_failure');
    expect(result?.category).toBe('orchestration');
  });
});
