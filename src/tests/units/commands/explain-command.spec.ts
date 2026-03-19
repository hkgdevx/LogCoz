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
  readTextFile: vi.fn().mockResolvedValue('Error: connect ECONNREFUSED 127.0.0.1:6379')
}));

describe('explain command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('prints json envelope for explain --json', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { explain } = await import('@/commands/explain');

    await explain('app.log', {
      json: true,
      llm: true,
      llmProvider: 'mock',
      includeReasoning: true
    });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.cliName).toBe('logcozcli');
    expect(payload.result.issueType).toBe('redis_connection_refused');
  });

  it('supports openai provider selection without breaking json output', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.OPENAI_API_KEY = 'test-key';
    const { explain } = await import('@/commands/explain');

    await explain('app.log', { json: true, llm: true, llmProvider: 'openai' });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.result.issueType).toBe('redis_connection_refused');
  });
});
