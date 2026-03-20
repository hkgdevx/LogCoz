import { describe, expect, it } from 'vitest';
import { isCliEntrypoint } from '@/cli';

describe('cli entrypoint execution', () => {
  it('treats symlinked argv paths as the same entrypoint after realpath resolution', () => {
    const resolver = (input: string | null): string | null => {
      if (!input) return null;
      const normalized = input.replaceAll('\\', '/');
      if (normalized.includes('bin/logcoz')) return '/opt/logcoz/dist/cli.js';
      if (normalized.includes('opt/logcoz/dist/cli.js')) return '/opt/logcoz/dist/cli.js';
      return input;
    };

    expect(
      isCliEntrypoint(
        '/root/.nvm/versions/node/v24.14.0/bin/logcoz',
        'file:///C:/opt/logcoz/dist/cli.js',
        resolver
      )
    ).toBe(true);
  });
});
