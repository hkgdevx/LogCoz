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

vi.mock('@/utils/file', async () => {
  const actual = await vi.importActual('@/utils/file');
  return {
    ...actual,
    readTextFile: vi.fn(),
    writeTextFile: vi.fn()
  };
});

describe('correlate command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('prints stable text output for a correlation fixture', async () => {
    const { readTextFile } = await import('@/utils/file');
    vi.mocked(readTextFile)
      .mockResolvedValueOnce(logFixtures.correlationApi)
      .mockResolvedValueOnce(logFixtures.correlationProxy);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { correlate } = await import('@/commands/correlate');

    await correlate(['api.log', 'nginx.log'], {});

    const text = logSpy.mock.calls.map((call) => String(call[0])).join('\n');
    expect(text).toContain('Correlated incident: requestId:abc123');
    expect(text).toContain('Shared keys');
    expect(text).toContain('Timeline:');
  });

  it('prints json envelope when --json is used', async () => {
    const { readTextFile } = await import('@/utils/file');
    vi.mocked(readTextFile)
      .mockResolvedValueOnce(logFixtures.correlationApi)
      .mockResolvedValueOnce(logFixtures.correlationProxy);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { correlate } = await import('@/commands/correlate');

    await correlate(['api.log', 'nginx.log'], { json: true });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload).toMatchObject({
      cliName: 'logcozcli',
      status: 'correlated',
      result: {
        count: 1
      }
    });
    expect(payload.result.incidents).toHaveLength(1);
  });

  it('writes a self-contained html report when --html-out is used', async () => {
    const { readTextFile, writeTextFile } = await import('@/utils/file');
    vi.mocked(readTextFile)
      .mockResolvedValueOnce(logFixtures.correlationApi)
      .mockResolvedValueOnce(logFixtures.correlationProxy);
    vi.mocked(writeTextFile).mockResolvedValueOnce();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { correlate } = await import('@/commands/correlate');

    await correlate(['api.log', 'nginx.log'], { htmlOut: 'reports/correlation.html' });

    expect(writeTextFile).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(writeTextFile).mock.calls[0]?.[1])).toContain('<!DOCTYPE html>');
    expect(String(vi.mocked(writeTextFile).mock.calls[0]?.[1])).toContain('Correlation Report');
    expect(logSpy).toHaveBeenCalledWith('HTML report written to reports/correlation.html');
  });

  it('fails when --json and --html-out are used together', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { correlate } = await import('@/commands/correlate');

    await correlate(['api.log', 'nginx.log'], { json: true, htmlOut: 'reports/correlation.html' });

    expect(errorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('fails when the html output path already exists and --force is not used', async () => {
    const { readTextFile, writeTextFile } = await import('@/utils/file');
    vi.mocked(readTextFile)
      .mockResolvedValueOnce(logFixtures.correlationApi)
      .mockResolvedValueOnce(logFixtures.correlationProxy);
    vi.mocked(writeTextFile).mockRejectedValueOnce(
      new Error(
        'Refusing to overwrite existing file: reports/correlation.html. Re-run with --force.'
      )
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { correlate } = await import('@/commands/correlate');

    await correlate(['api.log', 'nginx.log'], { htmlOut: 'reports/correlation.html' });

    expect(errorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('returns a success envelope with empty results when no incidents are found', async () => {
    const { readTextFile } = await import('@/utils/file');
    vi.mocked(readTextFile)
      .mockResolvedValueOnce(logFixtures.noIncidentsA)
      .mockResolvedValueOnce(logFixtures.noIncidentsB);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { correlate } = await import('@/commands/correlate');

    await correlate(['api.log', 'nginx.log'], { json: true });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.exitCode).toBe(0);
    expect(payload.result.count).toBe(0);
    expect(payload.result.incidents).toEqual([]);
  });
});
