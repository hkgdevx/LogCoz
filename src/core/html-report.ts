/**************************************************************************************************************************
 Copyright (c) 2026

     Name: html-report.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { CLI_NAME, CLI_VERSION } from '@/constants/meta';
import {
  lineToEvent,
  parseTimestampFromLine,
  type ParsedTimestampStatus
} from '@/correlation/keys';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
interface ReconTimelineWindow {
  id: string;
  title: string;
  startTimestamp: string;
  endTimestamp: string;
  durationLabel: string;
  sourceNames: string[];
  serviceTypes: ServiceType[];
  events: LogEvent[];
  incidentTitles: string[];
  correlationKeys: Record<string, string>;
  recommendations: string[];
  supportingEvidence: string[];
  hasInferredTimestamps: boolean;
  inferenceLabels: string[];
}

interface ReconTimelineEvent {
  event: LogEvent;
  timestampStatus: ParsedTimestampStatus;
  timestampNote?: string;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderList(items: string[], emptyMessage: string): string {
  if (items.length === 0) {
    return `<p class="muted">${escapeHtml(emptyMessage)}</p>`;
  }

  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderKeyValueList(values: Record<string, string>): string {
  const entries = Object.entries(values);
  if (entries.length === 0) {
    return '<p class="muted">No shared correlation keys</p>';
  }

  return `<ul>${entries
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`)
    .join('')}</ul>`;
}

function renderBadge(
  label: string,
  tone: 'neutral' | 'high' | 'medium' | 'low' = 'neutral'
): string {
  return `<span class="badge badge-${tone}">${escapeHtml(label)}</span>`;
}

function renderDocument(title: string, subtitle: string, sections: string[]): string {
  const generatedAt = new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f1ea;
        --panel: #fffdf8;
        --panel-strong: #fff8eb;
        --ink: #18212b;
        --muted: #55606c;
        --line: #d8d2c6;
        --accent: #135d66;
        --accent-soft: #e0f0ee;
        --high: #9f2d2d;
        --high-soft: #fbe3e0;
        --medium: #9a5b11;
        --medium-soft: #fdebcf;
        --low: #2f6b3b;
        --low-soft: #e3f5e7;
        --shadow: 0 18px 40px rgba(20, 28, 38, 0.08);
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
        background:
          radial-gradient(circle at top right, rgba(19, 93, 102, 0.08), transparent 24rem),
          linear-gradient(180deg, #f6f3ec 0%, var(--bg) 100%);
        color: var(--ink);
      }

      .page {
        max-width: 1080px;
        margin: 0 auto;
        padding: 32px 20px 48px;
      }

      .hero {
        background: linear-gradient(135deg, #173b4f, #135d66);
        color: #f8fbfc;
        padding: 28px;
        border-radius: 24px;
        box-shadow: var(--shadow);
      }

      .hero h1 {
        margin: 0 0 8px;
        font-size: 2rem;
        line-height: 1.15;
      }

      .hero p {
        margin: 0;
        color: rgba(248, 251, 252, 0.84);
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }

      .section {
        background: var(--panel);
        border: 1px solid rgba(216, 210, 198, 0.9);
        border-radius: 20px;
        padding: 22px;
        margin-top: 20px;
        box-shadow: var(--shadow);
        min-width: 0;
      }

      .section h2, .section h3 {
        margin: 0 0 12px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 14px;
      }

      .stat {
        background: var(--panel-strong);
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 16px;
      }

      .stat-label {
        color: var(--muted);
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .stat-value {
        margin-top: 8px;
        font-size: 1.7rem;
        font-weight: 700;
      }

      .card {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 18px;
        background: #fffefa;
        min-width: 0;
      }

      .stack {
        display: grid;
        gap: 14px;
      }

      .card-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .muted {
        color: var(--muted);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 0.82rem;
        font-weight: 700;
        border: 1px solid transparent;
        background: #edf1f3;
        color: var(--ink);
      }

      .badge-neutral { background: var(--accent-soft); color: var(--accent); }
      .badge-high { background: var(--high-soft); color: var(--high); }
      .badge-medium { background: var(--medium-soft); color: var(--medium); }
      .badge-low { background: var(--low-soft); color: var(--low); }

      .timeline {
        margin: 0;
        padding: 0;
        list-style: none;
        border-left: 3px solid var(--accent-soft);
      }

      .timeline li {
        position: relative;
        margin-left: 16px;
        padding: 0 0 14px 14px;
      }

      .timeline li::before {
        content: "";
        position: absolute;
        left: -10px;
        top: 4px;
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--accent);
      }

      code {
        font-family: Consolas, "Courier New", monospace;
        background: #eff3f5;
        border-radius: 8px;
        padding: 2px 6px;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      ul {
        margin: 0;
        padding-left: 18px;
      }

      li,
      p,
      h1,
      h2,
      h3,
      h4,
      .muted,
      .stat-value,
      .timeline li div {
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .timeline-recon {
        display: grid;
        gap: 18px;
      }

      .timeline-window {
        position: relative;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: linear-gradient(180deg, #fffefa 0%, #fffaf0 100%);
        padding: 18px 18px 18px 24px;
        box-shadow: var(--shadow);
      }

      .timeline-window::before {
        content: "";
        position: absolute;
        top: 18px;
        bottom: 18px;
        left: 12px;
        width: 4px;
        border-radius: 999px;
        background: linear-gradient(180deg, var(--accent), rgba(19, 93, 102, 0.2));
      }

      .time-range {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        margin-bottom: 8px;
      }

      .time-label {
        font-weight: 700;
        color: var(--accent);
      }

      .event-list {
        display: grid;
        gap: 12px;
        margin-top: 14px;
      }

      .event-row {
        border: 1px solid var(--line);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.8);
        padding: 12px 14px;
      }

      .event-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-bottom: 6px;
      }

      .event-time {
        font-weight: 700;
        color: var(--ink);
      }

      .recon-note {
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        background: var(--panel-strong);
        border: 1px solid var(--line);
        color: var(--muted);
      }

      .log-line {
        display: block;
        margin: 0;
        padding: 10px 12px;
        border-radius: 12px;
        background: #eff3f5;
        font-family: Consolas, "Courier New", monospace;
        font-size: 0.95rem;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .footer {
        margin-top: 20px;
        color: var(--muted);
        text-align: center;
        font-size: 0.92rem;
      }

      @media (max-width: 720px) {
        .page { padding: 18px 14px 30px; }
        .hero { padding: 22px; border-radius: 18px; }
        .section { padding: 18px; border-radius: 16px; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
        <div class="meta">
          ${renderBadge(`${CLI_NAME} v${CLI_VERSION}`)}
          ${renderBadge(`Generated ${generatedAt}`)}
          ${renderBadge('Self-contained offline report')}
        </div>
      </section>
      ${sections.join('')}
      <p class="footer">Generated by ${escapeHtml(
        CLI_NAME
      )}. This HTML report is fully self-contained and can be opened offline in any browser.</p>
    </main>
  </body>
</html>`;
}

function renderStat(label: string, value: string | number): string {
  return `<div class="stat"><div class="stat-label">${escapeHtml(
    label
  )}</div><div class="stat-value">${escapeHtml(String(value))}</div></div>`;
}

function renderCorrelateMetadata(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) {
    return '<p class="muted">No additional correlation metadata</p>';
  }

  const sourceNames = Array.isArray(metadata.sourceNames)
    ? metadata.sourceNames.map((value) => String(value))
    : [];
  const sourceKinds = Array.isArray(metadata.sourceKinds)
    ? metadata.sourceKinds.map((value) => String(value))
    : [];
  const filesAnalyzed =
    typeof metadata.filesAnalyzed === 'number' ? metadata.filesAnalyzed : undefined;
  const sourcesAnalyzed =
    typeof metadata.sourcesAnalyzed === 'number' ? metadata.sourcesAnalyzed : undefined;

  return [
    filesAnalyzed !== undefined ? `<p><strong>Files analyzed:</strong> ${filesAnalyzed}</p>` : '',
    sourcesAnalyzed !== undefined
      ? `<p><strong>Sources analyzed:</strong> ${sourcesAnalyzed}</p>`
      : '',
    sourceNames.length > 0
      ? `<p><strong>Source names:</strong> ${escapeHtml(sourceNames.join(', '))}</p>`
      : '',
    sourceKinds.length > 0
      ? `<p><strong>Source kinds:</strong> ${escapeHtml(sourceKinds.join(', '))}</p>`
      : ''
  ]
    .filter(Boolean)
    .join('');
}

function renderTimeline(timeline: LogEvent[]): string {
  if (timeline.length === 0) {
    return '<p class="muted">No timeline events</p>';
  }

  return `<ol class="timeline">${timeline
    .map(
      (event) =>
        `<li><div><strong>${escapeHtml(
          event.timestamp ?? 'unknown-time'
        )}</strong></div><div>${escapeHtml(event.message)}</div></li>`
    )
    .join('')}</ol>`;
}

function toSeverityTone(severity: SecurityFinding['severity']): 'high' | 'medium' | 'low' {
  return severity;
}

function parseEventTime(timestamp?: string): number | null {
  if (!timestamp) return null;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? null : parsed;
}

function isInferredTimestamp(status: ParsedTimestampStatus): boolean {
  return status !== 'exact' && status !== 'missing';
}

function toInferenceLabel(status: ParsedTimestampStatus): string | null {
  switch (status) {
    case 'inferred-year':
      return 'Inferred year';
    case 'inferred-date':
      return 'Inferred date';
    case 'inferred-time':
      return 'Inferred time';
    default:
      return null;
  }
}

function formatClockLabel(timestamp: string): string {
  const isoTimeMatch = timestamp.match(/T(\d{2}:\d{2}:\d{2})/);
  if (isoTimeMatch?.[1]) {
    return isoTimeMatch[1];
  }

  const timeMatch = timestamp.match(/(\d{2}:\d{2}:\d{2})/);
  return timeMatch?.[1] ?? timestamp;
}

function formatDurationLabel(start: number, end: number): string {
  const deltaMs = Math.max(0, end - start);
  if (deltaMs < 1000) return 'instant';
  if (deltaMs < 60_000) return `${Math.round(deltaMs / 1000)}s`;
  if (deltaMs < 3_600_000) return `${Math.round(deltaMs / 60_000)}m`;
  return `${Math.round(deltaMs / 3_600_000)}h`;
}

function incidentMatchesCorrelation(
  incident: AnalyzeIncident,
  correlation: CorrelatedIncident
): boolean {
  const keyEntries = Object.entries(incident.relatedCorrelationKeys);
  const sharedKeyMatch =
    keyEntries.length > 0 &&
    keyEntries.every(([key, value]) => correlation.sharedKeys[key] === value);

  const correlationServices = Array.isArray(correlation.metadata?.services)
    ? correlation.metadata.services.map((service) => String(service)).filter(Boolean)
    : [];

  const serviceOverlap = incident.sourceNames.some((name) => correlationServices.includes(name));
  return sharedKeyMatch || serviceOverlap;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function toReconTimelineEvent(event: LogEvent): ReconTimelineEvent {
  const parsed = parseTimestampFromLine(event.raw);
  return {
    event,
    timestampStatus: parsed.status,
    ...(parsed.note ? { timestampNote: parsed.note } : {})
  };
}

function buildReconTimelineWindows(result: AnalyzeOutputResult): ReconTimelineWindow[] {
  const windows: ReconTimelineWindow[] = [];
  const coveredIncidentIds = new Set<string>();

  for (const correlation of result.correlations) {
    const timedEvents = correlation.timeline
      .map((event) => toReconTimelineEvent(event))
      .filter((item) => parseEventTime(item.event.timestamp) !== null);
    if (timedEvents.length === 0) {
      continue;
    }

    const startTimestamp = timedEvents[0]?.event.timestamp;
    const endTimestamp = timedEvents[timedEvents.length - 1]?.event.timestamp;
    const startTime = parseEventTime(startTimestamp);
    const endTime = parseEventTime(endTimestamp);

    if (!startTimestamp || !endTimestamp || startTime === null || endTime === null) {
      continue;
    }

    const linkedIncidents = result.incidents.filter((incident) =>
      incidentMatchesCorrelation(incident, correlation)
    );
    for (const incident of linkedIncidents) {
      coveredIncidentIds.add(incident.id);
    }

    const sourceNames = uniqueStrings([
      ...timedEvents.map((item) => item.event.service ?? ''),
      ...linkedIncidents.flatMap((incident) => incident.sourceNames)
    ]);
    const serviceTypes = [...new Set(linkedIncidents.flatMap((incident) => incident.serviceTypes))];
    const inferenceLabels = uniqueStrings(
      timedEvents.map((item) => toInferenceLabel(item.timestampStatus) ?? '').filter(Boolean)
    );

    windows.push({
      id: correlation.id,
      title: linkedIncidents[0]?.title ?? correlation.title,
      startTimestamp,
      endTimestamp,
      durationLabel: formatDurationLabel(startTime, endTime),
      sourceNames,
      serviceTypes,
      events: timedEvents.map((item) => item.event),
      incidentTitles: uniqueStrings(linkedIncidents.map((incident) => incident.title)),
      correlationKeys: correlation.sharedKeys,
      recommendations: uniqueStrings(
        linkedIncidents.flatMap((incident) => incident.suggestedFixes).slice(0, 4)
      ),
      supportingEvidence: uniqueStrings(
        linkedIncidents.flatMap((incident) => incident.evidence).slice(0, 4)
      ),
      hasInferredTimestamps: timedEvents.some((item) => isInferredTimestamp(item.timestampStatus)),
      inferenceLabels
    });
  }

  for (const incident of result.incidents) {
    if (coveredIncidentIds.has(incident.id)) {
      continue;
    }

    const timedEvents = incident.evidence
      .map((line) => {
        const event = lineToEvent(line);
        const parsed = parseTimestampFromLine(line);
        return {
          event,
          timestampStatus: parsed.status,
          timestampNote: parsed.note
        };
      })
      .filter((item) => parseEventTime(item.event.timestamp) !== null);
    if (timedEvents.length === 0) {
      continue;
    }

    const startTimestamp = timedEvents[0]?.event.timestamp;
    const endTimestamp = timedEvents[timedEvents.length - 1]?.event.timestamp;
    const startTime = parseEventTime(startTimestamp);
    const endTime = parseEventTime(endTimestamp);

    if (!startTimestamp || !endTimestamp || startTime === null || endTime === null) {
      continue;
    }

    const inferenceLabels = uniqueStrings(
      timedEvents.map((item) => toInferenceLabel(item.timestampStatus) ?? '').filter(Boolean)
    );

    windows.push({
      id: incident.id,
      title: incident.title,
      startTimestamp,
      endTimestamp,
      durationLabel: formatDurationLabel(startTime, endTime),
      sourceNames: incident.sourceNames,
      serviceTypes: incident.serviceTypes,
      events: timedEvents.map((item) => item.event),
      incidentTitles: [incident.title],
      correlationKeys: incident.relatedCorrelationKeys,
      recommendations: incident.suggestedFixes.slice(0, 4),
      supportingEvidence: incident.evidence.slice(0, 4),
      hasInferredTimestamps: timedEvents.some((item) => isInferredTimestamp(item.timestampStatus)),
      inferenceLabels
    });
  }

  return windows.sort((left, right) => {
    const leftTime = parseEventTime(left.startTimestamp) ?? 0;
    const rightTime = parseEventTime(right.startTimestamp) ?? 0;
    return leftTime - rightTime;
  });
}

function renderReconTimelineSection(result: AnalyzeOutputResult): string {
  const windows = buildReconTimelineWindows(result);
  if (windows.length === 0) {
    return `<section class="section">
      <h2>Timeline Recon</h2>
      <p class="muted">Recon chronology could not be constructed from the collected timestamps. Showing the standard analyze layout instead.</p>
    </section>`;
  }

  const hasInferredTimeline = windows.some((window) => window.hasInferredTimestamps);

  return `<section class="section">
    <h2>Timeline Recon</h2>
    ${
      hasInferredTimeline
        ? '<p class="recon-note">Some timeline entries use inferred chronology for partial timestamps. These windows are labeled explicitly.</p>'
        : ''
    }
    <div class="timeline-recon">
      ${windows
        .map(
          (window) => `<article class="timeline-window">
            <div class="time-range">
              <span class="time-label">${escapeHtml(
                formatClockLabel(window.startTimestamp)
              )} to ${escapeHtml(formatClockLabel(window.endTimestamp))}</span>
              ${renderBadge(`Window ${window.durationLabel}`)}
              ${window.hasInferredTimestamps ? renderBadge('Partial chronology', 'medium') : ''}
              ${window.inferenceLabels.map((label) => renderBadge(label, 'medium')).join('')}
              ${window.sourceNames.map((source) => renderBadge(source)).join('')}
              ${window.serviceTypes.map((service) => renderBadge(service)).join('')}
            </div>
            <h3>${escapeHtml(window.title)}</h3>
            ${
              window.incidentTitles.length > 0
                ? `<p class="muted">Linked findings: ${escapeHtml(
                    window.incidentTitles.join(', ')
                  )}</p>`
                : ''
            }
            ${
              Object.keys(window.correlationKeys).length > 0
                ? `<div>${renderKeyValueList(window.correlationKeys)}</div>`
                : ''
            }
            <div class="event-list">
              ${window.events
                .map((event) => {
                  const parsed = parseTimestampFromLine(event.raw);
                  return `<div class="event-row">
                    <div class="event-meta">
                      <span class="event-time">${escapeHtml(
                        formatClockLabel(event.timestamp ?? 'unknown-time')
                      )}</span>
                      ${
                        toInferenceLabel(parsed.status)
                          ? renderBadge(toInferenceLabel(parsed.status)!, 'medium')
                          : ''
                      }
                      ${event.service ? renderBadge(event.service) : ''}
                      ${event.level ? renderBadge(event.level) : ''}
                    </div>
                    <p class="log-line">${escapeHtml(event.message)}</p>
                    ${parsed.note ? `<p class="muted">${escapeHtml(parsed.note)}</p>` : ''}
                  </div>`;
                })
                .join('')}
            </div>
            ${
              window.supportingEvidence.length > 0
                ? `<h4>Supporting evidence</h4>${renderList(
                    window.supportingEvidence,
                    'No supporting evidence'
                  )}`
                : ''
            }
            ${
              window.recommendations.length > 0
                ? `<h4>Recommended actions</h4>${renderList(
                    window.recommendations,
                    'No recommendations'
                  )}`
                : ''
            }
          </article>`
        )
        .join('')}
    </div>
  </section>`;
}

function renderAnalyzeSummarySection(result: AnalyzeOutputResult): string {
  return `<section class="section">
    <h2>Summary</h2>
    <div class="summary-grid">
      ${renderStat('Sources', result.summary.sourceCount)}
      ${renderStat('Incidents', result.summary.incidentCount)}
      ${renderStat('Correlations', result.summary.correlationCount)}
      ${renderStat('Security findings', result.summary.securityFindingCount)}
    </div>
  </section>`;
}

function renderAnalyzeSourcesSection(result: AnalyzeOutputResult): string {
  return `<section class="section">
    <h2>Discovered Sources</h2>
    <div class="stack">
      ${
        result.sources.length > 0
          ? result.sources
              .map(
                (source) => `<article class="card">
                  <div class="card-header">
                    <div>
                      <h3>${escapeHtml(source.displayName)}</h3>
                      <p class="muted">${escapeHtml(source.id)}</p>
                    </div>
                    <div>
                      ${renderBadge(source.kind)}
                      ${renderBadge(source.serviceType)}
                    </div>
                  </div>
                  <p><strong>Collection window:</strong> ${escapeHtml(
                    source.metadata.window ?? 'default collector window'
                  )}</p>
                  <p><strong>Collection command:</strong> <code>${escapeHtml(
                    source.metadata.command ?? 'collector-managed'
                  )}</code></p>
                </article>`
              )
              .join('')
          : '<p class="muted">No sources discovered.</p>'
      }
    </div>
  </section>`;
}

function renderAnalyzeOverviewSection(result: AnalyzeOutputResult): string {
  const discoveredServices = Array.isArray(result.metadata?.serviceTypesDiscovered)
    ? result.metadata.serviceTypesDiscovered.map((item) => String(item))
    : [];

  return `<section class="section">
    <h2>Scan Overview</h2>
    <p><strong>Top findings:</strong> ${escapeHtml(
      result.summary.topIssueTitles.join(', ') || 'No prioritized incidents'
    )}</p>
    <p><strong>Services discovered:</strong> ${escapeHtml(
      discoveredServices.join(', ') || 'None'
    )}</p>
  </section>`;
}

function renderAnalyzeIncidentsSection(result: AnalyzeOutputResult): string {
  return `<section class="section">
    <h2>Prioritized Incidents</h2>
    <div class="stack">
      ${
        result.incidents.length > 0
          ? result.incidents
              .map(
                (incident) => `<article class="card">
                  <div class="card-header">
                    <div>
                      <h3>${escapeHtml(incident.title)}</h3>
                      <p class="muted">${escapeHtml(
                        incident.category
                      )} incident across ${escapeHtml(incident.sourceNames.join(', '))}</p>
                    </div>
                    ${renderBadge(`Confidence ${(incident.confidence * 100).toFixed(0)}%`)}
                  </div>
                  <p>${escapeHtml(incident.explanation)}</p>
                  <h4>Evidence</h4>
                  ${renderList(incident.evidence, 'No evidence captured')}
                  <h4>Likely causes</h4>
                  ${renderList(incident.likelyCauses, 'No likely causes')}
                  <h4>Suggested fixes</h4>
                  ${renderList(incident.suggestedFixes, 'No suggested fixes')}
                  <h4>Related correlation keys</h4>
                  ${renderKeyValueList(incident.relatedCorrelationKeys)}
                </article>`
              )
              .join('')
          : '<p class="muted">No incidents detected.</p>'
      }
    </div>
  </section>`;
}

function renderAnalyzeCorrelationsSection(result: AnalyzeOutputResult): string {
  return `<section class="section">
    <h2>Correlations</h2>
    <div class="stack">
      ${
        result.correlations.length > 0
          ? result.correlations
              .map(
                (incident) => `<article class="card">
                  <div class="card-header">
                    <div>
                      <h3>${escapeHtml(incident.title)}</h3>
                      <p class="muted">Confidence ${(incident.confidence * 100).toFixed(0)}%</p>
                    </div>
                    ${renderBadge(`Events ${incident.timeline.length}`)}
                  </div>
                  <h4>Shared keys</h4>
                  ${renderKeyValueList(incident.sharedKeys)}
                  <h4>Timeline</h4>
                  ${renderTimeline(incident.timeline)}
                </article>`
              )
              .join('')
          : '<p class="muted">No cross-source correlations were generated.</p>'
      }
    </div>
  </section>`;
}

function renderAnalyzeSecuritySection(result: AnalyzeOutputResult): string {
  return `<section class="section">
    <h2>Security Findings</h2>
    <div class="stack">
      ${
        result.securityFindings.length > 0
          ? result.securityFindings
              .map(
                (finding) => `<article class="card">
                  <div class="card-header">
                    <div>
                      <h3>${escapeHtml(finding.title)}</h3>
                      <p class="muted">${escapeHtml(finding.kind)} finding</p>
                    </div>
                    ${renderBadge(finding.severity.toUpperCase(), toSeverityTone(finding.severity))}
                  </div>
                  <h4>Evidence</h4>
                  ${renderList(finding.evidence, 'No supporting evidence')}
                  <h4>Recommendation</h4>
                  <p>${escapeHtml(finding.recommendation)}</p>
                </article>`
              )
              .join('')
          : '<p class="muted">No security findings.</p>'
      }
    </div>
  </section>`;
}

function renderAnalyzeNextActionsSection(result: AnalyzeOutputResult): string {
  return `<section class="section">
    <h2>Next Actions</h2>
    ${renderList(result.summary.nextActions, 'No follow-up actions generated.')}
  </section>`;
}

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function renderCorrelateHtmlReport(envelope: CorrelateOutputEnvelope): string {
  const summarySection = `<section class="section">
    <h2>Summary</h2>
    <div class="summary-grid">
      ${renderStat('Incidents', envelope.result.count)}
      ${renderStat(
        'Files',
        typeof envelope.result.metadata?.filesAnalyzed === 'number'
          ? envelope.result.metadata.filesAnalyzed
          : 0
      )}
      ${renderStat(
        'Sources',
        typeof envelope.result.metadata?.sourcesAnalyzed === 'number'
          ? envelope.result.metadata.sourcesAnalyzed
          : 0
      )}
    </div>
  </section>`;

  const metadataSection = `<section class="section">
    <h2>Collected Inputs</h2>
    ${renderCorrelateMetadata(envelope.result.metadata)}
  </section>`;

  const incidentsSection = `<section class="section">
    <h2>Incident Groups</h2>
    <div class="stack">
      ${
        envelope.result.incidents.length > 0
          ? envelope.result.incidents
              .map(
                (incident) => `<article class="card">
                  <div class="card-header">
                    <div>
                      <h3>${escapeHtml(incident.title)}</h3>
                      <p class="muted">Confidence ${(incident.confidence * 100).toFixed(0)}%</p>
                    </div>
                    ${renderBadge(`Timeline events ${incident.timeline.length}`)}
                  </div>
                  <h4>Shared keys</h4>
                  ${renderKeyValueList(incident.sharedKeys)}
                  <h4>Root-cause hints</h4>
                  ${renderList(incident.rootCauseHints, 'No root-cause hints')}
                  <h4>Symptom hints</h4>
                  ${renderList(incident.symptomHints, 'No symptom hints')}
                  <h4>Timeline</h4>
                  ${renderTimeline(incident.timeline)}
                </article>`
              )
              .join('')
          : '<p class="muted">No correlated incidents found.</p>'
      }
    </div>
  </section>`;

  return renderDocument(
    'Correlation Report',
    'Grouped incident view across files or runtime sources.',
    [summarySection, metadataSection, incidentsSection]
  );
}

export function renderAnalyzeHtmlReport(envelope: AnalyzeOutputEnvelope): string {
  const discoveryMode =
    typeof envelope.result.metadata?.discoveryMode === 'string'
      ? envelope.result.metadata.discoveryMode
      : 'guided-auto';
  const reportMode =
    typeof envelope.result.metadata?.reportMode === 'string'
      ? envelope.result.metadata.reportMode
      : 'standard';
  const title = discoveryMode === 'system-scan' ? 'System Scan Report' : 'Runtime Analysis Report';
  const subtitle =
    discoveryMode === 'system-scan'
      ? 'System-wide scan across local Docker containers and host service logs.'
      : 'Grouped incident, correlation, and security findings across discovered runtime sources.';

  const summarySection = renderAnalyzeSummarySection(envelope.result);
  const sourcesSection = renderAnalyzeSourcesSection(envelope.result);
  const incidentsSection = renderAnalyzeIncidentsSection(envelope.result);
  const correlationsSection = renderAnalyzeCorrelationsSection(envelope.result);
  const securitySection = renderAnalyzeSecuritySection(envelope.result);
  const nextActionsSection = renderAnalyzeNextActionsSection(envelope.result);

  if (reportMode === 'recon') {
    const reconSection = renderReconTimelineSection(envelope.result);
    const reconHasWindows = !reconSection.includes('Recon chronology could not be constructed');
    return renderDocument(title, subtitle, [
      summarySection,
      sourcesSection,
      renderAnalyzeOverviewSection(envelope.result),
      reconSection,
      ...(reconHasWindows ? [] : [incidentsSection, correlationsSection]),
      securitySection,
      nextActionsSection
    ]);
  }

  return renderDocument(title, subtitle, [
    summarySection,
    sourcesSection,
    incidentsSection,
    correlationsSection,
    securitySection,
    nextActionsSection
  ]);
}
