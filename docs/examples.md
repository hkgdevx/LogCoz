# Examples

This page shows examples aligned to the current CLI and fixture-backed tests.

## Install From npm

```bash
pnpm add -g @hkgdevx/logcoz
```

Or:

```bash
npm install -g @hkgdevx/logcoz
```

## Explain a File-Based Redis Failure

```bash
logcozcli explain ./fixtures/redis.log --context .env,docker-compose.yml --include-reasoning
```

Typical result:

- issue: Redis connection refused
- category: database
- likely fix: verify Redis is reachable and avoid using `localhost` inside containers

## Explain Docker Container Logs

```bash
logcozcli explain docker --container api --tail 200 --json
```

Typical use:

- investigate one failing app container
- inspect PostgreSQL, Redis, MongoDB, or Nginx containers directly
- automate runtime diagnosis from a host shell

## Correlate Multiple Files

```bash
logcozcli correlate ./fixtures/api.log ./fixtures/nginx.log --json
```

Typical result shape:

```json
{
  "status": "correlated",
  "result": {
    "count": 1
  }
}
```

## Correlate Docker Sources

```bash
logcozcli correlate docker --container api --container nginx --include-system --system-source ssh --json
```

Use this when you want to correlate app, proxy, and host-level evidence without exporting logs to files first.

`correlate docker` requires at least 2 runtime sources. If you only need one container, use `logcozcli explain docker`.

## Run Grouped Runtime Analysis

```bash
logcozcli analyze --include-docker --include-system --include-reasoning
```

Typical grouped report sections:

- discovered sources
- top incidents
- correlations
- security findings
- next actions

## Analyze MongoDB Runtime Failures

```bash
logcozcli explain docker --service mongodb --tail 150
```

Typical outcome:

- issue: MongoDB connection or authentication error
- likely fixes:
  - verify MongoDB URI and credentials
  - confirm MongoDB is listening on the expected interface and port

## Investigate SSH or Security-Related Issues

```bash
logcozcli analyze --include-system --json
```

Typical security findings can include:

- failed SSH logins
- repeated authentication failures
- TLS/certificate incidents
- evidence-backed posture hints such as container localhost misuse

## Use OpenAI Enhancement

```bash
OPENAI_API_KEY=YOUR_API_KEY logcozcli explain ./fixtures/redis.log --llm --llm-provider openai --llm-model gpt-5-mini
```

Provider failures fall back to the deterministic explanation path with a warning instead of failing the command.

## Publish Smoke Check

```bash
pnpm check
pnpm build
pnpm smoke:packaged-cli
pnpm publish --dry-run --no-git-checks --access public --registry https://registry.npmjs.org
```
