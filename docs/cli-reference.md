# CLI Reference

This page documents the current CLI surface as implemented.

The primary command name is `logcozcli`. `logcoz` remains a supported alias.

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

## `logcozcli paste`

Read logs from stdin and explain the strongest detected issue.

```bash
logcozcli paste [--json] [--context <files>] [--llm] [--llm-provider <provider>] [--llm-endpoint <url>] [--llm-model <model>] [--include-reasoning]
```

## `logcozcli correlate <files...>`

Correlate multiple files into incident groups.

```bash
logcozcli correlate <files...> [--json]
```

## `logcozcli correlate docker`

Collect multiple Docker sources and optional system sources, annotate them by source, and run the correlation pipeline.

```bash
logcozcli correlate docker [--container <name-or-id...>] [--service <service...>] [--include-system] [--system-source <name...>] [--tail <n>] [--since <value>] [--json]
```

Key behavior:

- runtime correlation requires at least 2 collected sources
- `--container` can be repeated to name multiple containers explicitly
- `--service` can be repeated to include multiple service classes
- `--include-system` adds local system-log sources to the same correlation run
- `--system-source` narrows the system side to sources such as `ssh`, `docker`, or `syslog`

## `logcozcli analyze`

Auto-discover local Docker and local system log sources, then return one grouped analysis report.

```bash
logcozcli analyze [--include-docker] [--include-system] [--include-services <services>] [--exclude-sources <sources>] [--container <name-or-id>] [--service <service>] [--tail <n>] [--since <value>] [--json] [--llm] [--llm-provider <provider>] [--llm-endpoint <url>] [--llm-model <model>] [--include-reasoning]
```

Key behavior:

- if no include flags are passed, LogCoz searches both Docker and system sources
- if include flags are passed, only the requested source families are collected
- `--include-services <services>` narrows collection by discovered service type
- `--exclude-sources <sources>` removes named or id-matched sources from the grouped report
- `--container` and `--service` can be used to bias runtime collection toward a specific Docker target

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
