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

vi.mock('@/utils/file', async () => {
  const actual = await vi.importActual('@/utils/file');
  return {
    ...actual,
    writeTextFile: vi.fn()
  };
});

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

  it('writes runtime correlation html output when requested', async () => {
    const { writeTextFile } = await import('@/utils/file');
    vi.mocked(writeTextFile).mockResolvedValueOnce();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { correlateDocker } = await import('@/commands/correlate-docker');

    await correlateDocker({
      container: ['api', 'nginx'],
      includeSystem: true,
      htmlOut: 'reports/runtime-correlation.html'
    });

    expect(writeTextFile).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(writeTextFile).mock.calls[0]?.[1])).toContain('Correlation Report');
    expect(logSpy).toHaveBeenCalledWith('HTML report written to reports/runtime-correlation.html');
  });

  it('fails when runtime correlation html and json output are both requested', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { correlateDocker } = await import('@/commands/correlate-docker');

    await correlateDocker({
      json: true,
      htmlOut: 'reports/runtime-correlation.html',
      container: ['api', 'nginx']
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
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
