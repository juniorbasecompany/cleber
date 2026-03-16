---
name: spreadsheet-migration
description: Use when translating existing spreadsheets into explicit system contracts, mapping tabs and formulas to entities, events, attributes, rules, curves, and daily facts with parity checks.
---

# Spreadsheet Migration

Use this skill when the source of truth or reference behavior is still in spreadsheets.

Read these references as needed:
- `references/workbook-inventory.md`
- `references/mapping-rules.md`
- `references/parity-checks.md`

## Workflow

1. Inventory the workbook, tabs, and relevant outputs.
2. Classify each spreadsheet artifact as entity, event, attribute, rule, curve, fact, or panel output.
3. Convert implicit formulas into governed system logic.
4. Validate parity against daily and aggregated outputs.

## Guardrails

- Do not copy spreadsheet structure directly into the core model.
- Do not leave key business formulas implicit.
- Record ambiguity instead of guessing silently.

## Deliverables

- Workbook inventory.
- Mapping table from spreadsheet logic to system contracts.
- Parity-check plan.
