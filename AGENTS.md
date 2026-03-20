# AGENTS.md

Guidance for AI coding agents contributing to LogCoz.

This file is intentionally narrow: it does not replace [CONTRIBUTING.md](CONTRIBUTING.md), [README.md](README.md), or [docs/roadmap.md](docs/roadmap.md). It tells agents how to operate safely inside the repo without creating avoidable maintainer cleanup.

## Read First

Before making changes, read:

1. [README.md](README.md) for current product scope and command surface
2. [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations
3. [docs/roadmap.md](docs/roadmap.md) for near-term priorities

If those sources conflict, prefer:

1. `README.md` for current user-visible behavior
2. `CONTRIBUTING.md` for contribution process
3. `docs/roadmap.md` for future-facing direction

## Scope Guardrails

LogCoz is currently:

- a local-first CLI
- focused on log explanation, correlation, grouped runtime analysis, and HTML reporting
- evidence-based in its recommendations and security findings

Do not silently expand the project into:

- remote Docker or cloud log backends unless explicitly requested
- direct Kubernetes collection unless explicitly requested
- vulnerability scanning, compliance, or audit tooling
- generic observability platform behavior outside the documented scope

If a proposed change clearly conflicts with the current README or roadmap, stop and ask for direction instead of guessing.

## Change Rules

Keep changes focused and minimal.

- do not mix unrelated refactors into feature or bug-fix work
- do not rename commands, flags, or output fields without an explicit request
- do not change public behavior silently when a documentation-only or test-only fix would be enough
- do not weaken detector specificity just to increase match volume
- prefer evidence-backed recommendations over speculative guidance

When changing behavior:

- update tests
- update help text if the command surface changed
- update docs when user-visible behavior changed
- add a changeset for user-visible published changes

## Branch Naming

When proposing or creating branches, follow the repo naming pattern:

- `feat/<short-topic>`
- `fix/<short-topic>`
- `docs/<short-topic>`
- `refactor/<short-topic>`
- `test/<short-topic>`
- `chore/<short-topic>`

Examples:

- `feat/recon-window-grouping`
- `fix/smtp-detector-false-positive`
- `docs/public-repo-prep`

Use lowercase and hyphenated topic names. Do not invent novel prefixes unless the maintainer explicitly asks for them.

## Runtime and Detector Guardrails

When touching detectors, correlation, analyze, or HTML reporting:

- avoid broad regex or string matches that create obvious false positives
- keep service classification specific
- preserve the distinction between incident findings and posture findings
- preserve the distinction between exact chronology and inferred chronology
- do not force untimed evidence into ordered timelines
- do not add recommendations that claim certainty the evidence does not support

For runtime collection:

- preserve the local-first model unless the task explicitly expands it
- keep source selection and filtering predictable
- do not introduce surprising auto-discovery behavior without docs and tests

## Packaging and CLI Guardrails

This repo publishes a CLI package. Be careful with:

- `bin` mappings
- shebang handling
- packaged tarball contents
- help output
- Windows and Linux/macOS CLI behavior

If packaging, install, or CLI entrypoint behavior changes:

- run `pnpm build`
- run `pnpm smoke:packaged-cli`
- verify the change does not break the published binary flow

## Validation Expectations

Prefer these checks based on change scope:

- docs-only: review links and examples for consistency
- code changes: `pnpm test`, `pnpm lint`, `pnpm typecheck`
- packaging or release changes: `pnpm build`, `pnpm smoke:packaged-cli`
- broad user-visible changes: `pnpm check`

Do not claim a change is complete if you did not run the relevant validation.

## Repository Hygiene

- never commit secrets, tokens, or private infrastructure data
- keep example logs and fixtures redacted or synthetic
- do not add generated files unless the repo already tracks them intentionally
- keep markdown and public-facing docs concise and accurate
- preserve existing file structure unless there is a clear reason to change it

## Pull Request Expectations

AI-generated contributions should make maintainer review easier, not harder.

Include:

- what changed
- why it changed
- what user-visible behavior changed, if any
- what docs/tests were updated
- what validation was run

If a change is large, split it into smaller, reviewable units when possible.
