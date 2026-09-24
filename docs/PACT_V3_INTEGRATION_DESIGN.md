# Phase 2 — PACT V3 Integration Design

**Status:** Complete — design locked; implementation starts at Phase 3a  
**Depends on:** Phase 0 audit (Full BOM = operational multi-level tree; PCF engine exists; Phase 9 readiness stubs only)  
**Pinned external contract:** [PACT Technical Specifications for PCF Data Exchange **v3.0.3**](https://wbcsd.github.io/data-exchange-protocol/v3/)  
**Authoritative schema:** OpenAPI at [docs.carbon-transparency.org](https://docs.carbon-transparency.org/) / [specs.carbon-transparency.org](https://specs.carbon-transparency.org/) (v3)  
**Methodology companion:** PACT Methodology 3.0 (accounting guidance — not the wire format)  
**Stack base:** BOM Phase 9 (`cursor/bom-phase-9-c4ee`)

---

## 1. Design principles (locked)

1. **PACT is an interoperability boundary**, not the internal domain model.
2. **Reuse** Product → ProductVersion → BOM → Mapping → `calculateBomPcf` → Ledger → `PcfCalculation` → Supplier PCF request flow.
3. **Do not rebuild** BOM tree, calc engine, factor registry, or corporate GHG inventory.
4. **Replace Phase 9 readiness stubs** with a real V3 mapper that validates against the official OpenAPI schema (do not invent fields).
5. **Version boundary:** internal Qlimwelt model ↔ `PactV3Mapper` only. Future V4 = new mapper, same internal model.
6. **Two validation layers:** schema (OpenAPI) vs semantic/business (identity, units, validity, mapping).

---

## 2. Target architecture

```text
                    QLIMWELT INTERNAL (existing)
┌──────────────────────────────────────────────────────────┐
│ Product / ProductVersion / BOM / BomItem                 │
│ EmissionFactor / CarbonMapping / SupplierPcfRequest      │
│ calculateBomPcf → CarbonLedger → PcfCalculation          │
│ Approval / DQ / Stale / Audit / Scenarios                │
└───────────────────────────┬──────────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │   PACT ADAPTER (new)      │
              │  pact/                    │
              │   schemas/   (pinned OAS) │
              │   mapper/    (in ↔ out)   │
              │   validator/ (schema+sem) │
              │   identity/  (URN map)    │
              │   client/    (HTTP+OAuth) │
              │   exchange/  (state+idem) │
              │   events/    (CloudEvents)│
              └─────────────┬─────────────┘
                            │
              PACT V3.0.3 wire format
              GET/POST /3/footprints
              POST /3/events
              OAuth2 client_credentials
```

**Folder proposal (adapt to repo conventions):**

```text
src/lib/bom/carbon/pact/
  index.ts
  types.ts              # thin wrappers / branded ids — not a second domain
  schema/               # vendored/pinned OpenAPI + generated types (or runtime AJV)
  mapper/
    to-product-footprint.ts   # export: PcfCalculation → ProductFootprint
    from-product-footprint.ts # import: ProductFootprint → SupplierPcfRecord
  validator/
    schema.ts                 # OpenAPI validation
    semantic.ts               # business rules
  identity/
    urn.ts                    # build/parse productIds / companyIds URNs
    mapping-service.ts
  client/
    oauth.ts
    footprints-client.ts      # ListFootprints / GetFootprint
    events-client.ts          # Action Events
  exchange/
    service.ts                # create/list exchanges, idempotency
    store.ts                  # local + Supabase persistence
```

APIs stay under existing `/api/bom/...` style (or `/api/bom/pact/...`), not a parallel micro-app.

---

## 3. Domain mapping (internal ↔ PACT)

### 3.1 Concept map

| PACT V3 concept | Qlimwelt source | Mapping notes |
|-----------------|-----------------|---------------|
| `ProductFootprint` | Approved `PcfCalculation` + `Product` + BOM fingerprints | One exportable footprint per approved baseline calc (not scenario) |
| `ProductFootprint.id` | Stable UUID stored on export record / calc metadata | Do not reuse calc id blindly if calc can be superseded; prefer dedicated `pact_footprint_id` |
| `specVersion` | Constant from pinned adapter (`"3.0.0"` / patch per OAS) | From schema, not invented |
| `companyIds[]` (URN) | Company identity + new identity mapping table | Must be non-empty URN set |
| `productIds[]` (URN) | Product number / GTIN / supplier part via identity map | Must be non-empty URN set |
| `productNameCompany` | `Product.name` | Required for humans |
| `pcf` (`CarbonFootprint`) | `PcfCalculation.totalKgco2e` + declared unit + DQ + methodology | Unit enum must match PACT declared units |
| Declared unit | `PcfCalculation.declaredUnit` / product declared unit | Map `piece`/`kg`/… → PACT `declaredUnitOfMeasurement` + `declaredUnitAmount` |
| Reference / validity periods | New fields on export profile or calc metadata | Partially missing today — **minimum extension** |
| `crossSectoralStandards` | Methodology config / constant `PACT-3.0` + ISO refs | Do not hard-code only one forever; store on export profile |
| DQI / verification | Internal DQ score → map carefully to PACT `DataQualityIndicators` / `Verification` | Never invent fake assurance |
| Extensions | Optional Qlimwelt provenance extension | BOM id, calc id, ledger count — via `DataModelExtension`, not fake core fields |
| Inbound supplier PCF | New durable `SupplierPcfRecord` (or extend request) + raw payload | Today’s `SupplierPcfRequest` is a **workflow**; keep it, add durable record |
| Carbon source after import | Existing mapping method `supplier_pcf` + synthetic EF (Phase 7) | Keep; add explicit source selection audit |

### 3.2 What we will NOT map 1:1 into DB columns

Do **not** create a table per PACT property. Persist:

- Internal domain objects (existing)
- Raw validated payload (JSONB) for audit/replay
- Mapping / exchange state
- Only the few missing internal fields needed for correct export (reference period, product URNs, etc.)

---

## 4. Database changes (additive only)

### 4.1 New tables (proposed)

**`pact_endpoints`**

| Column | Purpose |
|--------|---------|
| id, company_id | Tenant scope |
| name, base_url | Peer host |
| protocol_version | e.g. `3.0.3` |
| auth_type | `oauth2_client_credentials` |
| client_id | Non-secret |
| client_secret_ref | Reference into secrets store / vault — **never plaintext** |
| status | active/disabled |
| last_success_at, last_error | Ops |

**`product_identity_mappings`**

| Column | Purpose |
|--------|---------|
| company_id, product_id (nullable), bom_item_id (nullable) | Internal anchor |
| scheme | e.g. `custom`, `gtin`, `supplier_part`, `urn` |
| value / urn | External identifier |
| status | candidate / confirmed / rejected |
| confidence | Optional manual/system score — **not** PACT DQI |
| source | manual / import / connector |

**`supplier_pcf_records`** (durable external PCF; distinct from request workflow)

| Column | Purpose |
|--------|---------|
| company_id, supplier_id | Who provided it |
| product_identity_urns | From inbound `productIds` |
| declared unit + amounts | From `CarbonFootprint` |
| pcf values (excluding/including biogenic as available) | |
| reference / validity periods | |
| geography | |
| cross_sectoral_standards, secondary sources | |
| verification_json | Store as received |
| dqi_json | Store as received — do not invent |
| pact_spec_version | |
| raw_payload jsonb | Full ProductFootprint |
| status | received / mapped / accepted / rejected / expired |
| mapped_bom_item_id | After semantic mapping |
| resulting_factor_id / mapping_id | Link to Phase 7 path |

**`pact_exchanges`**

| Column | Purpose |
|--------|---------|
| direction | inbound / outbound |
| kind | list / get / export / import / event_* |
| endpoint_id | nullable for file upload |
| idempotency_key | unique per company |
| correlation_id / request_id | Observability |
| status | pending / validated / mapped / completed / failed |
| http_status, error_code, error_detail | Safe errors only |
| footprint_id | PACT id if known |
| calculation_id / supplier_pcf_record_id | Internal links |
| request_payload_ref / response_payload_ref | Or inline jsonb |
| created_at, completed_at | |

### 4.2 Optional columns on existing tables

- `products`: none required if identity table covers URNs  
- `pcf_calculations`: optional `pact_footprint_id`, `reference_period_start/end`  
- **No destructive drops**

### 4.3 Local-store mirror

Extend `BomLocalState` with parallel arrays for endpoints/exchanges/identity/records so offline/demo mode keeps working (same pattern as Phases 1–9).

---

## 5. API design (Qlimwelt-facing)

Follow existing `/api/bom/...` + `requireCompanyAuth` + local fallback.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/bom/pact/readiness?calculationId=` | Keep/extend Phase 9 checklist (real gates) |
| POST | `/api/bom/pact/export` | `{ calculationId }` → schema-validated ProductFootprint + exchange log |
| POST | `/api/bom/pact/validate` | Validate arbitrary JSON (schema + optional semantic) |
| POST | `/api/bom/pact/import` | Upload/ingest ProductFootprint → supplier_pcf_record |
| GET/POST | `/api/bom/pact/exchanges` | List / inspect exchange history |
| CRUD | `/api/bom/pact/endpoints` | Endpoint config (secrets via ref) |
| CRUD | `/api/bom/pact/identity-mappings` | Product URN mappings |
| POST | `/api/bom/pact/exchanges/{id}/accept` | Accept mapped supplier PCF → existing approve→EF path |
| POST | `/api/bom/pact/exchanges/{id}/reject` | Reject |

**PACT peer-facing host surface (Phase 6 of plan — later):**

| PACT action | Path |
|-------------|------|
| ListFootprints | `GET /3/footprints` |
| GetFootprint | `GET /3/footprints/{id}` |
| Events | `POST /3/events` |
| Token | OAuth2 token endpoint (existing or dedicated) |

Do **not** implement peer host until export/import file flows are proven.

---

## 6. Flows

### 6.1 Export

```text
Approved PcfCalculation (baseline, not stale)
  → load Product + identity URNs + declared unit mapping
  → PactV3Mapper.toProductFootprint()
  → SchemaValidator.validate(ProductFootprint)
  → SemanticValidator.exportChecks()  // periods, standards, geography
  → persist pact_exchanges (outbound) + optional publish record
  → return JSON / download
```

**Hard gates (fail export):** calc not completed; not approved; stale; scenario-only; missing companyIds/productIds URNs; undeclared unit cannot map to PACT enum.

### 6.2 Import

```text
Receive payload (file/API)
  → authenticate caller (company auth)
  → SchemaValidator (OpenAPI)        // layer 1
  → SemanticValidator                // layer 2: periods, units, unknown supplier product
  → IdentityResolver (exact / manual candidates only — no silent fuzzy)
  → create supplier_pcf_record (status=received|mapped)
  → optional review UI
  → Accept → reuse Phase 7: synthetic EF + mapping method supplier_pcf
  → mark BOM mappings / calcs stale as needed
```

**Never** auto-apply inbound PCF to calculations without explicit accept (reuse review pattern).

### 6.3 Network (later)

OAuth2 `client_credentials` → Bearer token → List/Get footprints; Events as CloudEvents (`RequestCreated` / `Fulfilled` / `Rejected` / `Published`). Idempotent exchange keys prevent duplicate records on retry.

---

## 7. Validation model

### Layer 1 — Schema

- Validate against **pinned** OpenAPI 3.0.3 schema (AJV or equivalent).
- Required types, enums, formats, non-empty `companyIds` / `productIds`, `pcf` object presence.

### Layer 2 — Semantic / business

Examples:

- Product URN not mapped to any Qlimwelt product/BOM item  
- Declared unit incompatible with BOM item unit  
- Validity period ended  
- Reference period missing when required by our export profile  
- Biogenic fields blank vs 0 policy  
- Cannot attach to BOM item without user confirm  
- Cross-tenant product id  

Return structured error categories: `SCHEMA_INVALID` | `SEMANTIC_INVALID` | `AUTH` | `NOT_FOUND` | `CONFLICT` | `UPSTREAM`.

---

## 8. Identity mapping rules

- Support URN forms per PACT § Product Identifier URNs (exact parse/build helpers).
- Matching modes: **exact confirmed**, **manual map**, **candidate list** (shown to user).
- **Forbidden:** silent fuzzy auto-assign of supplier PCF to BOM line.
- Confidence on mapping ≠ PACT data quality indicators.

---

## 9. Carbon source selection (explicit)

Keep Phase 7 path (supplier PCF → EF + `supplier_pcf` mapping) but add audit metadata:

```text
BomItem → CarbonMapping
  method: qty_x_ef | supplier_pcf | …
  emissionFactorId
  provenance: { source: 'supplier_pcf_record' | 'library', recordId?, pactExchangeId? }
```

No hard-coded global “always prefer supplier” without transparency in ledger provenance (already partially present).

---

## 10. Security model

| Control | Approach |
|---------|----------|
| AuthN/Z | Existing `requireCompanyAuth` + company RLS |
| Secrets | `client_secret_ref` only; env/vault |
| SSRF | Allowlist HTTPS hosts; block private IPs/link-local; timeout |
| Payload limits | Max body size on import/events |
| Idempotency | Unique `(company_id, idempotency_key)` |
| Audit | Append to existing BOM audit + exchange table |
| Errors | No secret leakage |
| Peer webhook authenticity | Signature/auth per PACT directory guidance when enabling events |

---

## 11. Observability

Per exchange: `requestId`, `exchangeId`, company, endpoint, direction, duration, HTTP status, `specVersion`, schema result, semantic result, mapping result, error category.  
Never log tokens/secrets/raw credentials.

---

## 12. Frontend integration (no separate PACT app)

Extend existing BOM editor panels:

1. **Readiness panel** — upgrade checklist to real V3 gates + Export V3 JSON  
2. **Supplier PCF panel** — “Import PACT ProductFootprint” + review queue  
3. **New lightweight sections:** Identity mappings, Exchange history, Endpoints (admin)

Product carbon summary should surface: total PCF, BOM coverage, supplier PCFs available, PACT connection status, actions (import/export/history).

Reuse existing dash-card / button patterns.

---

## 13. Testing plan

| Layer | Cases |
|-------|--------|
| Schema | Official / derived fixtures: valid PF, missing required, bad enum, empty productIds |
| Mapper export | Approved calc → PF; reject stale/scenario; unit mapping |
| Mapper import | PF → supplier_pcf_record; raw payload preserved |
| Semantic | Unmapped URN; expired validity; unit mismatch |
| Exchange | Idempotent retry; duplicate prevention |
| Security | Unauthorized; cross-company; oversized payload; blocked URL |
| Regression | Existing `test:bom:*` suite must stay green |

Fixtures: `src/lib/bom/carbon/pact/fixtures/` — prefer official examples from WBCSD repo where license allows; mark derived fixtures clearly.

---

## 14. Migration plan

1. Ship additive migrations (endpoints, identity, supplier_pcf_records, exchanges).  
2. Keep Phase 9 readiness module temporarily; route UI “Export PACT” to V3 mapper when ready; deprecate stub shapes.  
3. Dual-write local-store mirrors.  
4. No rewrite of calc/BOM.  
5. Feature-flag `PACT_V3_ENABLED` for network client.

---

## 15. Performance notes

- Export/import are O(1) calc + O(ledger) serialization — OK.  
- Hosting `GET /3/footprints` for large catalogs needs pagination (`Link` next) and indexes on company_id, footprint id, product URN.  
- Do not call external PACT peers from page render; use explicit user action / background job later.

---

## 16. Implementation sequence (after this design)

| Step | Scope | Stop / ask |
|------|--------|------------|
| **3a** | Migrations + local-store types for endpoints, identity, exchanges, supplier_pcf_records | After schema lands |
| **3b** | Pin OpenAPI + schema validator + URN helpers | |
| **3c** | Export mapper + `/api/bom/pact/export` + UI wire (replace stub download) | Demo export |
| **4** | Import + semantic validation + review accept→Phase 7 EF path | Demo import |
| **5** | Exchange history + identity mapping UI | |
| **6** | OAuth client + List/Get against peer (optional host later) | Ask before network |
| **7** | UI polish on product PCF summary | |

---

## 17. Explicit non-goals (this initiative)

- Rebuilding BOM or PCF calc  
- Full Digital Product Passport  
- Live ERP sync workers  
- Silent auto-application of supplier PCFs  
- Inventing PACT fields not in OpenAPI 3.0.3  
- Making internal tables isomorphic to ProductFootprint

---

## 18. Acceptance for Phase 2 (design complete when)

- [x] External contract pinned (v3.0.3 + OpenAPI authority)  
- [x] Adapter vs internal model boundary defined  
- [x] Domain mapping table written  
- [x] Additive DB plan  
- [x] API / UI / security / test / migration plans  
- [x] Clear handoff to Phase 3a without rebuilding BOM/PCF  

**Next step (Phase 3a):** implement additive schema + TypeScript types + empty service stubs (no mapper / no peer host yet).

---

## 19. Architecture audit constraints (locked for later phases)

Read-only audit of the BOM/PCF stack confirmed the following; PACT work must not fight them:

1. **Calc engine stays authoritative** — reuse `calculateBomPcf` / ledger / mapping; PACT is an export/import adapter only (Phases 3c–4 already follow this).
2. **Dual persistence today** — product/BOM structure can live in Supabase (migrations 008+); carbon/PCF/scenarios/supplier-PCF/readiness runtime is largely **local-store**. PACT tables/APIs follow the same local-first pattern until a dedicated persistence phase lands carbon domain in Postgres.
3. **Phase 9 readiness ≠ PACT V3** — readiness builders stamp `*-readiness` / Pathfinder-like stubs. Real V3 OpenAPI 3.0.3 payloads replace stub download paths; do not treat Phase 9 JSON as exchange-legal.
4. **CCF stays separate** — corporate inventory (`calculations/engine`, dashboard activities) must not be merged into the BOM PCF engine; link by product/BOM ids only if needed.
5. **Supplier accept path** — inbound PACT footprints become durable `supplier_pcf_records`, then explicit accept → synthetic EF + `supplier_pcf` mapping (same pattern as Phase 7 portal approval). No silent fuzzy bind.
6. **Still out of scope here** — live ERP OAuth sync, certified Pathfinder network exchange hosting, Monte Carlo uncertainty, spend/transport method engines, full DPP.

**Phase 5+ should prioritize:** exchange history + identity mapping UI, then optional peer `/3` host stubs — not a calc rewrite or CCF merge.
