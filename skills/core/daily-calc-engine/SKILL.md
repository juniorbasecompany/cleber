---
name: daily-calc-engine
description: Use when implementing or reviewing the daily calculation flow: scope fallback, validity resolution, derived metrics, provenance, and persistence of daily materialized facts.
---

# Daily Calc Engine

Use this skill for the official daily calculation workflow.

Read these references as needed:
- `references/calc-flow.md`
- `references/provenance.md`
- `references/materialized-facts.md`

## Workflow

1. Select the active entity or segment for the date.
2. Resolve valid attributes and rules for that date.
3. Apply governed scope fallback.
4. Resolve classifications and curve references.
5. Calculate derived values.
6. Persist daily facts with provenance and version.

## Guardrails

- Daily is the only native calculation grain.
- Realized data must not overwrite forecast.
- Every computed value must be explainable.

## Deliverables

- Ordered daily calculation flow.
- Provenance contract.
- Daily fact persistence contract.
