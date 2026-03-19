# Correlation

`logcoz correlate <files...>` groups log lines into incident candidates using extracted request identifiers.

## Current Flow

For each supplied file, LogCoz:

1. reads the file as text
2. splits it into individual lines
3. trims empty lines
4. converts each line into a `LogEvent`
5. extracts correlation keys, timestamp, and log level where possible
6. chooses the strongest available correlation key deterministically
7. sorts groups by descending event count

## Supported Correlation Keys

The current extractor looks for:

- `traceId`
- `requestId`
- `correlationId`
- `jobId`

Examples it can match:

- `traceId=abc-123`
- `request id: abc123`
- `correlation-id=order-77`
- `job_id=sync-99`

## Extracted Event Fields

Each parsed line may contain:

- `message`
- `timestamp`
- `level`
- `service`
- `correlationKeys`

Timestamp extraction is lightweight and supports common timestamp shapes such as:

- ISO-like timestamps
- `HH:MM:SS`

Level extraction looks for:

- `INFO`
- `WARN`
- `ERROR`
- `DEBUG`
- `TRACE`

## Grouping Behavior

Grouping uses the strongest supported correlation key from a line. Current priority is:

- `traceId`
- `correlationId`
- `requestId`
- `jobId`

For example:

- if a line has `requestId=abc123`, it can group under `requestId:abc123`
- if a line has multiple keys, the first extracted key wins

This keeps behavior predictable while improving grouping quality over simple first-match ordering.

## Output Shape

For each incident group, the CLI prints:

- a generated incident title
- a fixed confidence value
- derived confidence based on severity, timestamps, service presence, and event density
- shared keys across the grouped events
- up to 10 timeline entries
- root-cause hints and symptom hints internally available on the incident model

If no groups are formed, the CLI prints:

```text
No correlated incidents found.
```

## Current Limitations

Correlation still does not:

- merge groups across equivalent keys
- reason about services or components
- fully infer root cause vs symptom chains
- export JSON

It is best viewed as a lightweight incident clustering helper, not a full tracing or causality engine.

## Recommended Next Improvements

- combine multiple keys into richer incident joins
- export structured JSON
- add structured JSON output
