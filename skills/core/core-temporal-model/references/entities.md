# Entities

Structural entities for the shared core:

- main entity: the biological or operational unit, such as a lote.
- segment: operational subdivision of the main entity.
- hierarchical location: company, unit, farm, nucleus, house, subdivision.
- dated event: changes quantity, rule, parameter, relationship, or state.
- configurable attribute metadata: defines semantics without altering schema.
- daily materialized fact: persisted output for one date, one entity or segment, one attribute, one version.

Boundaries:

- identity, relationships, validity, audit, versioning, and integrity stay in the core.
- niche terms, indicators, formulas, and panel labels stay outside the core.
