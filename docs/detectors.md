# Detectors

LogCoz uses a fixed detector registry. Each detector is rule-based and scores regex-backed evidence from the extracted log block.

## Current Categories

- database
- network
- runtime
- filesystem
- proxy
- container
- messaging
- security
- orchestration

## Database and Service Coverage

Current first-class service handling includes:

- Redis
- PostgreSQL
- MySQL
- MongoDB
- Nginx
- Docker/container runtime
- Kubernetes-style workload failures when those patterns appear in gathered logs

MongoDB is now treated as a first-class runtime target in the command surface as well as a detector family.

## Security-Relevant Coverage

Security-oriented findings are currently grounded in evidence from:

- TLS and certificate failures
- authentication failures
- SSH-related failures in collected system logs
- permission-denied style incidents
- repeated auth failures
- container localhost/service mismatch hints

This is still a lightweight evidence-based layer, not a dedicated security scanner.

## Current Issue Types

- `redis_connection_refused`
- `redis_auth_error`
- `postgres_connection_error`
- `mysql_connection_error`
- `mongodb_connection_error`
- `dns_resolution_error`
- `network_timeout`
- `tls_certificate_error`
- `port_in_use`
- `nginx_upstream_failure`
- `docker_healthcheck_failed`
- `docker_restart_loop`
- `docker_container_failure`
- `kubernetes_workload_failure`
- `out_of_memory_error`
- `kafka_broker_error`
- `rabbitmq_connection_error`
- `missing_file`
- `unknown`

## Detector Limits

- detection is regex-based, not semantic
- cross-detector reasoning is still limited
- confidence is heuristic, not probabilistic
- posture findings are only emitted when directly supported by collected evidence
