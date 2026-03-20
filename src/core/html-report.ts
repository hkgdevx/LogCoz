/**************************************************************************************************************************
 Copyright (c) 2026

     Name: html-report.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { CLI_NAME, CLI_VERSION } from '@/constants/meta';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
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
  const summarySection = `<section class="section">
    <h2>Summary</h2>
    <div class="summary-grid">
      ${renderStat('Sources', envelope.result.summary.sourceCount)}
      ${renderStat('Incidents', envelope.result.summary.incidentCount)}
      ${renderStat('Correlations', envelope.result.summary.correlationCount)}
      ${renderStat('Security findings', envelope.result.summary.securityFindingCount)}
    </div>
  </section>`;

  const sourcesSection = `<section class="section">
    <h2>Discovered Sources</h2>
    <div class="stack">
      ${
        envelope.result.sources.length > 0
          ? envelope.result.sources
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

  const incidentsSection = `<section class="section">
    <h2>Prioritized Incidents</h2>
    <div class="stack">
      ${
        envelope.result.incidents.length > 0
          ? envelope.result.incidents
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

  const correlationsSection = `<section class="section">
    <h2>Correlations</h2>
    <div class="stack">
      ${
        envelope.result.correlations.length > 0
          ? envelope.result.correlations
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

  const securitySection = `<section class="section">
    <h2>Security Findings</h2>
    <div class="stack">
      ${
        envelope.result.securityFindings.length > 0
          ? envelope.result.securityFindings
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

  const nextActionsSection = `<section class="section">
    <h2>Next Actions</h2>
    ${renderList(envelope.result.summary.nextActions, 'No follow-up actions generated.')}
  </section>`;

  return renderDocument(
    'Runtime Analysis Report',
    'Grouped incident, correlation, and security findings across discovered runtime sources.',
    [
      summarySection,
      sourcesSection,
      incidentsSection,
      correlationsSection,
      securitySection,
      nextActionsSection
    ]
  );
}
