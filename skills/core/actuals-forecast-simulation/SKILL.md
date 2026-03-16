---
name: actuals-forecast-simulation
description: Use when handling the analytical layers of the system: baseline forecast, realized data, corrected forecast, scenario simulation, and reconciliation between them.
---

# Actuals Forecast Simulation

Use this skill when the task touches analytical layers rather than only the structural model.

Read these references as needed:
- `references/forecast-modes.md`
- `references/reconciliation.md`
- `references/scenario-model.md`

## Workflow

1. Identify which layer the task belongs to.
2. Keep forecast, actuals, corrected forecast, and simulation separate.
3. Compare layers through shared daily facts and governed aggregations.
4. Preserve auditability across recalculations.

## Guardrails

- Never overwrite baseline forecast with realized data.
- Simulation must be isolated from production history.
- Corrected forecast must declare its correction rule.

## Deliverables

- Layer definitions.
- Reconciliation rules.
- Scenario isolation rules.
