import { afterEach, describe, expect, it, vi } from 'vitest';
import { logFixtures } from '@/tests/fixtures/logs';

const oraStart = vi.fn(() => ({
  succeed: vi.fn(),
  fail: vi.fn()
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: oraStart
  }))
}));

vi.mock('@/utils/file', () => ({
  readTextFile: vi.fn()
}));

import { explain } from '@/commands/explain';
import { readTextFile } from '@/utils/file';

describe('explain command', () => {
  afterEach(() => {
    vi.clearAllMocks();
    oraStart.mockImplementation(() => ({
      succeed: vi.fn(),
      fail: vi.fn()
    }));
    delete process.env.OPENAI_API_KEY;
    process.exitCode = 0;
  });

  it('prints stable text output for a redis fixture', async () => {
    vi.mocked(readTextFile).mockResolvedValue(logFixtures.redisConnection);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await explain('redis.log', { includeReasoning: true });

    const output = String(logSpy.mock.calls[0]?.[0]);
    expect(output).toContain('logcozcli');
    expect(output).toContain('Redis connection refused');
    expect(output).toContain('Confidence reasons');
  });

  it('prints json envelope for explain --json', async () => {
    vi.mocked(readTextFile).mockResolvedValue(logFixtures.redisConnection);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await explain('app.log', {
      json: true,
      llm: true,
      llmProvider: 'mock',
      includeReasoning: true
    });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload).toMatchObject({
      cliName: 'logcozcli',
      status: 'detected',
      result: {
        issueType: 'redis_connection_refused',
        title: 'Redis connection refused'
      }
    });
  });

  it('supports openai provider selection without breaking json output', async () => {
    vi.mocked(readTextFile).mockResolvedValue(logFixtures.redisConnection);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.OPENAI_API_KEY = 'test-key';

    await explain('app.log', { json: true, llm: true, llmProvider: 'openai' });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.result.issueType).toBe('redis_connection_refused');
  });
});
