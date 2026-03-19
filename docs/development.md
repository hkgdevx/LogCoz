# Development

This page covers the current local workflow and release setup for LogCoz.

## Prerequisites

- Node.js 20 or newer
- pnpm 9

## Local Setup

```bash
pnpm install
```

Useful scripts from `package.json`:

- `pnpm dev`
- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm format`
- `pnpm format:check`
- `pnpm test`
- `pnpm test:watch`
- `pnpm check`

The published package exposes both `logcozcli` and `logcoz` as binaries.

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

## Tests

The current test suite uses Vitest and focuses on:

- core detection selection
- detector behavior
- LLM provider scaffolding
- correlation helpers
- command-level output behavior

Coverage reporting is configured but disabled by default.

## Code Quality Tooling

The repository includes:

- ESLint
- Prettier
- Husky
- lint-staged
- Commitlint

This supports a conventional pre-commit and release workflow.

## Build Output

Builds are produced with `tsup` and emit:

- CLI output
- library entry point
- TypeScript declarations
- source maps

The output directory is `dist/`.

## CI

The CI workflow currently:

1. checks out the repo
2. installs dependencies with `pnpm install --frozen-lockfile`
3. runs `pnpm check`
4. runs `pnpm build`

This validates typechecking, linting, formatting, tests, and buildability on pull requests and pushes to `main`.

## Releases

Release automation uses Changesets and GitHub Actions.

Current release behavior:

- pushes to `main` trigger the release workflow
- `changesets/action` either opens a release PR or publishes
- publishing uses `pnpm publish --no-git-checks --access public --provenance`

## Public npm Publishing

The package is configured for public npm publishing:

- package name: `@hkgdevx/logcoz`
- publish access: `public`
- release automation authenticates with an npm token secret
- provenance is enabled in the GitHub Actions release workflow

Consumers can install directly from npm without any scope-specific `.npmrc` override. The package name remains `@hkgdevx/logcoz` even though the primary binary is `logcozcli`.

## Release Prerequisites

Repository maintainers should configure:

- `NPM_TOKEN` in GitHub repository secrets
- npm package access/ownership for the `@hkgdevx` scope

Before the first public release, verify whether `0.1.0` is still available on npm. If not, bump to the next patch version before publishing.

## Manual Publish Fallback

If a maintainer needs to verify packaging locally:

```bash
pnpm build
npm pack --dry-run
pnpm publish --dry-run --access public
```

If manual publish is ever needed outside CI, use an npm-authenticated session and keep provenance expectations in mind.

## LLM Provider Matrix

Current provider modes:

- `noop`
- `mock`
- `http`
- `openai`

OpenAI support uses the official SDK and the Responses API. Secrets should be supplied through environment variables rather than committed configuration.

## Documentation Expectations

When adding or changing behavior:

- keep README and docs aligned to the current CLI
- avoid documenting aspirational features as implemented
- add examples when user-visible behavior changes

## Recommended Near-Term Engineering Work

- add command-level fixture tests
- document and stabilize JSON output contracts
- expand detector coverage and confidence explanations
- continue deepening provider support, detector breadth, and output-contract stability
