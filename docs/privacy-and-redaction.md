# Privacy and Redaction

LogCoz applies a redaction step before analysis, but it should still be treated as a best-effort tool when working with sensitive logs.

## What Is Redacted Today

The current implementation redacts:

- values following `password=...` or `password: ...`
- values following `token=...` or `token: ...`
- values following `secret=...` or `secret: ...`
- Bearer tokens
- passwords embedded in Postgres connection URLs
- passwords embedded in Redis connection URLs

Redacted values are replaced with `[REDACTED]`.

## Why This Matters

LogCoz extracts evidence lines and may print them back to the terminal or JSON output. Redaction reduces the chance of echoing common secrets during analysis.

## What Is Not Guaranteed

The current redaction logic does not guarantee coverage for:

- arbitrary API key formats
- multiline secrets
- custom credential field names
- encoded or nested secrets
- credentials in unsupported URL formats
- secrets stored in JSON bodies, stack traces, or binary blobs

If a secret does not match the current regexes, it may remain in the analyzed content.

## Recommended Usage

- Prefer analyzing scrubbed logs when possible
- Review logs before sharing them in tickets or chat
- Avoid assuming that redaction is complete
- Treat terminal output and `--json` output as potentially sensitive artifacts

## Operational Caveat

Context files passed with `--context` are read as plain text. Those files are not separately redacted for display because the current CLI does not print their full contents, but they still influence analysis internally.

## Future Improvements

Useful next steps include:

- broader credential pattern coverage
- structured redaction for JSON logs
- configurable custom redaction rules
- test fixtures covering more secret formats
