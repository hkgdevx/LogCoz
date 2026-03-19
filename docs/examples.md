# Examples

This page shows realistic examples built from the same incident shapes covered by the fixture-backed command tests.

## Install From npm

```bash
pnpm add -g @hkgdevx/logcoz
```

Or:

```bash
npm install -g @hkgdevx/logcoz
```

## Analyze a Redis Connection Failure

Example log:

```text
2026-03-19T10:10:00Z ERROR Error: connect ECONNREFUSED 127.0.0.1:6379
[ioredis] Unhandled error event
service=api requestId=redis-123
```

Run:

```bash
logcozcli explain ./fixtures/redis.log
```

Typical outcome:

- issue: Redis connection refused
- category: database
- likely fix: verify Redis is reachable and not misconfigured as `localhost` inside containers

## Analyze a Redis Failure With Context

```bash
logcozcli explain ./fixtures/redis.log --context .env,docker-compose.yml,k8s.yaml --include-reasoning
```

Use this when the logs alone are not enough and the failing service depends on env or infrastructure configuration.

## Analyze an OOM Failure From stdin

Example log:

```text
2026-03-19T10:16:00Z FATAL FATAL ERROR: JavaScript heap out of memory
service=worker requestId=oom-123
```

Run:

```bash
cat ./fixtures/oom.log | logcozcli paste
```

Typical outcome:

- issue: Out-of-memory or memory pressure failure
- category: runtime
- likely fix: inspect memory limits, workload size, and heap tuning

## Get JSON Output

```bash
logcozcli explain ./fixtures/redis.log --json
```

Representative result:

```json
{
  "schemaVersion": "1.0.0",
  "cliName": "logcozcli",
  "cliVersion": "0.1.0",
  "exitCode": 0,
  "status": "detected",
  "result": {
    "issueType": "redis_connection_refused",
    "title": "Redis connection refused",
    "category": "database",
    "confidence": 0.93
  }
}
```

## Analyze With OpenAI

```bash
OPENAI_API_KEY=YOUR_API_KEY logcozcli explain ./fixtures/redis.log --llm --llm-provider openai --llm-model gpt-5-mini
```

If OpenAI is unavailable or misconfigured, the CLI falls back to the deterministic explanation and appends a warning instead of failing the command.

## Analyze Pasted Logs as JSON

```bash
cat ./fixtures/oom.log | logcozcli paste --json --llm --llm-provider mock
```

This is useful for:

- shell scripting
- CI diagnostics
- passing results into another internal tool

## Correlate Multiple Files

Example logs:

```text
[api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed to fetch Redis
[nginx] 2026-03-19T10:10:01Z WARN requestId=abc123 upstream returned 502
```

Run:

```bash
logcozcli correlate ./fixtures/api.log ./fixtures/nginx.log
```

Representative text result:

```text
Incident: Correlated incident: requestId:abc123
Confidence: 89%
Shared keys: {"requestId":"abc123"}
Timeline:
- 2026-03-19T10:10:00Z | [api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed to fetch Redis
- 2026-03-19T10:10:01Z | [nginx] 2026-03-19T10:10:01Z WARN requestId=abc123 upstream returned 502
```

## Correlate Multiple Files as JSON

```bash
logcozcli correlate ./fixtures/api.log ./fixtures/nginx.log --json
```

Representative result:

```json
{
  "schemaVersion": "1.0.0",
  "cliName": "logcozcli",
  "cliVersion": "0.1.0",
  "exitCode": 0,
  "status": "correlated",
  "result": {
    "incidents": [
      {
        "title": "Correlated incident: requestId:abc123"
      }
    ],
    "count": 1
  }
}
```

## Troubleshooting

### `OPENAI_API_KEY` is missing

If you select `--llm-provider openai` without a valid API key, the command still succeeds and returns the base explanation with a warning.

### Provider fallback behavior

The `mock`, `http`, and `openai` providers are optional enhancements. The rule-based explanation remains the authoritative fallback path.

### Empty correlation results

`correlate --json` returns a success envelope with `count: 0` and an empty `incidents` array if no shared identifiers are found.

### `logcozcli` vs `logcoz`

Both commands work. `logcozcli` is the primary documented binary, and `logcoz` is kept as a compatibility alias.
