/* global URL, console, fetch, process */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Skip duplicate npm publishes when Changesets falls back to direct publish
 * on main with no pending changeset files.
 */
async function main() {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const packageName = packageJson.name;
  const packageVersion = packageJson.version;
  const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(
    packageName
  )}/${packageVersion}`;

  const response = await fetch(registryUrl);

  if (response.status === 200) {
    console.log(`Skipping publish because ${packageName}@${packageVersion} already exists on npm.`);
    return;
  }

  if (response.status !== 404) {
    throw new Error(
      `Unexpected npm registry response ${response.status} for ${packageName}@${packageVersion}.`
    );
  }

  execFileSync('pnpm', ['publish', '--no-git-checks', '--access', 'public', '--provenance'], {
    stdio: 'inherit'
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
