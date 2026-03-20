import { afterEach, describe, expect, it, vi } from 'vitest';

const execFileMock = vi.fn();

vi.mock('node:child_process', () => ({
  execFile: execFileMock
}));

vi.mock('@/utils/file', async () => {
  const actual = await vi.importActual('@/utils/file');
  return {
    ...actual,
    readOptionalTextFile: vi.fn()
  };
});

describe('runtime collectors', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('collects and classifies docker sources', async () => {
    execFileMock.mockImplementationOnce((_command, _args, _options, callback) => {
      callback(null, 'abc\tredis\tredis:7\ndef\tnginx\tnginx:1.25\n', '');
    });
    execFileMock.mockImplementationOnce((_command, args, _options, callback) => {
      if (String(args.at(-1)) === 'redis') {
        callback(null, '2026-03-19T10:10:00Z ERROR redis ECONNREFUSED', '');
        return;
      }
      callback(
        null,
        '[nginx] 2026-03-19T10:10:01Z WARN requestId=abc123 upstream returned 502',
        ''
      );
    });
    execFileMock.mockImplementationOnce((_command, args, _options, callback) => {
      if (String(args.at(-1)) === 'nginx') {
        callback(
          null,
          '[nginx] 2026-03-19T10:10:01Z WARN requestId=abc123 upstream returned 502',
          ''
        );
        return;
      }
      callback(null, '', '');
    });

    const { collectDockerSources } = await import('@/runtime/collect');
    const sources = await collectDockerSources({ service: ['redis', 'nginx'] });

    expect(sources).toHaveLength(2);
    expect(sources[0]?.serviceType).toBe('redis');
    expect(sources[0]?.metadata.command).toContain('docker logs');
  });

  it('falls back to system log files when journalctl has no output', async () => {
    execFileMock.mockImplementation((_command, _args, _options, callback) => {
      callback(new Error('missing'), '', '');
    });

    const { readOptionalTextFile } = await import('@/utils/file');
    vi.mocked(readOptionalTextFile)
      .mockResolvedValueOnce('Failed password for invalid user root')
      .mockResolvedValueOnce('systemd started service');

    const { collectSystemSources } = await import('@/runtime/collect');
    const sources = await collectSystemSources({});

    expect(sources).toHaveLength(2);
    expect(sources[0]?.kind).toBe('system-log');
  });

  it('collects mixed correlation sources with optional system logs', async () => {
    execFileMock.mockImplementation((command, args, _options, callback) => {
      if (command === 'docker' && args[0] === 'ps') {
        callback(null, 'abc\tapi\tapp:latest\ndef\tnginx\tnginx:1.25\n', '');
        return;
      }

      if (command === 'docker' && args[0] === 'logs' && String(args.at(-1)) === 'api') {
        callback(
          null,
          '[api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed to fetch Redis',
          ''
        );
        return;
      }

      if (command === 'docker' && args[0] === 'logs' && String(args.at(-1)) === 'nginx') {
        callback(
          null,
          '[nginx] 2026-03-19T10:10:01Z WARN requestId=abc123 upstream returned 502',
          ''
        );
        return;
      }

      if (command === 'journalctl') {
        callback(null, 'Mar 19 10:20:00 host sshd[123]: Failed password for invalid user root', '');
        return;
      }

      callback(new Error('unexpected call'), '', '');
    });

    const { collectCorrelationRuntimeSources } = await import('@/runtime/collect');
    const sources = await collectCorrelationRuntimeSources({
      container: ['api', 'nginx'],
      includeSystem: true,
      systemSource: 'ssh'
    });

    expect(sources).toHaveLength(3);
    expect(sources.map((source) => source.kind)).toContain('system-log');
  });
});
