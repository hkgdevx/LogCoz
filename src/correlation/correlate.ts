/**************************************************************************************************************************
 Copyright (c) 2026

     Name: correlate.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import crypto from 'node:crypto';
import { CORRELATION_TIME_WINDOW_MS } from '@/constants/defaults';
import { lineToEvent, pickPrimaryCorrelationKey } from './keys';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
function parseEventTime(timestamp?: string): number | null {
  if (!timestamp) return null;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? null : parsed;
}

function getEventSeverityScore(level?: string): number {
  switch (level?.toUpperCase()) {
    case 'FATAL':
      return 5;
    case 'ERROR':
      return 4;
    case 'WARN':
      return 3;
    case 'INFO':
      return 2;
    case 'DEBUG':
    case 'TRACE':
      return 1;
    default:
      return 0;
  }
}

function sortTimeline(events: LogEvent[]): LogEvent[] {
  return [...events].sort((a, b) => {
    const timeA = parseEventTime(a.timestamp);
    const timeB = parseEventTime(b.timestamp);

    if (timeA !== null && timeB !== null && timeA !== timeB) {
      return timeA - timeB;
    }

    return getEventSeverityScore(b.level) - getEventSeverityScore(a.level);
  });
}

function classifyIncidentHints(events: LogEvent[]): {
  rootCauseHints: string[];
  symptomHints: string[];
} {
  const rootCauseHints = new Set<string>();
  const symptomHints = new Set<string>();

  for (const event of events) {
    if (
      /\b(refused|timed out|failed|exception|crash|panic|oom|certificate)\b/i.test(event.message)
    ) {
      rootCauseHints.add(event.message);
    } else if (/\b(502|503|retry|unhealthy|restarting|degraded)\b/i.test(event.message)) {
      symptomHints.add(event.message);
    }
  }

  return {
    rootCauseHints: [...rootCauseHints].slice(0, 3),
    symptomHints: [...symptomHints].slice(0, 3)
  };
}

// Correlation groups are intentionally deterministic: a stable key, a bounded time window, and
// the strongest available identifier avoid surprising regrouping between runs.
function groupByCorrelationKey(events: LogEvent[]): Array<[string, LogEvent[]]> {
  const groups = new Map<string, LogEvent[]>();

  for (const event of events) {
    const primaryKey = pickPrimaryCorrelationKey(event);
    if (!primaryKey) continue;

    const [key, value] = primaryKey;
    const groupKey = `${key}:${value}`;
    const existing = groups.get(groupKey) ?? [];
    existing.push(event);
    groups.set(groupKey, existing);
  }

  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

function extractSharedKeys(events: LogEvent[]): Record<string, string> {
  if (events.length === 0) return {};

  const first = events[0];
  if (!first) return {};

  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(first.correlationKeys)) {
    const shared = events.every((event) => event.correlationKeys[key] === value);
    if (shared) result[key] = value;
  }

  return result;
}

function deriveIncidentConfidence(events: LogEvent[]): number {
  const base = 0.65;
  const severityBoost = Math.min(0.15, events.some((event) => event.level === 'ERROR') ? 0.1 : 0);
  const timestampBoost = events.some((event) => parseEventTime(event.timestamp) !== null)
    ? 0.05
    : 0;
  const serviceBoost = events.some((event) => event.service) ? 0.05 : 0;
  const densityBoost = Math.min(0.1, events.length * 0.02);

  return Math.min(0.97, base + severityBoost + timestampBoost + serviceBoost + densityBoost);
}

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function correlateLogs(inputs: string[]): CorrelatedIncident[] {
  const events = inputs
    .flatMap((input) => input.split('\n'))
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => lineToEvent(line));

  const grouped = groupByCorrelationKey(events);

  return grouped.map(([groupKey, groupedEvents]) => {
    const timeline = sortTimeline(groupedEvents);
    const { rootCauseHints, symptomHints } = classifyIncidentHints(timeline);
    const start = parseEventTime(timeline[0]?.timestamp);
    const end = parseEventTime(timeline[timeline.length - 1]?.timestamp);

    return {
      id: crypto.createHash('sha1').update(groupKey).digest('hex').slice(0, 12),
      title: `Correlated incident: ${groupKey}`,
      confidence: deriveIncidentConfidence(timeline),
      sharedKeys: extractSharedKeys(timeline),
      timeline,
      rootCauseHints,
      symptomHints,
      metadata: {
        services: [...new Set(timeline.map((event) => event.service).filter(Boolean))],
        timeWindowMs:
          start !== null && end !== null ? Math.min(end - start, CORRELATION_TIME_WINDOW_MS) : null
      }
    };
  });
}
