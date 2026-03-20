import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readOptionalTextFile, readTextFile, writeTextFile } from '@/utils/file';

describe('file utils', () => {
  let tempDir = '';

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
  });

  it('reads required and optional files', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'logcoz-file-'));
    const filePath = path.join(tempDir, 'sample.log');
    await fs.writeFile(filePath, 'hello', 'utf8');

    await expect(readTextFile(filePath)).resolves.toBe('hello');
    await expect(readOptionalTextFile(path.join(tempDir, 'missing.log'))).resolves.toBeNull();
  });

  it('writes output files, creates parent directories, and protects existing files', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'logcoz-file-'));
    const filePath = path.join(tempDir, 'reports', 'report.html');

    await writeTextFile(filePath, '<html>one</html>');
    await expect(readTextFile(filePath)).resolves.toBe('<html>one</html>');

    await expect(writeTextFile(filePath, '<html>two</html>')).rejects.toThrow(
      'Refusing to overwrite existing file:'
    );

    await writeTextFile(filePath, '<html>two</html>', { force: true });
    await expect(readTextFile(filePath)).resolves.toBe('<html>two</html>');
  });
});
