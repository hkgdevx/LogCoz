# Contributing to LogCoz

Thanks for contributing to LogCoz.

LogCoz is a local-first CLI for explaining logs, correlating incidents, and generating grouped runtime reports. Contributions are welcome, especially when they improve detection quality, runtime analysis, report clarity, packaging, and documentation.

## Before You Start

- Read [README.md](README.md) for the current command surface and scope.
- Read [docs/roadmap.md](docs/roadmap.md) for planned work.
- If you are using an AI coding agent, also follow [AGENTS.md](AGENTS.md).
- Open an issue first for large features or workflow changes so the shape of the change is agreed before implementation.
- Keep the current local-first scope in mind. Do not assume cloud backends, remote runtime collection, or broader security scanning are in scope unless the roadmap has moved there.

## Development Setup

Requirements:

- Node.js 20 or newer
- pnpm 9 or newer

Setup:

```bash
pnpm install
```

Common commands:

```bash
pnpm check
pnpm build
pnpm test
pnpm smoke:packaged-cli
```

Use `pnpm check` before opening a PR. If your change affects packaging, release behavior, or the installed CLI entrypoint, also run `pnpm smoke:packaged-cli`.

## Branch Naming

Use short, predictable branch names with a type prefix:

- `feat/<short-topic>` for new features
- `fix/<short-topic>` for bug fixes
- `docs/<short-topic>` for documentation-only changes
- `refactor/<short-topic>` for internal restructuring
- `test/<short-topic>` for test-only work
- `chore/<short-topic>` for tooling, CI, or maintenance work

Examples:

```bash
feat/runtime-source-ranking
fix/windows-packaged-cli-smoke
docs/open-source-contributing-guide
chore/dependabot-setup
```

Prefer lowercase words separated by hyphens. Keep branch names descriptive but short.

## What Good Contributions Look Like

- user-visible behavior changes include tests
- command-surface changes update help text and docs
- detector changes include representative fixtures or unit coverage
- report output changes include updated examples, tests, or sample output
- public-facing changes include a changeset when they affect published behavior

Try to keep changes focused. A detector improvement, a docs cleanup, and a packaging refactor should not usually be bundled into one PR.

## Changesets

Add a changeset for user-visible changes:

```bash
pnpm changeset
```

Changesets are expected for:

- new commands or flags
- detector behavior changes that affect output
- packaging or install behavior changes
- output contract changes

Changesets are usually not needed for:

- typo fixes
- internal refactors with no user-visible effect
- test-only changes

## Command, Detector, and Report Changes

If you add or change commands:

- update terminal help output
- update [README.md](README.md)
- update [docs/cli-reference.md](docs/cli-reference.md) or examples when relevant

If you add or change detectors:

- keep signatures specific enough to avoid broad false positives
- prefer evidence-based recommendations over speculative guidance
- add or update tests that show both positive and negative matches

If you change correlation, analyze, or HTML report behavior:

- update user-facing docs and examples
- add test coverage for the new output or grouping behavior
- include sample CLI output or screenshots in the PR when useful

## Pull Requests

PRs are reviewed on a best-effort basis. There is no guaranteed SLA.

Before opening a PR:

- use a branch name that follows the documented pattern
- make sure CI-relevant checks pass locally
- explain the problem and the user-visible impact
- note any tradeoffs or known gaps
- mention whether the change aligns with an existing roadmap milestone

Maintainers may ask for scope reduction if a PR tries to solve too many problems at once.

## Security

Do not report unpatched security vulnerabilities in public issues.

Use the process described in [SECURITY.md](SECURITY.md) instead.

## Code of Conduct

By participating in this project, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
