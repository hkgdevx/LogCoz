# Correlation

LogCoz correlation is a deterministic incident-grouping helper used by both:

- `logcoz correlate <files...>`
- `logcoz correlate docker`

It is also reused internally by `logcoz analyze`.

## Current Flow

For each input source, LogCoz:

1. splits the source into lines
2. converts each line into a `LogEvent`
3. extracts correlation keys, timestamp, log level, and service hints
4. chooses the strongest supported key deterministically
5. groups by that key
6. sorts each timeline by timestamp and severity
7. derives confidence, shared keys, root-cause hints, and symptom hints

## Supported Correlation Keys

- `traceId`
- `requestId`
- `correlationId`
- `jobId`

Examples:

- `traceId=abc-123`
- `request id: abc123`
- `correlation-id=order-77`
- `job_id=sync-99`

## Runtime Source Correlation

For Docker and grouped runtime analysis, each collected source is prefixed before correlation so the pipeline retains source/service attribution.

That means correlation can now surface service-aware groupings from:

- app containers
- Nginx containers
- Redis/Postgres/MongoDB-related logs
- local system/SSH logs

## Output

Each correlated incident includes:

- generated title
- derived confidence
- shared keys
- timeline
- root-cause hints
- symptom hints
- metadata such as discovered services and time-window hints

`correlate --json` and `correlate docker --json` both emit stable envelopes.

## Limits

Correlation is still intentionally lightweight:

- it does not merge semantically equivalent keys
- it does not build a full causal graph
- it does not replace tracing or distributed observability systems
