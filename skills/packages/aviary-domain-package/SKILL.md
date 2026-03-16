---
name: aviary-domain-package
description: Use when working with aviculture-specific vocabulary, entities, events, age-based curves, classifications, KPIs, validations, and business semantics on top of the shared core, including global curves with optional country and local overrides.
---

# Aviary Domain Package

Use this skill for aviculture semantics. Pair it with one or more core skills when the task affects structure or calculation.

Read these references as needed:
- `references/domain-vocabulary.md`
- `references/aviary-entities.md`
- `references/aviary-events.md`
- `references/aviary-curves.md`
- `references/aviary-kpis.md`
- `references/aviary-validations.md`

## Workflow

1. Translate the business term into structural entities and configurable metadata.
2. Keep aviculture semantics in the package, not in the core schema.
3. Use age-based curves and governed event catalogs.
4. Treat global curves as defaults and allow country or local overrides through fallback.
5. Validate outputs against the expected daily operational reality.

## Guardrails

- Do not assume every niche has aviculture concepts.
- Do not turn package vocabulary into structural column names.
- Keep domain formulas and validations explicit.

## Deliverables

- Domain vocabulary mapping.
- Aviary event and curve definitions.
- KPI and validation guidance.
