# Locale And Timezone

Localization rules:

- backend persists timestamps in UTC
- frontend renders dates and times in the local timezone
- labels may vary by locale, but technical keys remain stable
- date, number, and money formatting follow the active locale

Operational rules:

- the business grain remains daily
- weekly views are reporting options only
- no special country-specific weekly control is needed
