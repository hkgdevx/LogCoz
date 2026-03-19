/**************************************************************************************************************************
 Copyright (c) 2026

     Name: signals.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
export const SIGNAL_PATTERNS: RegExp[] = [
  /error/i,
  /exception/i,
  /ECONNREFUSED/i,
  /EADDRINUSE/i,
  /ENOENT/i,
  /ENOTFOUND/i,
  /502 Bad Gateway/i,
  /connect\(\) failed/i,
  /password authentication failed/i,
  /WRONGPASS/i,
  /NOAUTH/i,
  /upstream prematurely closed connection/i,
  /address already in use/i,
  /timeout/i,
  /certificate/i,
  /TLS/i,
  /out of memory/i,
  /OOMKilled/i,
  /ImagePullBackOff/i,
  /CrashLoopBackOff/i,
  /mysql/i,
  /mongo/i,
  /kafka/i,
  /rabbitmq/i
];
