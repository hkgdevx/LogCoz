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

const MONTH_LOOKUP: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12'
};

export type ParsedTimestampStatus =
  | 'exact'
  | 'inferred-year'
  | 'inferred-date'
  | 'inferred-time'
  | 'missing';

export interface ParsedTimestamp {
  normalized?: string;
  status: ParsedTimestampStatus;
  note?: string;
}

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

export function parseTimestampFromLine(line: string): ParsedTimestamp {
  const isoMatch = line.match(/\b(\d{4}-\d{2}-\d{2}[T ][\d:.+-Z]+)\b/);
  if (isoMatch?.[1]) {
    return {
      normalized: isoMatch[1].replace(' ', 'T'),
      status: 'exact'
    };
  }

  const dateOnlyMatch = line.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (dateOnlyMatch?.[1]) {
    return {
      normalized: `${dateOnlyMatch[1]}T00:00:00`,
      status: 'inferred-time',
      note: 'Time inferred as 00:00:00 from a date-only log line.'
    };
  }

  const syslogMatch = line.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\b/i
  );
  if (syslogMatch?.[1] && syslogMatch[2] && syslogMatch[3]) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = MONTH_LOOKUP[syslogMatch[1].slice(0, 3).toLowerCase()];
    const day = syslogMatch[2].padStart(2, '0');
    return {
      normalized: `${year}-${month}-${day}T${syslogMatch[3]}`,
      status: 'inferred-year',
      note: `Year inferred as ${year} from a syslog-style timestamp.`
    };
  }

  const timeOnlyMatch = line.match(/\b(\d{2}:\d{2}:\d{2})\b/);
  if (timeOnlyMatch?.[1]) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return {
      normalized: `${year}-${month}-${day}T${timeOnlyMatch[1]}`,
      status: 'inferred-date',
      note: `Date inferred as ${year}-${month}-${day} for a time-only log line.`
    };
  }

  return {
    status: 'missing',
    note: 'No usable timestamp was found in the log line.'
  };
}

export function extractTimestampFromLine(line: string): string | undefined {
  return parseTimestampFromLine(line).normalized;
}

export function lineToEvent(line: string): LogEvent {
  const correlationKeys: Record<string, string> = {};

  for (const entry of CORRELATION_PATTERNS) {
    const match = line.match(entry.pattern);
    if (match?.[1]) {
      correlationKeys[entry.key] = match[1];
    }
  }

  const levelMatch = line.match(/\b(INFO|WARN|ERROR|DEBUG|TRACE|FATAL)\b/i);
  const service = extractServiceFromLine(line);
  const parsedTimestamp = parseTimestampFromLine(line);

  return {
    raw: line,
    message: getEventMessage(line),
    ...(parsedTimestamp.normalized ? { timestamp: parsedTimestamp.normalized } : {}),
    ...(levelMatch?.[1] ? { level: levelMatch[1].toUpperCase() } : {}),
    ...(service ? { service } : {}),
    correlationKeys
  };
}
