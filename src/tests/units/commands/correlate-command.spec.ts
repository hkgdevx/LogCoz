import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('ora', () => ({
  default: () => ({
    start: () => ({
      succeed: vi.fn(),
      fail: vi.fn()
    })
  })
}));

vi.mock('@/utils/file', () => ({
  readTextFile: vi.fn()
}));

describe('correlate command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('prints correlated incidents in text mode', async () => {
    const { readTextFile } = await import('@/utils/file');
    vi.mocked(readTextFile)
      .mockResolvedValueOnce('[api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed')
      .mockResolvedValueOnce('[nginx] 2026-03-19T10:10:01Z WARN requestId=abc123 upstream 502');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { correlate } = await import('@/commands/correlate');

    await correlate(['api.log', 'nginx.log'], {});

    expect(logSpy.mock.calls.some((call) => String(call[0]).includes('Correlated incident'))).toBe(
      true
    );
  });

  it('prints json envelope when --json is used', async () => {
    const { readTextFile } = await import('@/utils/file');
    vi.mocked(readTextFile)
      .mockResolvedValueOnce('[api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed')
      .mockResolvedValueOnce('[nginx] 2026-03-19T10:10:01Z WARN requestId=abc123 upstream 502');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { correlate } = await import('@/commands/correlate');

    await correlate(['api.log', 'nginx.log'], { json: true });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.cliName).toBe('logcozcli');
    expect(payload.status).toBe('correlated');
    expect(payload.result.count).toBe(1);
    expect(payload.result.incidents).toHaveLength(1);
  });

  it('returns a success envelope with empty results when no incidents are found', async () => {
    const { readTextFile } = await import('@/utils/file');
    vi.mocked(readTextFile).mockResolvedValueOnce('startup complete').mockResolvedValueOnce('ok');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { correlate } = await import('@/commands/correlate');

    await correlate(['api.log', 'nginx.log'], { json: true });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.exitCode).toBe(0);
    expect(payload.result.count).toBe(0);
    expect(payload.result.incidents).toEqual([]);
  });
});
