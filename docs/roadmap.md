# Roadmap

This page separates what is implemented now from the next planned milestones.
It is intentionally implementation-oriented: each milestone is scoped tightly enough
to pick up later without re-deciding the product direction.

## Implemented Today

- file-based explanation with `explain <file>`
- stdin-based explanation with `paste`
- Docker explanation with `explain docker`
- file-based correlation with `correlate <files...>`
- Docker correlation with `correlate docker`
- grouped local runtime analysis with `analyze`
- stable JSON envelopes for `explain`, `paste`, `correlate`, and `analyze`
- first-class runtime targeting for Redis, PostgreSQL, MongoDB, Nginx, generic app containers, and local system/SSH logs
- evidence-based security findings and posture hints
- packaged CLI smoke verification before release publish
- self-contained HTML reports for `correlate`, `correlate docker`, and `analyze`
- timeline-first reconnaissance reports with `analyze --recon`
- inferred chronology labeling for partial timestamps in recon reports

## Next Milestones

### 1. Runtime Source Quality and Selection

Goal:
Make local runtime collection more reliable, more intentional, and less noisy during
system scans and grouped analysis.

Why it matters:
The current local-first workflow is only as good as the sources it chooses. Better
source selection improves every downstream report, especially `analyze` and recon
HTML output.

Concrete capability additions:

- stronger discovery and ranking for local Docker containers and system sources
- service-specific source presets for PostgreSQL, Redis, MongoDB, Nginx, SSH, and
  generic app services
- better include/exclude behavior when users mix `--include-services`,
  `--exclude-sources`, `--container`, and `--service`
- noisy-source suppression so high-volume but low-signal logs do not dominate the
  scan result
- clearer explainability for why a source was selected or deprioritized

Main implementation areas:

- runtime discovery and classification
- source ranking heuristics
- scan metadata and source summaries
- CLI selection semantics for runtime commands

Acceptance criteria:

- system scans consistently surface the most relevant local sources first
- noisy or duplicate sources are suppressed without hiding likely root-cause logs
- source filtering behaves predictably across Docker and system collection
- reports clearly show which sources were included and why

Non-goals for this milestone:

- remote Docker contexts
- cloud log backends
- direct Kubernetes collection
- major detector expansion unrelated to source selection

Dependencies / sequencing:
This milestone should land before deeper recon and correlation improvements because
cleaner source inputs make chronology and incident grouping materially better.

### 2. Recon and Chronology Quality

Goal:
Make timeline-first reconnaissance reports more trustworthy and easier to read for
real mixed-format logs.

Why it matters:
Recon reports are useful only when users can understand what happened, in what
order, and how much of that chronology is inferred versus exact.

Concrete capability additions:

- better incident-window construction across mixed exact, inferred, and untimed log
  lines
- stronger grouping of related events into coherent time windows
- clearer chronology labeling for inferred year, date, or time
- better presentation of supporting untimed evidence without polluting the primary
  timeline
- improved readability for dense timelines, long evidence lines, and multi-source
  event sequences

Main implementation areas:

- timestamp normalization and inference metadata
- recon window building and merge logic
- timeline rendering in HTML reports
- fallback behavior when chronology is partial or weak

Acceptance criteria:

- recon reports remain understandable for common host, container, and syslog-style
  formats
- inferred chronology is clearly labeled and never presented as exact
- untimed lines still contribute as supporting evidence without breaking the main
  chronology
- timeline windows read as coherent incident windows rather than fragmented events

Non-goals for this milestone:

- exporting recon-specific JSON contracts
- adding recon mode to `correlate`
- introducing separate time-bucket dashboards or interactive browser apps

Dependencies / sequencing:
This milestone depends on better source quality first. It should be strengthened
before broader remote collection so chronology semantics stay clear while the scope
is still local-first.

### 3. Correlation Quality and Incident Linking

Goal:
Improve cross-source incident grouping so app, proxy, database, cache, and system
events link more accurately into a single explanation.

Why it matters:
Current grouped reports are useful, but fragmented incidents still reduce operator
confidence and make root cause harder to spot quickly.

Concrete capability additions:

