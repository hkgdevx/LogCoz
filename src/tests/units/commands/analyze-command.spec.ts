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
  collectRuntimeSources: vi.fn(async () => [
    {
      id: 'redis',
      kind: 'docker-container',
      displayName: 'redis',
      serviceType: 'redis',
      raw: logFixtures.dockerRedisFailure,
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
  annotateSourceForCorrelation: vi.fn((source) =>
    source.raw
      .split('\n')
      .map((line: string) => `[${source.displayName}] ${line}`)
      .join('\n')
  )
}));

vi.mock('@/utils/file', async () => {
  const actual = await vi.importActual('@/utils/file');
  return {
    ...actual,
    writeTextFile: vi.fn()
  };
});

describe('analyze command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('prints grouped terminal output for runtime analysis', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { analyze } = await import('@/commands/analyze');

    await analyze({ includeDocker: true, includeSystem: true });

    const text = String(logSpy.mock.calls[0]?.[0]);
    expect(text).toContain('Discovered sources');
    expect(text).toContain('Top incidents');
    expect(text).toContain('Security findings');
  });

  it('prints stable json output for analyze --json', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { analyze } = await import('@/commands/analyze');

    await analyze({ includeDocker: true, includeSystem: true, json: true });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload).toMatchObject({
      cliName: 'logcozcli',
      status: 'analyzed'
    });
    expect(payload.result.sources).toHaveLength(2);
    expect(payload.result.securityFindings.length).toBeGreaterThan(0);
  });

  it('writes an html report when --html-out is used', async () => {
    const { writeTextFile } = await import('@/utils/file');
    vi.mocked(writeTextFile).mockResolvedValueOnce();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { analyze } = await import('@/commands/analyze');

    await analyze({ includeDocker: true, includeSystem: true, htmlOut: 'reports/analyze.html' });

    expect(writeTextFile).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(writeTextFile).mock.calls[0]?.[1])).toContain('<!DOCTYPE html>');
    expect(String(vi.mocked(writeTextFile).mock.calls[0]?.[1])).toContain(
      'Runtime Analysis Report'
    );
    expect(logSpy).toHaveBeenCalledWith('HTML report written to reports/analyze.html');
  });

  it('fails when --json and --html-out are combined', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { analyze } = await import('@/commands/analyze');

    await analyze({
      includeDocker: true,
      includeSystem: true,
      json: true,
      htmlOut: 'reports/analyze.html'
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
