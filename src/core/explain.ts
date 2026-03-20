/**************************************************************************************************************************
 Copyright (c) 2026

     Name: explain.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { pickPlatformCommands } from '@/utils/platform';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
const withOptionalMetadata = (
  issue: DetectionCandidate
): Partial<Pick<ExplanationResult, 'metadata'>> => {
  return issue.metadata ? { metadata: issue.metadata } : {};
};

const withConfidenceReasons = (
  issue: DetectionCandidate
): Pick<ExplanationResult, 'confidenceReasons'> => ({
  confidenceReasons: issue.confidenceReasons ?? []
});

function platformDebugCommands(unixCommands: string[], windowsCommands: string[]): string[] {
  return pickPlatformCommands(unixCommands, windowsCommands);
}

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function explainIssue(issue: DetectionCandidate): ExplanationResult {
  switch (issue.type) {
    case 'redis_connection_refused':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'Your application tried to connect to Redis, but no service accepted the connection on the target host and port.',
        evidence: issue.evidence,
        likelyCauses: [
          'Redis service is not running',
          'Wrong Redis host or port configuration',
          'Application is running inside Docker and is incorrectly using localhost'
        ],
        suggestedFixes: [
          'Verify Redis is running',
          'Check REDIS_HOST, REDIS_PORT, or REDIS_URL',
          'If using Docker Compose, use the service name instead of localhost'
        ],
        debugCommands: platformDebugCommands(
          ['docker ps', 'docker logs redis', 'printenv | grep REDIS'],
          ['docker ps', 'docker logs redis', 'Get-ChildItem Env:REDIS*']
        ),
        ...withOptionalMetadata(issue),
        ...withConfidenceReasons(issue)
      };

    case 'redis_auth_error':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The application successfully reached Redis, but authentication failed due to wrong or missing credentials.',
        evidence: issue.evidence,
        likelyCauses: [
          'Wrong Redis password',
          'Missing password in application configuration',
          'Redis ACL or user mismatch'
        ],
        suggestedFixes: [
          'Verify Redis password in environment variables',
          'Check Redis ACL settings',
          'Confirm the app uses the expected Redis user and password'
        ],
        debugCommands: platformDebugCommands(
          ['printenv | grep REDIS', 'docker exec -it redis redis-cli', 'docker logs redis'],
          ['Get-ChildItem Env:REDIS*', 'docker exec -it redis redis-cli', 'docker logs redis']
        ),
        ...withOptionalMetadata(issue),
        ...withConfidenceReasons(issue)
      };

    case 'postgres_connection_error':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The application encountered a PostgreSQL connection, authentication, or target database problem.',
        evidence: issue.evidence,
        likelyCauses: [
          'Incorrect username or password',
          'Target database does not exist',
          'PostgreSQL service is unavailable'
        ],
        suggestedFixes: [
          'Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME',
          'Confirm PostgreSQL is running',
          'Check if the database exists and the user has access'
        ],
        debugCommands: platformDebugCommands(
          ['docker ps', 'docker logs postgres', 'printenv | grep DB_'],
          ['docker ps', 'docker logs postgres', 'Get-ChildItem Env:DB*']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'mysql_connection_error':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The application encountered a MySQL connection, authentication, or target database problem.',
        evidence: issue.evidence,
        likelyCauses: [
          'Incorrect MySQL credentials',
          'Target database does not exist',
          'MySQL service is unavailable or unreachable'
        ],
        suggestedFixes: [
          'Verify MySQL host, port, user, password, and database configuration',
          'Confirm the MySQL service is reachable from the application runtime',
          'Check broker or container logs for startup failures'
        ],
        debugCommands: platformDebugCommands(
          ['docker ps', 'docker logs mysql', 'printenv | grep MYSQL'],
          ['docker ps', 'docker logs mysql', 'Get-ChildItem Env:MYSQL*']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'mongodb_connection_error':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The application could not authenticate to MongoDB or establish a healthy connection to the target server.',
        evidence: issue.evidence,
        likelyCauses: [
          'Wrong MongoDB credentials',
          'MongoDB is unavailable or unreachable',
          'Replica set or network configuration is incorrect'
        ],
        suggestedFixes: [
          'Verify MongoDB URI, host, and credentials',
          'Confirm MongoDB is listening on the expected interface and port',
          'Check application and database logs for topology or auth failures'
        ],
        debugCommands: platformDebugCommands(
          ['docker ps', 'docker logs mongodb', 'printenv | grep MONGO'],
          ['docker ps', 'docker logs mongodb', 'Get-ChildItem Env:MONGO*']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'dns_resolution_error':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation: 'The application could not resolve the configured hostname to an IP address.',
        evidence: issue.evidence,
        likelyCauses: [
          'Wrong hostname in environment variables',
          'Container or service name mismatch',
          'DNS or network issue'
        ],
        suggestedFixes: [
          'Verify the hostname value',
          'Check Docker Compose service names',
          'Test DNS resolution from the running environment'
        ],
        debugCommands: platformDebugCommands(
          ['printenv', 'nslookup <hostname>', 'ping <hostname>'],
          ['Get-ChildItem Env:', 'Resolve-DnsName <hostname>', 'Test-NetConnection <hostname>']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'network_timeout':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The application could not reach the target service within the allowed time window, or the network path was unavailable.',
        evidence: issue.evidence,
        likelyCauses: [
          'Target service is slow or down',
          'Firewall or network routing issue',
          'Wrong host or port causing connection attempts to hang'
        ],
        suggestedFixes: [
          'Verify the target service is healthy',
          'Check connectivity from the current runtime environment',
          'Validate the configured host and port'
        ],
        debugCommands: platformDebugCommands(
          ['curl -v <target>', 'ping <hostname>', 'ss -ltnp'],
          ['curl.exe -v <target>', 'Test-NetConnection <hostname>', 'netstat -ano']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'tls_certificate_error':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The application reached the remote endpoint, but TLS negotiation or certificate validation failed.',
        evidence: issue.evidence,
        likelyCauses: [
          'Certificate chain is incomplete or expired',
          'Self-signed or untrusted certificate',
          'Hostname mismatch between certificate and configured target'
        ],
        suggestedFixes: [
          'Verify the target certificate chain and expiry',
          'Confirm the configured hostname matches the certificate subject',
          'Install or trust the correct CA bundle in the runtime environment'
        ],
        debugCommands: platformDebugCommands(
          ['openssl s_client -connect <host>:443 -servername <host>', 'curl -v https://<host>'],
          ['curl.exe -v https://<host>', 'Test-NetConnection <host> -Port 443']
        ),
        ...withOptionalMetadata(issue),
        ...withConfidenceReasons(issue)
      };

    case 'port_in_use':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The process tried to bind to a port that is already being used by another process or service.',
        evidence: issue.evidence,
        likelyCauses: [
          'Another app is already using the same port',
          'A previous process did not exit cleanly',
          'Multiple containers are mapped to the same host port'
        ],
        suggestedFixes: [
          'Find and stop the process using the port',
          'Change the application port',
          'Check Docker port mappings'
        ],
        debugCommands: platformDebugCommands(
          ['lsof -i :3000', 'ss -ltnp', 'docker ps'],
          ['netstat -ano | findstr :3000', 'Get-Process -Id <pid>', 'docker ps']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'nginx_upstream_failure':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'Nginx could not successfully communicate with the upstream service, so it returned a gateway error.',
        evidence: issue.evidence,
        likelyCauses: [
          'Upstream container is down',
          'Wrong upstream host or port',
          'Application crashed or closed the connection'
        ],
        suggestedFixes: [
          'Verify the upstream container is running',
          'Check Nginx upstream configuration',
          'Inspect application logs for crashes'
        ],
        debugCommands: platformDebugCommands(
          ['docker ps', 'docker logs nginx', 'docker logs <app-container>'],
          ['docker ps', 'docker logs nginx', 'docker logs <app-container>']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'docker_healthcheck_failed':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The container failed its health check, which usually means the process started but is not ready or not responding correctly.',
        evidence: issue.evidence,
        likelyCauses: [
          'Application startup is failing internally',
          'Health check command is incorrect',
          'Dependency required by the app is unavailable'
        ],
        suggestedFixes: [
          'Inspect container logs for startup failures',
          'Verify the health check command and endpoint',
          'Check dependencies like database or Redis availability'
        ],
        debugCommands: platformDebugCommands(
          ['docker ps', 'docker inspect <container>', 'docker logs <container>'],
          ['docker ps', 'docker inspect <container>', 'docker logs <container>']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'docker_restart_loop':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The container is repeatedly crashing and restarting, which indicates the main process exits shortly after startup.',
        evidence: issue.evidence,
        likelyCauses: [
          'Application crash during startup',
          'Missing environment variables or configuration',
          'Invalid command, entrypoint, or mounted file'
        ],
        suggestedFixes: [
          'Inspect container logs',
          'Check required environment variables',
          'Verify the image entrypoint and mounted configuration files'
        ],
        debugCommands: platformDebugCommands(
          ['docker ps -a', 'docker logs <container>', 'docker inspect <container>'],
          ['docker ps -a', 'docker logs <container>', 'docker inspect <container>']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'docker_container_failure':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation: 'A container-level runtime failure was detected in the logs.',
        evidence: issue.evidence,
        likelyCauses: [
          'Containerized process exited unexpectedly',
          'Dependency or configuration failure inside the container',
          'Resource constraints or image/runtime issues'
        ],
        suggestedFixes: [
          'Inspect container logs',
          'Check image, command, and environment variables',
          'Verify external dependencies used by the container'
        ],
        debugCommands: platformDebugCommands(
          ['docker ps -a', 'docker logs <container>', 'docker inspect <container>'],
          ['docker ps -a', 'docker logs <container>', 'docker inspect <container>']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'kubernetes_workload_failure':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'A Kubernetes workload failed due to scheduling, image retrieval, or repeated restart problems.',
        evidence: issue.evidence,
        likelyCauses: [
          'Image cannot be pulled from the configured registry',
          'Cluster lacks resources or scheduling constraints are unsatisfied',
          'The container starts and crashes repeatedly'
        ],
        suggestedFixes: [
          'Inspect pod events and container state',
          'Verify image name, registry credentials, and resource requests',
          'Check workload logs for startup failures'
        ],
        debugCommands: platformDebugCommands(
          [
            'kubectl describe pod <pod-name>',
            'kubectl logs <pod-name> --previous',
            'kubectl get events --sort-by=.metadata.creationTimestamp'
          ],
          [
            'kubectl describe pod <pod-name>',
            'kubectl logs <pod-name> --previous',
            'kubectl get events --sort-by=.metadata.creationTimestamp'
          ]
        ),
        ...withOptionalMetadata(issue),
        ...withConfidenceReasons(issue)
      };

    case 'missing_file':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The application tried to access a file, module, or directory that does not exist in the current environment.',
        evidence: issue.evidence,
        likelyCauses: [
          'Wrong relative path',
          'Missing configuration file',
          'Build output path is incorrect'
        ],
        suggestedFixes: [
          'Verify the file path',
          'Check whether the file exists in the runtime environment',
          'Confirm volume mounts or build output directories'
        ],
        debugCommands: platformDebugCommands(
          ['pwd', 'ls -la', 'find . -maxdepth 3 -type f'],
          [
            'Get-Location',
            'Get-ChildItem -Force',
            'Get-ChildItem -Recurse -File | Select-Object -First 20'
          ]
        ),
        ...withConfidenceReasons(issue)
      };

    case 'out_of_memory_error':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The process or container exhausted available memory and was terminated or became unstable.',
        evidence: issue.evidence,
        likelyCauses: [
          'Memory leak or unexpectedly large workload',
          'Container or host memory limits are too low',
          'Heap limits are smaller than the workload requires'
        ],
        suggestedFixes: [
          'Inspect memory usage and recent workload size changes',
          'Increase memory limits or tune heap settings',
          'Review application code for unbounded growth or caching'
        ],
        debugCommands: platformDebugCommands(
          ['docker stats', 'free -m', 'dmesg | tail'],
          [
            'docker stats',
            'Get-Counter "\\Memory\\Available MBytes"',
            'Get-Process | Sort-Object WS -Descending | Select-Object -First 10'
          ]
        ),
        ...withConfidenceReasons(issue)
      };

    case 'ssh_auth_failure':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The host is seeing failed SSH logins or pre-auth connection probing against one or more accounts.',
        evidence: issue.evidence,
        likelyCauses: [
          'Internet-wide credential stuffing or brute-force scanning',
          'SSH is exposed publicly and is receiving automated login attempts',
          'A client is retrying with invalid credentials or disconnecting during pre-auth'
        ],
        suggestedFixes: [
          'Review SSH exposure, allowed users, and authentication logs',
          'Disable direct root login and enforce key-based authentication where possible',
          'Add rate limiting, firewall rules, or fail2ban-style blocking for repeated offenders'
        ],
        debugCommands: platformDebugCommands(
          [
            'sudo journalctl -u ssh --since "1 hour ago"',
            'sudo grep "Failed password" /var/log/auth.log | tail -n 20',
            'sudo ss -tnp | grep :22'
          ],
          ['Get-WinEvent -LogName Security | Select-Object -First 20', 'netstat -ano | findstr :22']
        ),
        ...withConfidenceReasons(issue)
      };

    case 'kafka_broker_error':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The application could not reach a healthy Kafka broker or partition leader in time.',
        evidence: issue.evidence,
        likelyCauses: [
          'Kafka broker is unavailable',
          'Wrong bootstrap server configuration',
          'Cluster leadership or networking issues'
        ],
        suggestedFixes: [
          'Verify the configured bootstrap servers',
          'Check Kafka broker health and topic partition state',
          'Review network connectivity between the app and brokers'
        ],
        debugCommands: platformDebugCommands(
          [
            'docker logs kafka',
            'kafka-topics.sh --bootstrap-server <broker> --list',
            'printenv | grep KAFKA'
          ],
          [
            'docker logs kafka',
            'Get-ChildItem Env:KAFKA*',
            'Test-NetConnection <broker> -Port 9092'
          ]
        ),
        ...withConfidenceReasons(issue)
      };

    case 'rabbitmq_connection_error':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The application could not authenticate to RabbitMQ or establish a healthy AMQP connection.',
        evidence: issue.evidence,
        likelyCauses: [
          'Wrong broker credentials or virtual host',
          'RabbitMQ broker is unavailable',
          'AMQP connectivity is interrupted by network or TLS issues'
        ],
        suggestedFixes: [
          'Verify RabbitMQ connection URI, credentials, and virtual host',
          'Check broker availability and queue health',
          'Confirm the application can reach the broker port from its runtime'
        ],
        debugCommands: platformDebugCommands(
          ['docker logs rabbitmq', 'printenv | grep RABBIT', 'ss -ltnp | grep 5672'],
          [
            'docker logs rabbitmq',
            'Get-ChildItem Env:RABBIT*',
            'Test-NetConnection <broker> -Port 5672'
          ]
        ),
        ...withConfidenceReasons(issue)
      };

    case 'smtp_auth_error':
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The application reached the SMTP or email provider, but authentication failed with the configured credentials.',
        evidence: issue.evidence,
        likelyCauses: [
          'Wrong SMTP username or password',
          'App password or provider-specific credential is required',
          'The configured mail account, relay, or sender policy is rejecting the login'
        ],
        suggestedFixes: [
          'Verify SMTP host, port, username, and password',
          'Check whether the provider requires an app password, relay credential, or OAuth flow',
          'Review the mail provider account and security policy for rejected logins'
        ],
        debugCommands: platformDebugCommands(
          [
            'printenv | grep -E "SMTP|MAIL"',
            'docker logs <app-container>',
            'openssl s_client -starttls smtp -connect <host>:587'
          ],
          ['Get-ChildItem Env:SMTP*', 'Get-ChildItem Env:MAIL*', 'docker logs <app-container>']
        ),
        ...withConfidenceReasons(issue)
      };

    default:
      return {
        issueType: issue.type,
        title: issue.title,
        category: issue.category,
        confidence: issue.confidence,
        explanation:
          'The log did not match any known detector strongly enough yet. More context or additional detectors may be needed.',
        evidence: issue.evidence,
        likelyCauses: ['Unknown'],
        suggestedFixes: [
          'Inspect the extracted evidence lines',
          'Pass related config files as context',
          'Add a new detector for this error pattern'
        ],
        debugCommands: platformDebugCommands(['cat <log-file>'], ['Get-Content <log-file>']),
        ...withConfidenceReasons(issue)
      };
  }
}
