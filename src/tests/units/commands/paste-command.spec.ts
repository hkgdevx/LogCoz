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

vi.mock('@/utils/file', async () => {
  const actual = await vi.importActual('@/utils/file');
  return {
    ...actual,
    readFromStdin: vi.fn()
  };
});

import { paste } from '@/commands/paste';
import { readFromStdin } from '@/utils/file';

describe('paste command', () => {
  afterEach(() => {
    vi.clearAllMocks();
    oraStart.mockImplementation(() => ({
      succeed: vi.fn(),
      fail: vi.fn()
    }));
    delete process.env.OPENAI_API_KEY;
    process.exitCode = 0;
  });

  it('prints stable text output for an oom fixture', async () => {
    vi.mocked(readFromStdin).mockResolvedValue(logFixtures.oomFailure);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await paste({ includeReasoning: true });

    const output = String(logSpy.mock.calls[0]?.[0]);
    expect(output).toContain('Out-of-memory');
    expect(output).toContain('Likely causes');
  });

  it('prints stable json output for paste --json', async () => {
    vi.mocked(readFromStdin).mockResolvedValue(logFixtures.oomFailure);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await paste({ json: true, includeReasoning: true });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload).toMatchObject({
      cliName: 'logcozcli',
      result: {
        issueType: 'out_of_memory_error',
        title: 'Out-of-memory or memory pressure failure'
      }
    });
  });

  it('supports openai provider selection in json mode', async () => {
    vi.mocked(readFromStdin).mockResolvedValue(logFixtures.oomFailure);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.OPENAI_API_KEY = 'test-key';

    await paste({ json: true, llm: true, llmProvider: 'openai' });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.cliName).toBe('logcozcli');
    expect(payload.result.issueType).toBe('out_of_memory_error');
  });
});
