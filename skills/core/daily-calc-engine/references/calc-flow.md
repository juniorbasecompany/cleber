# Calc Flow

Official daily flow:

1. identify active segments for the date
2. resolve age and other daily state attributes
3. resolve valid parameters and curves
4. apply scope fallback
5. compute direct and derived metrics
6. persist daily materialized facts
7. record provenance and calculation version

Outputs must support later aggregation by any period.
