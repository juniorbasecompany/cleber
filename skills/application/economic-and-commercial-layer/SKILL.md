---
name: economic-and-commercial-layer
description: Use when modeling or reviewing the daily economic and commercial layer: local-currency price, revenue, costs, margin, profit, operational balance, and report-time currency conversion from production to commercial units.
---

# Economic And Commercial Layer

Use this skill for the business layer that extends beyond technical production.

Read these references as needed:
- `references/economic-model.md`
- `references/commercial-flow.md`
- `references/contribution-margin.md`

## Workflow

1. Start from daily production facts.
2. Convert technical outputs into commercial and economic measures in the operation's local currency.
3. Preserve daily revenue, cost, and margin facts only in local currency.
4. Treat any other currency as a derived reporting view resolved at query time.
5. Audit financial history only in local currency.
6. Aggregate later by week, month, year, or any period.

## Guardrails

- Do not model economics only at weekly level.
- Do not detach cost and revenue from the same daily analytical base.
- Keep unit conversion rules explicit.
- Do not persist exchange rates or converted currency values in the original economic fact.
- Require a persisted country or equivalent local-currency context for any economic operation.
- Do not treat converted reports as auditable source financial history.

## Deliverables

- Daily economic model.
- Commercial flow mapping.
- Margin and profit contract.
- Audit boundary between local-currency facts and converted reports.
