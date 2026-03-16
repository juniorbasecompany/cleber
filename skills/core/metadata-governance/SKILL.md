---
name: metadata-governance
description: Use when defining or reviewing configurable attributes, classifications, rules, locale-aware labels, country overrides, units, aggregations, and governed niche catalogs without hardcoding domain columns.
---

# Metadata Governance

Use this skill when the task involves the configurable semantic layer.

Read these references as needed:
- `references/attribute-contract.md`
- `references/rule-catalog.md`
- `references/aggregation-rules.md`

## Workflow

1. Identify which concepts are structural and which are configurable.
2. Define the minimum semantic contract for each attribute.
3. Govern allowed rules, formulas, origins, aggregations, and country overrides.
4. Support translated labels without changing stable technical keys.
5. Keep niche packages on top of this metadata layer.

## Guardrails

- Avoid fixed columns for domain metrics by default.
- Avoid unrestricted EAV with no semantic contract.
- Keep formulas and aggregations governed, not arbitrary text blobs.

## Deliverables

- Attribute contract.
- Catalog of governed rules and classifications.
- Aggregation policy by attribute role.
