import { afterEach, describe, expect, it, vi } from 'vitest';
import { logFixtures } from '@/tests/fixtures/logs';

vi.mock('ora', () => ({
  default: () => ({
    start: () => ({
      succeed: vi.fn(),
      fail: vi.fn()
    })
  })
}));

vi.mock('@/runtime/collect', () => ({
  collectDockerSources: vi.fn(async () => [
    {
      id: 'api',
      kind: 'docker-container',
      displayName: 'api',
      serviceType: 'app',
      raw: logFixtures.dockerRedisFailure,
      metadata: { host: 'local' }
    },
    {
      id: 'nginx',
      kind: 'docker-container',
      displayName: 'nginx',
      serviceType: 'nginx',
      raw: logFixtures.correlationProxy,
      metadata: { host: 'local' }
    }
  ]),
  collectCorrelationRuntimeSources: vi.fn(async () => [
    {
      id: 'api',
      kind: 'docker-container',
      displayName: 'api',
      serviceType: 'app',
      raw: logFixtures.correlationApi,
      metadata: { host: 'local' }
    },
    {
      id: 'nginx',
      kind: 'docker-container',
      displayName: 'nginx',
      serviceType: 'nginx',
      raw: logFixtures.correlationProxy,
      metadata: { host: 'local' }
    },
    {
      id: 'ssh',
      kind: 'system-log',
      displayName: 'ssh',
      serviceType: 'ssh',
      raw: logFixtures.sshFailure,
      metadata: { host: 'local' }
    }
  ]),
  annotateSourceForCorrelation: vi.fn((source) => `[${source.displayName}] ${source.raw}`)
}));

describe('docker runtime commands', () => {
  afterEach(() => {
    vi.clearAllMocks();
    process.exitCode = 0;
  });

  it('explains docker log sources', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { explainDocker } = await import('@/commands/explain-docker');

    await explainDocker({ container: 'api', json: true });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.result.issueType).toBe('redis_connection_refused');
    expect(payload.result.metadata.sourceCount).toBe(2);
  });

  it('correlates docker log sources', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { correlateDocker } = await import('@/commands/correlate-docker');

    await correlateDocker({
      json: true,
      container: ['api', 'nginx'],
      includeSystem: true,
      systemSource: 'ssh'
    });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.status).toBe('correlated');
    expect(payload.result.metadata.sourcesAnalyzed).toBe(3);
    expect(payload.result.metadata.sourceKinds).toContain('system-log');
  });

  it('fails when runtime correlation has only one source', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { collectCorrelationRuntimeSources } = await import('@/runtime/collect');
    vi.mocked(collectCorrelationRuntimeSources).mockResolvedValueOnce([
      {
        id: 'api',
        kind: 'docker-container',
        displayName: 'api',
        serviceType: 'app',
        raw: logFixtures.correlationApi,
        metadata: { host: 'local' }
      }
    ]);

    const { correlateDocker } = await import('@/commands/correlate-docker');

    await correlateDocker({ json: true, container: 'api' });

    expect(logSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
