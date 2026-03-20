# Development

This page covers the current local workflow and release setup for LogCoz.

## Prerequisites

- Node.js 20 or newer
- pnpm 9

## Local Setup

```bash
pnpm install
```

Useful scripts:

- `pnpm dev`
- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format`
- `pnpm test`
- `pnpm check`
- `pnpm smoke:packaged-cli`

The published package exposes both `logcozcli` and `logcoz`.

## Recommended Local Workflow

During development:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Before pushing:

```bash
pnpm check
pnpm build
```

Before publishing:

```bash
pnpm check
pnpm build
pnpm smoke:packaged-cli
pnpm publish --dry-run --no-git-checks --access public --registry https://registry.npmjs.org
```

## Build Output

Builds are produced with `tsup` and emit:

- a CLI bundle in `dist/cli.js`
- a library entry in `dist/index.js`
- TypeScript declarations
- source maps

`dist/cli.js` now includes a Node shebang so npm-installed global binaries execute correctly on Unix-like shells.

## Tests

The current Vitest suite covers:

- detector behavior
- core explanation and formatting helpers
- correlation helpers
- runtime collectors
- command-level JSON/text output behavior
- publish smoke checklist fixtures

## CI and Release

CI currently:

1. checks out the repo
2. installs dependencies with `pnpm install --frozen-lockfile`
3. runs `pnpm check`
4. runs `pnpm build`

Release automation:

1. checks out the successful CI commit from `main`
2. installs dependencies
3. builds
4. runs `pnpm smoke:packaged-cli`
5. opens a Changesets release PR or publishes

## Runtime Feature Notes

Runtime collection in the current implementation is local-only:

- Docker sources use the local `docker` CLI
- system sources use local journal/file access
- remote Docker, cloud log backends, and direct Kubernetes collection are deferred

## Documentation Expectations

When adding user-visible behavior:

- keep README and docs aligned to the actual command surface
- update examples when flags or output shapes change
- update fixture-backed smoke-check docs when release steps change
