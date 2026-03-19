# Context Hints

LogCoz accepts optional context files through `--context <files>`. These files are read and scanned for lightweight hints that can improve diagnosis.

## Usage

```bash
logcoz explain ./app.log --context .env,docker-compose.yml
```

The value is a comma-separated list of file paths.

## What Is Extracted Today

The current implementation combines env-style parsing with shallow structured extraction. It is still lightweight, but it now understands more than raw regex matches.

### `.env`-style values

Currently recognized:

- `REDIS_HOST=localhost`
- `REDIS_PORT=<number>`
- `DB_HOST=localhost`
- `DB_PORT=<number>`
- `DB_NAME=<name>`
- `MYSQL_HOST=<host>`
- `MONGO_URL=<uri>`
- `KAFKA_BROKERS=<value>`
- `RABBITMQ_URL=<uri>`

### Compose-like service definitions

The scanner also looks for:

- service names declared as top-level mapping entries
- port mappings such as `3000:3000`
- basic Kubernetes keys such as `kind`, `metadata.name`, and `image`
- selected JSON config keys containing `redis`, `db`, `mysql`, `mongo`, `kafka`, `rabbit`, `tls`, or `ssl`

These produce hints such as:

- `docker_service=redis`
- `docker_port_mapping=3000:3000`

## How Hints Are Used

Hints are attached to the detection context for all detectors. Today, the main practical effect is in the Redis detector:

- a detected `redis` service adds a score boost
- `REDIS_HOST=localhost` adds a larger score boost

This helps LogCoz better distinguish common local-container misconfiguration cases, especially when applications use `localhost` instead of a service name inside Docker networking.

## What This Does Not Do Yet

Current context support still does not:

- parse YAML or env files structurally
- validate configuration values
- understand Kubernetes manifests
- reason about dependencies or service graphs
- override detector output directly
- fully parse arbitrary YAML structures

It only contributes small pieces of supporting signal.

## Operational Guidance

- Pass only the config files relevant to the failing service
- Do not assume every config value is consumed
- Treat context hints as score assistance, not as proof of misconfiguration

## Planned Direction

Future improvements should move from regex extraction to structured parsing for:

- `.env`
- Compose files
- Kubernetes manifests
- service configuration files
