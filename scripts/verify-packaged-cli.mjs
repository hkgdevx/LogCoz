/* global process */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    ...options
  });
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const tarCommand = process.platform === 'win32' ? 'tar.exe' : 'tar';

function getBinPath(prefixDir, name) {
  return process.platform === 'win32'
    ? path.join(prefixDir, name + '.cmd')
    : path.join(prefixDir, name);
}

const tempRoot = mkdtempSync(path.join(tmpdir(), 'logcoz-packaged-'));
const installPrefix = path.join(tempRoot, 'prefix');
const extractDir = path.join(tempRoot, 'extract');

try {
  mkdirSync(installPrefix, { recursive: true });
  mkdirSync(extractDir, { recursive: true });

  const packOutput = run(npmCommand, ['pack', '--silent']);
  const filename = packOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);

  if (!filename) {
    throw new Error('npm pack did not return a tarball filename.');
  }

  const tarballPath = path.resolve(filename);
  run(tarCommand, ['-xzf', tarballPath, '-C', extractDir]);

  const packedCliPath = path.join(extractDir, 'package', 'dist', 'cli.js');
  const cliContents = readFileSync(packedCliPath, 'utf8');
  if (!cliContents.startsWith('#!/usr/bin/env node')) {
    throw new Error('Packed dist/cli.js is missing the Node shebang.');
  }

  run(npmCommand, ['install', '--prefix', installPrefix, tarballPath]);

  const binDir = path.join(installPrefix, 'node_modules', '.bin');
  run(getBinPath(binDir, 'logcozcli'), ['--version']);
  run(getBinPath(binDir, 'logcoz'), ['--version']);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
