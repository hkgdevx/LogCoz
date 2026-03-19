# CLI Reference

This page documents the current CLI exactly as implemented.

The primary command name is `logcozcli`. `logcoz` remains a supported alias.

## Global Command

```bash
logcozcli --version
logcozcli --help
```

## `logcozcli explain <file>`

Analyze a log file and explain the likely root cause.

### Usage

```bash
logcozcli explain <file> [--json] [--context <files>] [--llm] [--llm-provider <provider>] [--llm-endpoint <url>] [--llm-model <model>] [--include-reasoning]
```

### Arguments

- `<file>` path to the log file to analyze

### Options

- `--json` print the explanation as structured JSON
- `--context <files>` comma-separated context files, for example `.env,docker-compose.yml`
- `--llm` enable LLM-based explanation enhancement
- `--llm-provider <provider>` provider mode, currently `mock`, `http`, or `openai`
- `--llm-endpoint <url>` HTTP endpoint for the `http` provider
- `--llm-model <model>` model identifier sent to the configured provider
- `--include-reasoning` include detector confidence-reason details

### Behavior

- reads the file as UTF-8 text
- redacts common secrets before detection
- extracts a smaller relevant block from the log
- loads optional context hints from the listed files
- runs detectors and formats the winning explanation
- exits with status `1` on read or analysis failure

### Example

```bash
logcozcli explain ./logs/api.log --context .env,docker-compose.yml --include-reasoning
```

### Representative Output

```text
Issue: Redis connection refused
Category: database
Confidence: 93%

Explanation
Your application tried to connect to Redis, but no service accepted the connection on the target host and port.
```

OpenAI-specific env vars:

- `OPENAI_API_KEY` or `LOGCOZ_LLM_API_KEY`
- optional `LOGCOZ_OPENAI_BASE_URL` or `OPENAI_BASE_URL`

## `logcozcli paste`

Read logs from stdin and analyze them.

### Usage

```bash
logcozcli paste [--json] [--context <files>] [--llm] [--llm-provider <provider>] [--llm-endpoint <url>] [--llm-model <model>] [--include-reasoning]
```

### Options

- `--json` print the explanation as structured JSON
- `--context <files>` comma-separated context files, for example `.env,docker-compose.yml`
- `--llm` enable LLM-based explanation enhancement
- `--llm-provider <provider>` provider mode, currently `mock`, `http`, or `openai`
- `--llm-endpoint <url>` HTTP endpoint for the `http` provider
- `--llm-model <model>` model identifier sent to the configured provider
- `--include-reasoning` include detector confidence-reason details

### Behavior

- reads from stdin until the stream ends
- fails if stdin is empty or whitespace only
- otherwise runs the same pipeline as `explain`
- exits with status `1` on input or analysis failure

### Example

```bash
cat ./logs/worker.log | logcozcli paste --json
```

### Representative Output

The JSON output is an envelope:

```json
{
  "schemaVersion": "1.0.0",
  "cliName": "logcozcli",
  "cliVersion": "0.1.0",
  "exitCode": 0,
  "status": "detected",
  "result": {
    "issueType": "network_timeout",
    "title": "Network timeout or unreachable service",
    "category": "network",
    "confidence": 0.82
  }
}
```

## `logcozcli correlate <files...>`

Correlate multiple log files into incident groups.

### Usage

```bash
logcozcli correlate <files...> [--json]
```

### Options

- `--json` print correlation results as a structured JSON envelope

### Arguments

- `<files...>` one or more log file paths

### Behavior

- reads all supplied files
- extracts log events line by line
- extracts supported correlation keys from each line
- groups events by the first extracted key
- can emit a structured JSON envelope when `--json` is passed
- prints grouped incidents in descending size order
- prints `No correlated incidents found.` if nothing groups successfully
- exits with status `1` on read or analysis failure

### Example

```bash
logcozcli correlate ./logs/api.log ./logs/worker.log ./logs/nginx.log
```

### JSON Output Example

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
    "count": 1,
    "metadata": {
      "filesAnalyzed": 3
    }
  }
}
```

### Representative Output

```text
Incident: Correlated incident: requestId:abc123
Confidence: 82%
Shared keys: {"requestId":"abc123"}
Timeline:
- 2026-03-19T10:10:00Z | requestId=abc123 failed to fetch Redis
- 2026-03-19T10:10:01Z | requestId=abc123 upstream returned 502
```

## Notes and Limits

- `--json` is available only for `explain` and `paste`
- `--context` now supports shallow structured hints from `.env`, Compose, Kubernetes, and JSON config files
- correlation remains deterministic and lightweight, not a full tracing backend
