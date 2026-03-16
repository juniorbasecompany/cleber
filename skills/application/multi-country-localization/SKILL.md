---
name: multi-country-localization
description: Use when designing or reviewing country-aware behavior: optional country in scope, locale-specific labels and formatting, UTC persistence with local rendering, local-currency economic facts, and query-time currency conversion for reports.
---

# Multi Country Localization

Use this skill when the system must behave correctly across more than one country without turning country-specific behavior into core rigidity.

Read these references as needed:
- `references/country-in-scope.md`
- `references/locale-and-timezone.md`
- `references/currency-behavior.md`
- `references/reporting-conversion.md`

## Workflow

1. Decide whether country is required for the specific workflow or only optional in the hierarchy.
2. Distinguish UI defaults from persisted operational context.
3. Keep backend persistence in UTC and rendering in local timezone.
4. Keep economic facts only in local currency.
5. Resolve translated labels and formatted values by locale at display time.
6. Treat cross-currency reporting as a derived query concern.

## Guardrails

- Do not require country on every non-economic path if the operation does not need it.
- Do not let current user context silently become the persisted country of an economic fact.
- Do not store converted values or exchange rates in source economic facts.
- Do not turn weekly behavior into a country-specific operational rule.
- Keep country-specific overrides inside fallback and metadata, not in hardcoded branches.

## Deliverables

- Country-aware scope rules.
- Locale and timezone behavior.
- Local-currency persistence rule.
- Query-time conversion contract for reports.
- Audit boundary for converted financial views.
