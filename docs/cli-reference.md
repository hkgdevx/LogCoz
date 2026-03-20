# CLI Reference

This page documents the current CLI surface as implemented.

The primary command name is `logcozcli`. `logcoz` remains a supported alias.

The in-terminal `--help` output now includes concrete examples for the root command and each major subcommand. This page remains the fuller written reference.

## Global Command

```bash
logcozcli --version
logcozcli --help
```

## `logcozcli explain <file>`

Analyze a file and explain the strongest detected issue.

```bash
logcozcli explain <file> [--json] [--context <files>] [--llm] [--llm-provider <provider>] [--llm-endpoint <url>] [--llm-model <model>] [--include-reasoning]
```

Examples:

```bash
logcozcli explain ./app.log
logcozcli explain ./app.log --json
logcozcli explain ./app.log --context .env,docker-compose.yml --include-reasoning
```

## `logcozcli explain docker`

Collect local Docker logs and run the same explanation pipeline.

```bash
logcozcli explain docker [--container <name-or-id>] [--service <service>] [--tail <n>] [--since <value>] [--json] [--context <files>] [--llm] [--llm-provider <provider>] [--llm-endpoint <url>] [--llm-model <model>] [--include-reasoning]
```

Key options:

- `--container <name-or-id>` select one container explicitly
- `--service <service>` filter by `postgres`, `redis`, `mongodb`, `nginx`, or similar service types
- `--tail <n>` limit collected lines, default `200`
- `--since <value>` pass a relative duration or timestamp to Docker log collection

Examples:

```bash
logcozcli explain docker --container api
logcozcli explain docker --service mongodb --tail 150
logcozcli explain docker --container api --json
```

## `logcozcli paste`

Read logs from stdin and explain the strongest detected issue.

```bash
logcozcli paste [--json] [--context <files>] [--llm] [--llm-provider <provider>] [--llm-endpoint <url>] [--llm-model <model>] [--include-reasoning]
```

Examples:

```bash
cat ./worker.log | logcozcli paste
cat ./worker.log | logcozcli paste --json
```

## `logcozcli correlate <files...>`

Correlate multiple files into incident groups.

```bash
logcozcli correlate <files...> [--json] [--html-out <file>] [--force]
```

Examples:

```bash
logcozcli correlate ./api.log ./worker.log ./nginx.log
logcozcli correlate ./api.log ./nginx.log --json
logcozcli correlate ./api.log ./nginx.log --html-out ./reports/correlation.html
```

## `logcozcli correlate docker`

Collect multiple Docker sources and optional system sources, annotate them by source, and run the correlation pipeline.

```bash
logcozcli correlate docker [--container <name-or-id...>] [--service <service...>] [--include-system] [--system-source <name...>] [--tail <n>] [--since <value>] [--json] [--html-out <file>] [--force]
```

Key behavior:

- runtime correlation requires at least 2 collected sources
- `--container` can be repeated to name multiple containers explicitly
- `--service` can be repeated to include multiple service classes
- `--include-system` adds local system-log sources to the same correlation run
- `--system-source` narrows the system side to sources such as `ssh`, `docker`, or `syslog`
- `--html-out <file>` writes a self-contained HTML report instead of terminal text
- `--force` allows replacing an existing HTML output file

Examples:

```bash
logcozcli correlate docker --container api --container nginx
logcozcli correlate docker --service app --service nginx --json
logcozcli correlate docker --container api --container nginx --include-system --system-source ssh
logcozcli correlate docker --container api --container nginx --include-system --html-out ./reports/runtime-correlation.html
```

## `logcozcli analyze`

Auto-discover local Docker and local system log sources, then return one grouped analysis report.

```bash
logcozcli analyze [--include-docker] [--include-system] [--include-services <services>] [--exclude-sources <sources>] [--container <name-or-id>] [--service <service>] [--tail <n>] [--since <value>] [--json] [--html-out <file>] [--force] [--llm] [--llm-provider <provider>] [--llm-endpoint <url>] [--llm-model <model>] [--include-reasoning]
```

Key behavior:

- if no include flags are passed, LogCoz searches both Docker and system sources
- if include flags are passed, only the requested source families are collected
- `--include-services <services>` narrows collection by discovered service type
- `--exclude-sources <sources>` removes named or id-matched sources from the grouped report
- `--container` and `--service` can be used to bias runtime collection toward a specific Docker target
- `--html-out <file>` writes a polished self-contained HTML report
- `--force` allows replacing an existing HTML report

Examples:

```bash
logcozcli analyze
logcozcli analyze --include-docker --json
logcozcli analyze --include-system --include-services ssh,system
logcozcli analyze --include-docker --include-system --tail 300 --since 2h --include-reasoning
logcozcli analyze --include-docker --include-system --html-out ./reports/analyze.html
```

## HTML Export Notes

- HTML export is available for `correlate`, `correlate docker`, and `analyze`
- HTML output is a single offline-friendly file with inline styling only
- `--json` and `--html-out` are mutually exclusive
- existing output files are not replaced unless `--force` is provided

## JSON Output

`explain --json`, `paste --json`, `correlate --json`, and `analyze --json` all emit stable envelopes.

`analyze --json` returns:

- `sources`
- `incidents`
- `correlations`
- `securityFindings`
- `summary`
- optional `metadata`

## Notes and Limits

- runtime collection is local-only in this version
- direct Kubernetes collection is not implemented yet
- correlation is deterministic and lightweight, not a full tracing backend
- security findings are evidence-based and are not a complete security audit
