# LogCoz CLI

LogCoz CLI is a TypeScript command-line tool for diagnosing application and infrastructure failures from logs.

The primary binary is `logcozcli`. The legacy `logcoz` command is still supported as a compatibility alias.

## What It Does

LogCoz CLI reads logs from files or stdin, redacts common secrets, extracts the most relevant failure block, detects known issue patterns, optionally enriches the explanation through an opt-in LLM provider, and returns actionable debugging guidance.

It also correlates related events across multiple log files using request and trace identifiers.

## Current Capabilities

- `logcozcli explain <file>` for file-based analysis
- `logcozcli paste` for stdin-based analysis
- `logcozcli correlate <files...>` for multi-file incident grouping
- human-readable terminal output with versioned header
- stable JSON envelope output for `explain`, `paste`, and `correlate`
- Linux and Windows-oriented debug command suggestions
- opt-in LLM explanation enhancement via `mock`, `http`, or first-class OpenAI provider modes
- structured context hints from `.env`, Docker Compose, Kubernetes manifests, and JSON config files

## Supported Detectors

- Redis connection refused and auth errors
- PostgreSQL connection/auth errors
- MySQL connection/auth errors
- MongoDB connection/auth errors
- DNS resolution failures
- network timeout failures
- TLS and certificate errors
- port conflicts
- Nginx upstream failures
- Docker health-check, restart-loop, and generic container failures
- Kubernetes workload failures
- missing file/path failures
- out-of-memory failures
- Kafka broker/connectivity failures
- RabbitMQ/AMQP connection failures

See [docs/detectors.md](docs/detectors.md) for details.

## Installation

LogCoz CLI is published publicly on npm as `@hkgdevx/logcoz`.

Install globally with pnpm:

```bash
pnpm add -g @hkgdevx/logcoz
```

Or with npm:

```bash
npm install -g @hkgdevx/logcoz
```

After installation, use either:

- `logcozcli`
- `logcoz`

## Quick Start

Analyze a log file:

```bash
logcozcli explain ./app.log
```

Use the compatibility alias:

```bash
logcoz explain ./app.log
```

Analyze with context and confidence reasoning:

```bash
logcozcli explain ./app.log --context .env,docker-compose.yml,k8s.yaml --include-reasoning
```

Enable mock LLM enhancement:

```bash
logcozcli explain ./app.log --llm --llm-provider mock
```

Enable the OpenAI provider:

```bash
OPENAI_API_KEY=YOUR_API_KEY logcozcli explain ./app.log --llm --llm-provider openai --llm-model gpt-5-mini
```

Emit structured JSON:

```bash
logcozcli explain ./app.log --json
```

Correlate multiple logs:

```bash
logcozcli correlate ./api.log ./worker.log ./nginx.log
```

Correlate as JSON:

```bash
logcozcli correlate ./api.log ./worker.log ./nginx.log --json
```

## CLI Overview

### `logcozcli explain <file>`

Options:

- `--json`
- `--context <files>`
- `--llm`
- `--llm-provider <provider>`
- `--llm-endpoint <url>`
- `--llm-model <model>`
- `--include-reasoning`

### `logcozcli paste`

Options:

- `--json`
- `--context <files>`
- `--llm`
- `--llm-provider <provider>`
- `--llm-endpoint <url>`
- `--llm-model <model>`
- `--include-reasoning`

### `logcozcli correlate <files...>`

Options:

- `--json`

Correlates log events using `traceId`, `correlationId`, `requestId`, and `jobId`.

### Version

```bash
logcozcli --version
```

The normal terminal header also shows the current CLI version.

## JSON Output Contract

`explain --json`, `paste --json`, and `correlate --json` emit a stable envelope with:

- `schemaVersion`
- `cliName`
- `cliVersion`
- `exitCode`
- `status`
- `result`

For `explain` and `paste`, `result` contains the explanation payload, including optional `confidenceReasons` when `--include-reasoning` is enabled.

For `correlate`, `result` contains:

- `incidents`
- `count`
- optional command metadata

If correlation finds nothing, the CLI still returns a success envelope with an empty incident list.

## LLM Provider Configuration

Supported provider values:

- `mock`
- `http`
- `openai`

OpenAI configuration:

- `OPENAI_API_KEY` or `LOGCOZ_LLM_API_KEY`
- optional `LOGCOZ_OPENAI_BASE_URL` or `OPENAI_BASE_URL`
- `--llm-model` or `LOGCOZ_LLM_MODEL`

If the OpenAI provider is misconfigured or returns unusable output, LogCoz CLI falls back to the deterministic explanation and appends a warning instead of failing the command.

## Publishing

The package is intended for public npm publishing.

Release notes and versioning are managed with Changesets, and the primary release workflow publishes from GitHub Actions using an npm token secret.

Before the first public release, verify the target version is still free on npm:

```bash
npm view @hkgdevx/logcoz version --registry https://registry.npmjs.org
```

At the time of this repo update, the public registry returned `404` for `@hkgdevx/logcoz`, so `0.1.0` is available unless something is published later.

## Cross-Platform Notes

LogCoz CLI targets Node.js 20+ and supports Linux and Windows.

- file and stdin flows are platform-independent
- suggested debug commands adapt where platform differences matter
- examples in docs use both POSIX and PowerShell-friendly patterns where helpful

## Documentation

- [docs/architecture.md](docs/architecture.md)
- [docs/cli-reference.md](docs/cli-reference.md)
- [docs/detectors.md](docs/detectors.md)
- [docs/context-hints.md](docs/context-hints.md)
- [docs/correlation.md](docs/correlation.md)
- [docs/privacy-and-redaction.md](docs/privacy-and-redaction.md)
- [docs/examples.md](docs/examples.md)
- [docs/development.md](docs/development.md)
- [docs/context.md](docs/context.md)
- [docs/roadmap.md](docs/roadmap.md)

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

## License

MIT
