import { describe, expect, it } from 'vitest';
import { redactSecrets } from '@/utils/redact';

describe('redactSecrets', () => {
  it('redacts common secret patterns', () => {
    const result = redactSecrets(
      'password=secret\ntoken: abc\nBearer tokenvalue\npostgres://user:pass@host/db'
    );

    expect(result).not.toContain('secret');
    expect(result).toContain('[REDACTED]');
  });
});
