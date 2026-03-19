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

vi.mock('@/utils/file', () => ({
  readTextFile: vi.fn()
}));

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
