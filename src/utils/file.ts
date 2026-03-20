/**************************************************************************************************************************
 Copyright (c) 2026

     Name: file.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import fs from 'node:fs/promises';
import path from 'node:path';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function readTextFile(path: string): Promise<string> {
  return fs.readFile(path, 'utf8');
}

export async function readOptionalTextFile(path: string): Promise<string | null> {
  try {
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

export async function readFromStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', reject);
  });
}

export async function writeTextFile(
  targetPath: string,
  contents: string,
  options: { force?: boolean } = {}
): Promise<void> {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  try {
    await fs.access(targetPath);
    if (!options.force) {
      throw new Error(`Refusing to overwrite existing file: ${targetPath}. Re-run with --force.`);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith('Refusing to overwrite existing file:')
    ) {
      throw error;
    }

    const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined;
    if (code !== 'ENOENT') {
      throw error;
    }
  }

  await fs.writeFile(targetPath, contents, 'utf8');
}
