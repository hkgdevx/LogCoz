# LogCoz CLI

LogCoz CLI is a TypeScript command-line tool for diagnosing application, container, and host-level failures from logs.

The primary binary is `logcozcli`. `logcoz` remains a supported compatibility alias.

## Current Capabilities

- `logcozcli explain <file>` for file-based analysis
- `logcozcli explain docker` for Docker log analysis
- `logcozcli paste` for stdin-based analysis
- `logcozcli correlate <files...>` for multi-file incident grouping
- `logcozcli correlate docker` for Docker correlation
- `logcozcli analyze` for grouped local Docker and system-log analysis
- self-contained HTML report export for `correlate`, `correlate docker`, and `analyze`
- stable JSON envelopes for `explain`, `paste`, `correlate`, and `analyze`
- structured context hints from `.env`, Docker Compose, Kubernetes manifests, and JSON config files
- evidence-based security findings for auth, TLS, SSH, and posture-style risks

## Supported Incident Coverage

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
- Kubernetes workload failures when those patterns appear in collected logs
- missing file/path failures
- out-of-memory failures
- Kafka broker/connectivity failures
- RabbitMQ/AMQP connection failures

See [docs/detectors.md](docs/detectors.md) for details.

## Installation

```bash
pnpm add -g @hkgdevx/logcoz
```

Or:

```bash
npm install -g @hkgdevx/logcoz
```

After installation, both commands work:

- `logcozcli`
- `logcoz`

## Help and Examples

`logcozcli --help` and each command-level `--help` page now include concrete examples directly in the terminal, so common workflows are discoverable without opening the docs.

## Quick Start

Explain a log file:

```bash
logcozcli explain ./app.log --context .env,docker-compose.yml --include-reasoning
```

Explain Docker container logs:

```bash
logcozcli explain docker --container api --tail 200 --json
```

Correlate multiple files:

```bash
logcozcli correlate ./api.log ./worker.log ./nginx.log --html-out ./reports/correlation.html
```

Correlate Docker containers:

```bash
logcozcli correlate docker --container api --container nginx --include-system --system-source ssh --html-out ./reports/runtime-correlation.html
```

Run grouped local analysis:

```bash
logcozcli analyze --include-docker --include-system --html-out ./reports/analyze.html
```

Use the OpenAI provider:

```bash
OPENAI_API_KEY=YOUR_API_KEY logcozcli explain ./app.log --llm --llm-provider openai --llm-model gpt-5-mini
```

## Runtime Scope

Runtime collection in the current release is local-only:

- Docker collection uses the local `docker` CLI
- system collection uses local journal/file access
- remote Docker contexts, cloud log backends, and direct Kubernetes collection are not included yet

Kubernetes patterns are still detected when they appear inside gathered logs.

## CLI Overview

### `logcozcli explain <file>`

- analyzes one file
- supports `--json`, `--context`, `--llm*`, and `--include-reasoning`

### `logcozcli explain docker`

- collects local Docker logs before running the normal explanation pipeline
- supports `--container`, `--service`, `--tail`, `--since`, `--json`, `--llm*`, and `--include-reasoning`

### `logcozcli paste`

- reads logs from stdin
- supports `--json`, `--context`, `--llm*`, and `--include-reasoning`

### `logcozcli correlate <files...>`

- correlates multiple files using extracted trace/request/job identifiers
- supports `--json`, `--html-out`, and `--force`

### `logcozcli correlate docker`

- collects multiple Docker sources and optional local system sources, then runs the correlation pipeline
- supports repeatable `--container`, repeatable `--service`, `--include-system`, `--system-source`, `--tail`, `--since`, `--json`, `--html-out`, and `--force`
- requires at least 2 collected runtime sources; single-source investigation belongs to `explain docker`

### `logcozcli analyze`

- auto-discovers local Docker and system sources
- returns one grouped incident report with sources, incidents, correlations, security findings, and next actions
- supports `--include-docker`, `--include-system`, `--include-services`, `--exclude-sources`, `--container`, `--service`, `--tail`, `--since`, `--json`, `--html-out`, `--force`, `--llm*`, and `--include-reasoning`

## HTML Report Export

For grouped workflows, you can export a polished self-contained HTML report that opens offline in any browser:

```bash
logcozcli correlate ./api.log ./nginx.log --html-out ./reports/correlation.html
logcozcli correlate docker --container api --container nginx --include-system --html-out ./reports/runtime-correlation.html
logcozcli analyze --include-docker --include-system --html-out ./reports/analyze.html
```

Notes:

- HTML export is available for `correlate`, `correlate docker`, and `analyze`
- `--json` and `--html-out` cannot be used together
- existing output files are protected unless you add `--force`
- the generated report is a single file with inline styling and no external assets

## JSON Output Contracts

All structured commands emit:

- `schemaVersion`
- `cliName`
- `cliVersion`
- `exitCode`
- `status`
- `result`

`analyze --json` additionally returns:

- `sources`
- `incidents`
- `correlations`
- `securityFindings`
- `summary`
- optional `metadata`

## Security Notes

Security findings are evidence-based and limited to the observed logs and lightweight context:

- auth failures
- TLS/certificate failures
- SSH anomalies
- repeated auth failures
- container localhost/service mismatch hints

This is not a vulnerability scanner, compliance tool, or full security audit product.

## Publishing

The package is intended for public npm publishing through GitHub Actions and Changesets.

Pre-publish smoke flow:

```bash
pnpm check
pnpm build
pnpm smoke:packaged-cli
pnpm publish --dry-run --no-git-checks --access public --registry https://registry.npmjs.org
```

`pnpm smoke:packaged-cli` builds, packs, installs the tarball into an isolated prefix, verifies the CLI shebang, and runs both installed binaries.

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
