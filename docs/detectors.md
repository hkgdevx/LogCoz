# Detectors

LogCoz currently uses a fixed detector registry. Each detector is rule-based and scores matches from regex patterns found in the extracted log block.

## How Detection Works

Each detector:

- declares a set of weighted patterns
- computes a score and matched labels
- returns no result below the minimum score threshold
- returns a `DetectionCandidate` with evidence and summary above threshold

The final winner is selected by score first, then specificity, then confidence.

## Redis

### Issue Types

- `redis_connection_refused`
- `redis_auth_error`

### Looks For

- `ECONNREFUSED`
- `redis`
- `ioredis`
- port `6379`
- `WRONGPASS`
- `NOAUTH`

### Notes

- Context hints can boost Redis confidence when a `redis` service exists or `REDIS_HOST=localhost` is found.
- The detector emits auth vs connection failure based on matched auth patterns.
- Generic connection errors mentioning Redis but not matching these patterns may not be classified.

## PostgreSQL

### Issue Type

- `postgres_connection_error`

### Looks For

- `password authentication failed`
- `database ... does not exist`
- `Connection terminated unexpectedly`
- `postgres` or `postgresql`
- port `5432`

### Notes

- Several distinct Postgres failure modes are collapsed into one issue type.
- The detector does not yet distinguish auth, missing database, or transport failure as separate outputs.

## MySQL

### Issue Type

- `mysql_connection_error`

### Looks For

- `ER_ACCESS_DENIED_ERROR`
- `ECONNREFUSED`
- `mysql`
- `3306`
- `Unknown database`

## MongoDB

### Issue Type

- `mongodb_connection_error`

### Looks For

- `MongoNetworkError`
- `Authentication failed`
- `mongodb` or `mongo`
- `27017`
- `failed to connect to server`

## DNS

### Issue Type

- `dns_resolution_error`

### Looks For

- `ENOTFOUND`
- `getaddrinfo`
- `Temporary failure in name resolution`

### Notes

- This is host-resolution focused.
- Network failures that do not involve name resolution are expected to fall into other detectors or remain unknown.

## Network Timeout

### Issue Type

- `network_timeout`

### Looks For

- `ETIMEDOUT`
- `timeout`
- `Connection timed out`
- `operation timed out`
- `network is unreachable`
- `request timed out`

### Notes

- This detector is intentionally broad and may absorb several transport-layer failures.
- Timeout wording in unrelated app contexts may create false positives if the surrounding log is sparse.

## TLS / Certificate

### Issue Type

- `tls_certificate_error`

### Looks For

- `certificate verify failed`
- `self signed certificate`
- `SSL routines`
- `UNABLE_TO_VERIFY_LEAF_SIGNATURE`
- `CERT_HAS_EXPIRED`

## Port Conflict

### Issue Type

- `port_in_use`

### Looks For

- `EADDRINUSE`
- `address already in use`
- `bind failed`

### Notes

- This detector is mainly targeted at application bind failures and host-port conflicts.

## Nginx

### Issue Type

- `nginx_upstream_failure`

### Looks For

- `502 Bad Gateway`
- `connect() failed`
- `upstream prematurely closed connection`
- `nginx`

### Notes

- This detector focuses on upstream communication failures, not general Nginx misconfiguration.

## Docker

### Issue Types

- `docker_healthcheck_failed`
- `docker_restart_loop`
- `docker_container_failure`

### Looks For

- `healthcheck`
- `unhealthy`
- `restarting`
- `exited with code`
- `container`
- `docker`
- `Back-off restarting failed container`
- `CrashLoopBackOff`

### Notes

- Health-check and restart-loop issues are derived from subsets of the same detector.
- Kubernetes-style `CrashLoopBackOff` is currently mapped into the Docker detector because the symptom is operationally similar.

## Kubernetes

### Issue Type

- `kubernetes_workload_failure`

### Looks For

- `ImagePullBackOff`
- `ErrImagePull`
- `CrashLoopBackOff`
- `FailedScheduling`
- `Back-off pulling image`

## Out of Memory

### Issue Type

- `out_of_memory_error`

### Looks For

- `out of memory`
- `JavaScript heap out of memory`
- `OOMKilled`
- `Killed process`
- `Cannot allocate memory`

## Kafka

### Issue Type

- `kafka_broker_error`

### Looks For

- `KafkaJSConnectionError`
- `LEADER_NOT_AVAILABLE`
- `broker not available`
- `kafka`
- `9092`

## RabbitMQ

### Issue Type

- `rabbitmq_connection_error`

### Looks For

- `ACCESS_REFUSED`
- `CONNECTION_FORCED`
- `amqp` or `rabbitmq`
- `5672`
- `Socket closed abruptly during opening handshake`

## Missing File

### Issue Type

- `missing_file`

### Looks For

- `ENOENT`
- `no such file or directory`
- `Cannot find module`

### Notes

- This detector covers runtime file-path and missing-module failures.
- It does not yet distinguish config-file absence, code module absence, or mount/path issues.

## Unknown Fallback

When no detector scores above threshold, LogCoz returns:

- detector: `unknown`
- type: `unknown`
- category: `unknown`

This fallback preserves a small evidence sample but does not claim a specific root cause.

## Current Limits

- Detection is regex-based and not semantic
- Cross-detector reasoning is limited
- Confidence values are score-derived, not probabilistic
- Confidence reasoning can now be surfaced explicitly, but it is still heuristic
