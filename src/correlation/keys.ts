/**************************************************************************************************************************
 Copyright (c) 2026

     Name: keys.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
const CORRELATION_PATTERNS = [
  { key: 'traceId', pattern: /\btrace[ _-]?id[=: ]([A-Za-z0-9-]+)/i, weight: 4 },
  { key: 'correlationId', pattern: /\bcorrelation[ _-]?id[=: ]([A-Za-z0-9-]+)/i, weight: 3 },
  { key: 'requestId', pattern: /\brequest[ _-]?id[=: ]([A-Za-z0-9-]+)/i, weight: 2 },
  { key: 'jobId', pattern: /\bjob[ _-]?id[=: ]([A-Za-z0-9-]+)/i, weight: 1 }
] as const;

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function pickPrimaryCorrelationKey(event: LogEvent): [string, string] | null {
  const weightedEntries = CORRELATION_PATTERNS.flatMap((entry) => {
    const value = event.correlationKeys[entry.key];
    return value ? [[entry.key, value, entry.weight] as const] : [];
  }).sort((a, b) => b[2] - a[2]);

  const winner = weightedEntries[0];
  return winner ? [winner[0], winner[1]] : null;
}

export function extractServiceFromLine(line: string): string | undefined {
  const patterns = [
    /\bservice[=: ]([a-zA-Z0-9._-]+)/i,
    /\bpod[=: ]([a-zA-Z0-9._-]+)/i,
    /\bcontainer[=: ]([a-zA-Z0-9._-]+)/i,
    /^\[([a-zA-Z0-9._-]+)\]/
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

function getEventMessage(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

export function lineToEvent(line: string): LogEvent {
  const correlationKeys: Record<string, string> = {};

  for (const entry of CORRELATION_PATTERNS) {
    const match = line.match(entry.pattern);
    if (match?.[1]) {
      correlationKeys[entry.key] = match[1];
    }
  }

  const timestampMatch = line.match(/\b(\d{4}-\d{2}-\d{2}[T ][\d:.+-Z]+|\d{2}:\d{2}:\d{2})\b/);
  const levelMatch = line.match(/\b(INFO|WARN|ERROR|DEBUG|TRACE|FATAL)\b/i);
  const service = extractServiceFromLine(line);

  return {
    raw: line,
    message: getEventMessage(line),
    ...(timestampMatch?.[1] ? { timestamp: timestampMatch[1] } : {}),
    ...(levelMatch?.[1] ? { level: levelMatch[1].toUpperCase() } : {}),
    ...(service ? { service } : {}),
    correlationKeys
  };
}
