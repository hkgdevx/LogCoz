/**************************************************************************************************************************
 Copyright (c) 2026

     Name: redact.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function redactSecrets(input: string): string {
  return input
    .replace(/(password\s*[=:]\s*)(.+)/gi, '$1[REDACTED]')
    .replace(/(token\s*[=:]\s*)(.+)/gi, '$1[REDACTED]')
    .replace(/(secret\s*[=:]\s*)(.+)/gi, '$1[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, '$1[REDACTED]')
    .replace(/(postgres(?:ql)?:\/\/[^:\s]+:)([^@\s]+)(@)/gi, '$1[REDACTED]$3')
    .replace(/(redis:\/\/[^:\s]+:)([^@\s]+)(@)/gi, '$1[REDACTED]$3');
}
