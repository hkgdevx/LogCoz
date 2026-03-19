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
  readFromStdin: vi.fn().mockResolvedValue('FATAL ERROR: JavaScript heap out of memory')
}));

describe('paste command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('prints formatted output for paste text mode', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { paste } = await import('@/commands/paste');

    await paste({ includeReasoning: true });

    expect(String(logSpy.mock.calls[0]?.[0])).toContain('logcozcli');
    expect(String(logSpy.mock.calls[0]?.[0])).toContain('Out-of-memory');
  });

  it('supports openai provider selection in json mode', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.OPENAI_API_KEY = 'test-key';
    const { paste } = await import('@/commands/paste');

    await paste({ json: true, llm: true, llmProvider: 'openai' });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.cliName).toBe('logcozcli');
    expect(payload.result.issueType).toBe('out_of_memory_error');
  });
});
