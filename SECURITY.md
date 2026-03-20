# Security Policy

## Reporting a Vulnerability

Please do not open a public GitHub issue for unpatched security vulnerabilities.

Report security issues privately to:

- Harikrishnan Gangadharan
- `hkgdevx@gmail.com`

Include as much of the following as you can:

- affected LogCoz version
- operating system and Node.js version
- steps to reproduce
- sample command or redacted log input
- impact and expected risk

Acknowledgement and review are handled on a best-effort basis. Please allow reasonable time for triage and follow-up.

## What Counts as a Security Issue

Examples that belong here:

- secrets or private data being exposed unexpectedly by the CLI
- unsafe handling of logs, context files, or report output
- command execution, path traversal, or packaging issues with security impact
- report or redaction behavior that leaks sensitive information unexpectedly

Examples that usually do not belong here:

- incorrect detector classification without a security impact
- feature requests for broader security coverage
- unsupported-environment behavior with no security consequence

## Scope Notes

LogCoz provides evidence-based security findings from logs, but it is not a vulnerability scanner, compliance tool, or full security audit product.
