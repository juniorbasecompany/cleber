# Reporting Conversion

Cross-currency reporting rules:

- conversion exists only in query or report execution
- the conversion uses the record timestamp
- the conversion uses the local currency implied by the persisted record country
- the conversion uses the target currency requested by the user at view time
- converted reports are presentational views only
- converted reports do not replace or alter the auditable local-currency fact

Implication:

- converted reports may vary if the exchange-rate source changes its historical series
- this does not affect the auditability of the local-currency financial fact
