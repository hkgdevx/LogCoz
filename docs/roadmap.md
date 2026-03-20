# Roadmap

This page separates what is implemented now from the most likely next extensions.

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

## Highest-Value Next Steps

### 1. Direct Kubernetes runtime collection

Current releases detect Kubernetes patterns when they appear in collected logs, but do not collect from cluster APIs directly.

### 2. Better runtime filtering and prioritization

Potential additions:

- richer source ranking
- explicit source selection presets
- better noisy-source suppression during grouped analysis

### 3. Stronger security coverage

Potential additions:

- more auth and permission incident signatures
- clearer severity scoring
- richer evidence summaries for posture findings

### 4. Richer correlation quality

Potential additions:

- stronger cross-key joins
- better service attribution
- more causal hinting between root cause and symptom events

### 5. Remote and hosted log sources

Deferred for now:

- remote Docker contexts
- cloud log backends
- direct Kubernetes API collection

## Deliberate Non-Goals Right Now

- full vulnerability scanning
- compliance auditing
- a plugin ecosystem before the core runtime flow is mature
