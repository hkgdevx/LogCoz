# Project Context

This document is a working context guide for contributors and AI agents operating in the LogCoz repository.

## Product Shape

LogCoz is a Node.js 20+ TypeScript CLI for diagnosing log failures. The primary command is `logcozcli`; `logcoz` remains a compatibility alias.

User-facing flows:

- `explain <file>`
- `paste`
- `correlate <files...>`

## Core Runtime Model

For `explain` and `paste`, the runtime flow is:

1. read input
2. redact common secrets
3. normalize text
4. extract the relevant log block
5. load context hints
6. detect the strongest issue candidate
7. map the detection to an explanation
8. optionally enrich via an opt-in LLM provider
9. emit formatted text or structured JSON

## Important Conventions

- Keep the deterministic rule-based path as the default behavior.
- Treat the LLM layer as optional enhancement, never a required dependency for core diagnosis.
- Keep the provider matrix stable: `noop`, `mock`, `http`, and `openai`.
- Preserve cross-platform behavior for Linux and Windows.
- Keep public docs aligned to implemented behavior only.
- Prefer concise comments for non-obvious functions or heuristics instead of commenting trivial code.

## Detection Model

- detectors are registry-driven
- each detector is regex-based and score-driven
- confidence is heuristic, not probabilistic
- `confidenceReasons` should explain significant score contributions when exposed

When adding detectors:

- give them a unique issue type
- add explanation mappings
- add tests for detector success and any special behavior
- update docs and README summaries

## Output Contract

`explain --json`, `paste --json`, and `correlate --json` emit stable envelopes with schema/version metadata. Changes to those envelopes should be treated as public API changes and require docs and test updates.

## Testing Expectations

At minimum, changes should keep these areas covered:

- detectors
- core analysis helpers
- LLM provider behavior
- correlation helpers
- command-level output behavior

Run:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

## Release and Distribution Constraints

- package name stays `@hkgdevx/logcoz`
- package publishing is configured for public npm
- CLI binary branding is `logcozcli`
- compatibility alias `logcoz` should remain unless a deliberate breaking change is planned
- GitHub Actions release automation expects `NPM_TOKEN` and npm provenance support

## Documentation Rules

Whenever behavior changes:

- update `README.md`
- update the specific topic docs under `docs/`
- update this file if contributor/agent expectations changed

Avoid documenting roadmap items as already implemented.
