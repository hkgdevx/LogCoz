# Architecture

This document describes the current LogCoz runtime flow as implemented.

## Entry Points

The CLI now has six user-facing paths:

- `explain <file>`
- `explain docker`
- `paste`
- `correlate <files...>`
- `correlate docker`
- `analyze`

`explain <file>`, `explain docker`, and `paste` share the same detection and explanation pipeline. `correlate` and `correlate docker` share the correlation pipeline. `analyze` collects multiple runtime sources, analyzes them individually, and then groups the result.

## Shared Explanation Pipeline

The explanation flow is:

1. read raw input from a file, stdin, or a collected runtime source
2. redact common secrets
3. normalize the log text
4. extract a smaller relevant block around known error signals
5. load optional context hints from user-supplied files
6. build a detection context
7. run all registered detectors
8. select the strongest candidate by score, specificity, and confidence
9. convert the winning detection into an explanation result
10. optionally enrich the result through the configured LLM provider
11. format the result for terminal output or emit a structured JSON envelope

## Runtime Collection Model

Runtime collection is built around a shared `CollectedSource` shape:

- `id`
- `kind`
- `displayName`
- `serviceType`
- `raw`
- `metadata`

Current source kinds:

- `file`
- `stdin`
- `docker-container`
- `system-log`

Current service classifications:

- `app`
- `postgres`
- `redis`
- `mongodb`
- `nginx`
- `ssh`
- `system`
- `kubernetes`
- `unknown`

## Docker Collection

Docker collection uses the local `docker` CLI only.

Current behavior:

- list local containers through `docker ps`
- classify them using container names and image names
- collect logs with `docker logs`
- support `--container`, `--service`, `--tail`, and `--since`

Direct remote Docker context support is intentionally out of scope for this release.

## System Collection

System collection is local-only.

Current behavior:

- prefer `journalctl` for broad system, SSH, and Docker-daemon logs
- fall back to well-known local files such as `auth.log` and `syslog` when journal output is unavailable
- classify host sources as `ssh` or `system`

## Correlation Pipeline

The correlation flow is:

1. split collected inputs into lines
2. convert each line into a `LogEvent`
3. extract timestamps, levels, service hints, and correlation keys
4. choose the strongest correlation key deterministically
5. group events by that key
6. derive confidence, shared keys, and timeline ordering

Supported keys:

- `traceId`
- `requestId`
- `correlationId`
- `jobId`

For Docker/runtime correlation, sources are prefixed before grouping so service attribution survives the collection step.

`correlate docker` is now explicitly multi-source:

- it may collect multiple containers
- it may include local system sources in the same run
- it fails early if fewer than 2 runtime sources are collected

## Analyze Pipeline

`analyze` is the grouped runtime workflow:

1. auto-discover local Docker and system sources unless include flags narrow the scope
2. collect logs into normalized source records
3. run the explanation pipeline per source
4. correlate collected sources together
5. derive security findings from evidence-backed auth/TLS/SSH/posture patterns
6. return one grouped report containing:
   - `sources`
   - `incidents`
   - `correlations`
   - `securityFindings`
   - `summary`

## Security Model

Security output is intentionally lightweight and evidence-based.

Included today:

- auth and access failures found in logs
- TLS and certificate failures
- SSH login anomalies
- repeated authentication failures
- container localhost/service mismatch hints

Not included:

- vulnerability scanning
- CVE intelligence
- compliance auditing
- broad static security posture analysis
