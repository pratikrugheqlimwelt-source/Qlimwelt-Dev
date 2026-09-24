# Qlimwelt BOM & Product Carbon Architecture

Condensed architecture for the BOM-native Product Carbon Footprint (PCF) platform.
Full research paper principles apply; this document is the engineering source of truth for implementation.

## Principle

A product is not a single carbon number. It is a **versioned product structure** whose components, materials, processes, suppliers, logistics, and lifecycle activities each contribute measurable emissions.

```text
Product → BOM / Product Structure → Assembly / Component
  → Material / Process / Activity → Activity Data
  → Emission Factor / Supplier PCF / Primary Data
  → Calculation → Emission Contribution
  → Aggregated PCF → Evidence / Provenance / Data Quality
```

## Separation of domains

**Product domain** (structure): Product, Product Version, BOM, BOM Item, Component, Material, Supplier.

**Carbon domain** (factors & evidence): Activity, Activity Data, Emission Factor, Supplier PCF, Dataset, Methodology, Evidence.

**Mapping layer** connects BOM items to carbon datasets. Never embed emission factors inside BOM rows.

## Versioning

Never overwrite historical BOMs, datasets, methodologies, or approved calculations. Use immutable versions and reproducible calculation runs.

## Hybrid product model (locked)

- **Products / BOM versions** are master data under `/dashboard/products`.
- A **Product assessment** selects a BOM version and runs calculation against approved mappings (Phase 1B).
- Do not fold the BOM editor into the corporate assessment wizard.

## Calculation engine (Phase 1B+)

Deterministic graph calculation in application memory after bulk fetch:

- Methods: qty × EF, supplier PCF, activity data, spend-based, process model, transport
- Scrap / yield, unit normalization (reject incompatible units)
- Allocation, lifecycle boundary as first-class config
- Carbon ledger of contributions (not a single overwritten field)
- Incremental recalculation of affected branches only

## Standards awareness

Methodology rules are configurable and versioned (ISO 14067 / ISO 14040-44 aligned; Catena-X / PACT adapters later). Do not hard-code a single standard edition into application code.

## AI boundary

AI may suggest mappings and extract evidence. The deterministic calculation engine remains authoritative. AI never silently becomes the source of truth for approved factors or final PCF.

## Performance

- Bulk queries; no N+1
- In-memory graph calc; batch persistence
- Virtualized BOM UI; never mount full large trees in the DOM
- Large imports / calculations are preview-then-commit (async workers later)

## Related

- [BOM_IMPLEMENTATION_ROADMAP.md](./BOM_IMPLEMENTATION_ROADMAP.md)
- [DASHBOARD_USER_MANUAL.md](./DASHBOARD_USER_MANUAL.md)
