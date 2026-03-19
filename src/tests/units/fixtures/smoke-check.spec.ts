import { describe, expect, it } from 'vitest';
import { prePublishSmokeChecks } from '@/tests/fixtures/smoke-check';

describe('prePublishSmokeChecks', () => {
  it('contains the documented launch smoke commands in order', () => {
    expect(prePublishSmokeChecks).toEqual([
      'pnpm check',
      'pnpm build',
      'npm pack --dry-run',
      'pnpm publish --dry-run --no-git-checks --access public --registry https://registry.npmjs.org'
    ]);
  });
});
