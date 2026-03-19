# Examples

This page shows practical examples for the current CLI.

## Install From npm

```bash
pnpm add -g @hkgdevx/logcoz
```

Or:

```bash
npm install -g @hkgdevx/logcoz
```

## Analyze a File

```bash
logcozcli explain ./logs/api.log
```

Typical use:

- a single application log file
- container output saved to disk
- reverse-proxy logs collected during a failure

## Analyze a File With Context

```bash
logcozcli explain ./logs/api.log --context .env,docker-compose.yml,k8s.yaml --include-reasoning
```

Use this when the logs alone are not enough and the failing service depends on local env or Compose configuration.

## Analyze Pasted Logs

```bash
cat ./logs/worker.log | logcozcli paste
```

This is useful when:

- logs come from another command
- logs are being piped from a shell history workflow
- you do not want to create a temporary file

## Get JSON Output

```bash
logcozcli explain ./logs/api.log --json
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
    "confidence": 0.93,
    "explanation": "Your application tried to connect to Redis, but no service accepted the connection on the target host and port.",
    "evidence": ["Error: connect ECONNREFUSED 127.0.0.1:6379"],
    "likelyCauses": [
      "Redis service is not running",
      "Wrong Redis host or port configuration",
      "Application is running inside Docker and is incorrectly using localhost"
    ],
    "suggestedFixes": [
      "Verify Redis is running",
      "Check REDIS_HOST, REDIS_PORT, or REDIS_URL",
      "If using Docker Compose, use the service name instead of localhost"
    ],
    "debugCommands": ["docker ps", "docker logs redis", "printenv | grep REDIS"]
  }
}
```

## Analyze Pasted Logs as JSON

```bash
cat ./logs/app.log | logcozcli paste --json --context .env --llm --llm-provider mock
```

## Analyze With OpenAI

```bash
OPENAI_API_KEY=YOUR_API_KEY logcozcli explain ./logs/api.log --llm --llm-provider openai --llm-model gpt-5-mini
```

This is useful for:

- shell scripting
- CI diagnostics
- passing results into another internal tool

## Correlate Multiple Files

```bash
logcozcli correlate ./logs/api.log ./logs/worker.log ./logs/nginx.log
```

## Correlate Multiple Files as JSON

```bash
logcozcli correlate ./logs/api.log ./logs/worker.log ./logs/nginx.log --json
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

Representative result:

```text
Incident: Correlated incident: requestId:abc123
Confidence: 82%
Shared keys: {"requestId":"abc123"}
Timeline:
- 2026-03-19T10:10:00Z | requestId=abc123 failed to fetch Redis
- 2026-03-19T10:10:01Z | requestId=abc123 upstream returned 502
```

## Example Scenarios That Map Well to Current Detectors

- app cannot connect to Redis inside Docker
- Postgres auth failure after config drift
- Nginx returns `502 Bad Gateway` because upstream app is unhealthy
- startup fails because a port is already bound
- build/runtime fails due to missing files or modules

## Scenarios That Are Not Yet Strongly Covered

- TLS handshake and certificate failures
- memory pressure or heap out-of-memory crashes
- issue families beyond the currently implemented detector set
