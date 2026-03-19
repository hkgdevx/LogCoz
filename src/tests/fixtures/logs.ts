/**************************************************************************************************************************
 Copyright (c) 2026

     Name: logs.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 EXPORTS
***************************************************************************************************************************/
export const logFixtures = {
  redisConnection: `2026-03-19T10:10:00Z ERROR Error: connect ECONNREFUSED 127.0.0.1:6379
[ioredis] Unhandled error event
service=api requestId=redis-123`,

  redisAuth: `2026-03-19T10:11:00Z ERROR ReplyError: WRONGPASS invalid username-password pair or user is disabled.
ReplyError: NOAUTH Authentication required.
service=api requestId=redis-auth-123`,

  postgresConnection: `2026-03-19T10:12:00Z ERROR password authentication failed for user "appuser"
Connection terminated unexpectedly
service=api requestId=pg-123`,

  mysqlConnection: `2026-03-19T10:13:00Z ERROR mysql ECONNREFUSED 127.0.0.1:3306
ER_ACCESS_DENIED_ERROR: Access denied for user 'app'@'localhost'`,

  mongoConnection: `2026-03-19T10:14:00Z ERROR MongoNetworkError: failed to connect to server mongo:27017
service=api requestId=mongo-123`,

  tlsFailure: `2026-03-19T10:15:00Z ERROR CERT_HAS_EXPIRED while connecting to https://internal.example.com
TLS handshake failed`,

  oomFailure: `2026-03-19T10:16:00Z FATAL FATAL ERROR: JavaScript heap out of memory
service=worker requestId=oom-123`,

  dockerFailure: `2026-03-19T10:17:00Z WARN container app marked unhealthy
healthcheck failed: curl: (7) Failed to connect to localhost port 3000`,

  kubernetesFailure: `2026-03-19T10:18:00Z WARN pod api CrashLoopBackOff
Back-off pulling image registry/app:latest`,

  kafkaFailure: `2026-03-19T10:19:00Z ERROR KafkaJSConnectionError: broker is not available
service=consumer requestId=kafka-123`,

  rabbitMqFailure: `2026-03-19T10:20:00Z ERROR amqp ACCESS_REFUSED - Login was refused using authentication mechanism
service=worker requestId=rabbit-123`,

  correlationApi: `[api] 2026-03-19T10:10:00Z ERROR requestId=abc123 failed to fetch Redis`,
  correlationProxy: `[nginx] 2026-03-19T10:10:01Z WARN requestId=abc123 upstream returned 502`,
  noIncidentsA: `2026-03-19T10:21:00Z INFO startup complete`,
  noIncidentsB: `2026-03-19T10:21:01Z INFO healthcheck passed`
} as const;

export const exampleContextFiles = {
  env: `REDIS_HOST=localhost
REDIS_PORT=6379
DB_HOST=postgres`,
  compose: `services:
  api:
    image: app
  redis:
    image: redis
    ports:
      - "6379:6379"`,
  kubernetes: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    spec:
      containers:
        - name: api
          image: registry/app:latest`
} as const;
