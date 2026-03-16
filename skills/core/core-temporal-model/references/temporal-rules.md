# Temporal Rules

Core temporal rules:

- all calculation is daily.
- any weekly, monthly, annual, or custom-period view is derived from daily facts.
- parameter validity starts on the event date and lasts until the next event of the same kind or the end of the entity lifecycle.
- history must be immutable.
- past results must be reconstructable from the rules and events that were valid at that time.
- backend persistence uses UTC timestamps.
- frontend and reports may render dates and times in the user's local timezone or the operation timezone.

Required temporal fields:

- effective date
- event timestamp
- version
- source or origin
- actor or process id when available

Notes:

- UTC persistence does not change the rule that the business grain is still the day.
- weekly logic remains a reporting aggregation, not an operational control layer.
