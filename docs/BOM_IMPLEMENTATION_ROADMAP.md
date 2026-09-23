# BOM Implementation Roadmap

Permission-gated phases. **Stop and ask before starting the next phase.**

## Phase 1A — Products & versioned BOM ✅

- Docs (architecture + this roadmap)
- Schema: products, product_versions, boms, bom_items, materials, bom_import_jobs
- Domain: graph, validation, unit reject, CSV/Excel import preview → commit
- UI: Products list, versions, virtualized BOM tree, import wizard
- Soft bridge: Product assessment can store `productId` / `bomId` (calculation disabled)

**Gate:** Ask permission before 1B.

## Phase 1B — Carbon mapping + calculation ✅

- Carbon datasets / emission factors registry
- Mapping with confidence + human approve
- Recursive BOM calculation, scrap/yield, unit normalize
- Carbon ledger + provenance
- Product assessment runs PCF against selected BOM version

**Gate:** Ask permission before 1C.

## Phase 1C — Audit & data quality ✅

- Calculation approval workflow
- DQ dimensions (temporal / geo / tech)
- Stale calculation flags
- Append-only audit trail

**Gate:** Ask permission before 1D.

## Phase 1D — Analytics UX ✅

- Hotspots, BOM carbon explorer, version comparison
- Lifecycle breakdown dashboard

**Gate:** Ask permission before Phase 6 (scenario / what-if).

## Later (permission-gated)

- **6** Scenario / what-if (overrides without mutating baseline)
- **7** Supplier PCF portal & primary data workflows
- **8** ERP / PLM / PDM connectors → canonical BOM
- **9** PACT / Catena-X / DPP readiness adapters

## What not to build first

Microservices sprawl, graph DB, Monte Carlo, full DPP, dozens of ERP connectors — before correct BOM → mapping → deterministic calc → ledger → provenance.