- stronger multi-key joins across request ids, trace ids, job ids, connection ids,
  host/service names, and bounded time windows
- better service attribution when generic app logs mention downstream services
- clearer symptom-to-root-cause linking between frontend, proxy, app, and backend
  events
- fewer duplicate or near-duplicate incidents in grouped reports
- better surfaced correlation evidence and confidence reasoning

Main implementation areas:

- correlation key extraction and weighting
- incident grouping and de-duplication
- service attribution heuristics
- report summaries for grouped findings

Acceptance criteria:

- common multi-source incidents group into fewer, clearer findings
- root-cause hints are easier to distinguish from downstream symptoms
- correlation metadata is strong enough to explain why events were grouped
- reports reduce obvious fragmentation across app, Nginx, PostgreSQL, Redis,
  MongoDB, and system logs

Non-goals for this milestone:

- full distributed tracing ingestion
- external APM integrations
- cloud-native observability vendor support

Dependencies / sequencing:
This milestone should follow source quality improvements and should largely precede
deeper security output, because better incident linking improves security signal
quality too.

### 4. Security Signal Depth

Goal:
Expand runtime security coverage while making findings more precise and less generic.

Why it matters:
Users need security findings that classify clearly, separate incident findings from
posture findings, and avoid collapsing varied auth or permission problems into
unknown buckets.

Concrete capability additions:

- broader SSH, auth, TLS, certificate, permission, and access-denied signatures
- better severity calibration for incident versus posture findings
- richer evidence summaries and clearer recommended actions
- cleaner classification for repeated probing, failed auth loops, weak auth hints,
  and security-relevant runtime failures
- fewer generic or `Unknown issue` style findings where evidence is specific enough

Main implementation areas:

- detector coverage and pattern specificity
- severity and recommendation heuristics
- security-focused report sections and evidence summaries
- incident versus posture classification boundaries

Acceptance criteria:

- common SSH/auth/TLS/permission failures classify cleanly and consistently
- security findings carry more precise severity and clearer recommendations
- repeated attack or auth-loop patterns show as security findings without obscuring
  the underlying incident type
- generic security output is reduced meaningfully in real host and container logs

Non-goals for this milestone:

- vulnerability scanning
- CVE enrichment
- compliance or audit reporting
- host hardening enforcement

Dependencies / sequencing:
This milestone benefits from stronger incident linking first so security findings can
inherit cleaner grouped evidence instead of trying to compensate for fragmented
correlation.

### 5. Kubernetes and Remote Runtime Collection

Goal:
Extend the local-first runtime model to direct Kubernetes and remote targets without
weakening the current explicit, evidence-based UX.

Why it matters:
Once local collection, chronology, and grouping are mature, broader runtime sources
become the next meaningful expansion path for real production environments.

Concrete capability additions:

- direct Kubernetes collection for pods, workloads, and cluster-relevant runtime
  logs
- explicit remote target support where the operator intentionally points LogCoz at a
  non-local runtime
- preserved source summaries and correlation behavior across local and remote
  collection modes
- clear target scoping so broad scans remain understandable

Main implementation areas:

- runtime collectors beyond local Docker and local system sources
- target selection and authentication UX
- source metadata and target labeling
- safe defaults that avoid surprising broad collection

Acceptance criteria:

- direct Kubernetes or remote-target collection works with the same grouped-analysis
  model used for local scans
- target scope remains explicit and understandable in reports
- local-first workflows stay simple and are not degraded by remote support
- reports continue to explain source origin clearly across mixed target types

Non-goals for this milestone:

- broad cloud log backend ingestion
- vendor-specific observability platform integrations
- turning LogCoz into a general-purpose remote fleet management tool

Dependencies / sequencing:
This is intentionally last in the near-term sequence. Local runtime quality,
recon trustworthiness, correlation quality, and security signal depth should be
solid first.

## Deferred Later

These remain out of the near-term milestone wave unless promoted deliberately:

- full vulnerability scanning
- compliance or audit features
- a plugin ecosystem before the core runtime flow is mature
- cloud log backends before local and explicit remote collection are mature
- large integrations that bypass the current local-first, evidence-based workflow
