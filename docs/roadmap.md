# Roadmap

This page separates current capabilities from near-term planned work.

## Implemented Today

Current user-facing functionality:

- log analysis from files with `explain`
- log analysis from stdin with `paste`
- multi-file incident grouping with `correlate`
- terminal and JSON output for `explain` and `paste`
- detector coverage for Redis, Postgres, DNS, timeouts, port conflicts, Nginx, Docker, and missing files
- lightweight context hints from env and Compose-like files
- shallow structured context hints from env, Compose, Kubernetes, and JSON config files
- best-effort redaction of common secrets
- opt-in LLM enhancement via mock and HTTP provider modes
- stable JSON envelope output for `explain` and `paste`
- cross-platform Linux and Windows debug-command support

## Next Best Features

These are the highest-value next steps after the current Phase 2 implementation.

### 1. Wire the LLM provider into the command path

The repository already contains a provider abstraction, including a mock provider, but the main `explain` and `paste` commands do not use it yet.

Target outcome:

- opt-in explanation enhancement
- explicit control via flag or environment
- clear fallback to deterministic rule-based output

### 2. Expand detector coverage

Priority additions:

- TLS and certificate failures
- out-of-memory and crash signatures
- Kubernetes pod and image-pull failures
- more databases and brokers such as MySQL, MongoDB, Kafka, and RabbitMQ

Target outcome:

- broader production failure coverage
- fewer `unknown` fallback results

### 3. Improve correlation quality

Current correlation groups by the first extracted key only.

Priority improvements:

- timestamp-aware ordering
- service and source attribution
- severity-aware grouping
- stronger distinction between root cause and symptom events

### 4. Stabilize machine-readable outputs

Priority improvements:

- documented JSON schemas
- machine-readable exit codes
- more predictable automation contracts

### 5. Add command-level fixture tests

Current tests cover detectors and selection logic well, but the CLI path needs better end-to-end confidence.

Priority improvements:

- fixture-based command tests
- golden-output verification
- regression tests for real-world logs

### 6. Deepen context ingestion

Move beyond regex-only hints toward structured parsing for:

- `.env`
- Compose files
- Kubernetes manifests
- app configuration files

### 7. Explain detector confidence

Expose why a detector matched strongly enough, for example:

- matched patterns
- score contribution
- helpful context boosts

This would make results easier to trust and debug.

## Not Yet a Priority

These may be useful later, but they are not the current recommended first moves:

- general plugin ecosystems
- broad external extension APIs
- nonessential internal refactors without user-facing impact
