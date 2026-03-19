# Architecture

This document describes the current LogCoz runtime flow as implemented today.

## Overview

The CLI has three entry points:

- `explain` reads a log file
- `paste` reads from stdin
- `correlate` groups events across multiple files

`explain` and `paste` share the same analysis pipeline. `correlate` uses a separate correlation pipeline.

## Analysis Pipeline

For `explain` and `paste`, the flow is:

1. Read raw text input from a file or stdin
2. Redact common secrets
3. Normalize the log text
4. Extract the most relevant block around known error signals
5. Load optional context hints from user-supplied files
6. Build a detection context
7. Run all registered detectors
8. Select the strongest candidate by score, specificity, and confidence
9. Convert the winning detection into an explanation object
10. Optionally enrich the explanation via the configured LLM provider
11. Format the result for terminal output or emit a structured JSON envelope

## Input Reading

- `logcoz explain <file>` reads a UTF-8 text file
- `logcoz paste` buffers stdin until the stream ends
- Empty stdin is treated as an error for `paste`

## Redaction

Redaction runs before normalization and detection. It currently applies regex replacements for:

- `password=...` or `password: ...`
- `token=...` or `token: ...`
- `secret=...` or `secret: ...`
- Bearer tokens
- Credentials inside Postgres and Redis URLs

This is best-effort redaction only. It does not parse every possible credential format.

## Normalization

Normalization removes ANSI escape sequences, converts Windows line endings to `\n`, replaces tabs with spaces, collapses very large blank-line runs, and trims the result.

This step helps detectors work on a cleaner and more uniform input shape.

## Relevant Block Extraction

The extractor scans the normalized log for signal patterns such as:

- `error`
- `exception`
- `ECONNREFUSED`
- `EADDRINUSE`
- `ENOENT`
- `ENOTFOUND`
- `502 Bad Gateway`
- `timeout`

When a signal is found, the extractor keeps a configurable number of surrounding lines on both sides. If nothing matches, it falls back to the last 20 lines of the input.

The current defaults are:

- `DEFAULT_CONTEXT_LINES = 6`
- `MAX_EVIDENCE_LINES = 5`
- `MIN_DETECTION_SCORE = 40`

## Context Hints

When `--context <files>` is passed, LogCoz reads each listed file and extracts lightweight hints. Current hint sources include:

- `REDIS_HOST=localhost`
- `REDIS_PORT=<number>`
- `DB_HOST=localhost`
- Compose-like service names
- Docker port mappings

Context hints are attached to the detection context. They are still lightweight, but the CLI now extracts hints from env files, Compose-like files, Kubernetes manifests, and JSON configs.

## Detection

LogCoz registers a fixed list of detectors:

- Docker
- Redis
- PostgreSQL
- Nginx
- Port conflicts
- Network timeouts
- DNS failures
- Missing files

Each detector:

- runs regex-based pattern rules against the normalized extracted block
- returns `null` if the score is below threshold
- returns a `DetectionCandidate` if it finds a strong enough match

The winning candidate is chosen by:

1. highest score
2. highest specificity
3. highest confidence

If no detector matches, LogCoz returns an `unknown` fallback issue.

## Explanation Generation

The explanation layer converts a detection into a stable human-facing structure:

- issue type
- title
- category
- confidence
- explanation text
- evidence lines
- likely causes
- suggested fixes
- debug commands
- optional metadata

This layer is deterministic and rule-based. It also carries optional `confidenceReasons` so the CLI can expose why a detector won when requested.

## Formatting

Terminal output uses `chalk` and `boxen` to render:

- a header
- issue summary
- confidence
- explanation
- evidence
- likely causes
- suggested fixes
- debug commands

If `--json` is passed, the CLI prints a structured envelope with schema metadata, CLI metadata, exit code, status, and the explanation result.

## Correlation Pipeline

`logcoz correlate <files...>` follows a separate flow:

1. Read all supplied files
2. Split into lines
3. Convert each line into a `LogEvent`
4. Extract correlation keys, timestamp, and log level where possible
5. Group by the first extracted correlation key
6. Return incident groups sorted by group size

Current supported correlation keys are:

- `traceId`
- `requestId`
- `correlationId`
- `jobId`

This is intentionally lightweight. It does not yet reason about time windows, service names, or causal ordering.

## LLM Provider Status

The repository now includes an active provider abstraction with:

- `NoopLlmProvider`
- `MockLlmProvider`
- `HttpLlmProvider`
- `OpenAiLlmProvider`

`explain` and `paste` can opt into provider-backed enhancement through CLI flags or environment variables. The deterministic explanation path remains the default behavior, and provider failures fall back to the base explanation with warnings.
