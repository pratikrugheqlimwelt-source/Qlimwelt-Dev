# Qlimwelt Dashboard — User Manual

A practical guide for sustainability managers, climate analysts, and team members using the Qlimwelt carbon accounting platform.

---

## Table of contents

1. [What Qlimwelt does](#1-what-qlimwelt-does)
2. [Getting started](#2-getting-started)
3. [How the dashboard is organised](#3-how-the-dashboard-is-organised)
4. [Core concepts](#4-core-concepts)
5. [Recommended user journey](#5-recommended-user-journey)
6. [Assessments (guided flow) in detail](#6-assessments-guided-flow-in-detail)
7. [Data Collection (manual entry)](#7-data-collection-manual-entry)
8. [Page-by-page guide](#8-page-by-page-guide)
9. [Filters, search, and notifications](#9-filters-search-and-notifications)
10. [Data storage and modes](#10-data-storage-and-modes)
11. [Tips for audit-ready data](#11-tips-for-audit-ready-data)
12. [Troubleshooting](#12-troubleshooting)
13. [Glossary](#13-glossary)

---

## 1. What Qlimwelt does

Qlimwelt helps your organisation measure, manage, and reduce greenhouse gas (GHG) emissions using the **GHG Protocol** (Scope 1, 2, and 3).

With the dashboard you can:

- Run a **guided assessment** (company → activities that apply → quantities)
- Enter activity data manually when you already know what to collect
- Convert activity into **tonnes of CO₂ equivalent (tCO₂e)** using emission factors
- Track facilities, fleet, and suppliers
- Monitor data quality and attach evidence
- Set science-based style targets and plan reduction initiatives
- Ask **Qlim AI** for hotspot analysis and next steps
- Export reports for disclosure and internal review

**Core calculation:**

```text
tCO₂e = activity value × emission factor ÷ 1000
```

Example: `10,000 kWh × 0.385 kgCO₂e/kWh ÷ 1000 = 3.85 tCO₂e`

**Design principle:**

```text
What does the company do?
        ↓
Which activities apply?
        ↓
How is the data available?
        ↓
What quantity was consumed?
        ↓
Can you provide supporting evidence?
        ↓
Qlimwelt calculates and explains the result
```

---

## 2. Getting started

### 2.1 Sign in

1. Open Qlimwelt and go to **Login**.
2. Sign in with **Google**.
3. You land on the dashboard (**Overview**), or complete onboarding if the workspace is new.

### 2.2 Onboarding (new companies)

New workspaces walk through:

1. Personal details  
2. Company details  
3. Climate maturity  
4. Interests  
5. Review & consent  

Invited users usually join an existing company and skip company creation.

### 2.3 First actions after login

1. Open **Assessments** and create a **Corporate Carbon Footprint**.  
2. Or, if you only need a quick line item, use **Data Collection**.  
3. Confirm company basics under **Settings** (employees, revenue, reporting year, carbon price).

New workspaces start **empty** (no sample inventory). A built-in emission factor library is available for calculations.

---

## 3. How the dashboard is organised

### Analytics

| Page | Purpose |
|------|---------|
| **Overview** | Executive snapshot: total footprint, KPIs, trends |
| **Emissions** | Full inventory by scope, category, and activity line |
| **Data Quality** | Audit readiness scores and weak records |

### Operations

| Page | Purpose |
|------|---------|
| **Assessments** | Guided carbon assessment wizard (recommended) |
| **Data Collection** | Manual / power-user activity entry |
| **Resources** | Master data: facilities, vehicles, suppliers |

### Planning

| Page | Purpose |
|------|---------|
| **Climate Intelligence** | Qlim AI chat + recommendations |
| **Reduction Planner** | Decarbonisation projects and status |
| **Targets** | Science-based style reduction pathway |

### Reporting

| Page | Purpose |
|------|---------|
| **Reports** | PDF / CSV / Excel packages |
| **Team** | Invite and manage colleagues |
| **Settings** | Company profile, carbon price, custom factors, GWP |

### Shell extras

- **Company chip** → Settings  
- **Global search** → pages and activities  
- **Period picker** → focus analytics on a month / year  
- **Notifications** → saves and system messages  
- **Account menu** → profile, team, sign out  
- **Calculation drawer** → opens from Emissions when you inspect a row  

If you see an amber **local storage** banner, cloud tables are unavailable — see [Section 10](#10-data-storage-and-modes).

---

## 4. Core concepts

### 4.1 Scopes

| Scope | Meaning | Examples |
|-------|---------|----------|
| **Scope 1** | Direct emissions you control | Fleet fuel, boilers, refrigerants |
| **Scope 2** | Purchased energy | Electricity, district heat |
| **Scope 3** | Value chain | Goods, freight, travel, commuting, waste |

### 4.2 Assessment vs activity

| Concept | Meaning |
|---------|---------|
| **Assessment** | A guided reporting exercise (name, period, boundaries, screening, modules) |
| **Activity** | One inventory line: quantity × factor → tCO₂e for a period and facility |

Activities created inside an assessment are tagged with that assessment and still appear in **Emissions** / **Overview**.

### 4.3 Resources vs inventory

| Resource | What it stores | When it counts in the footprint |
|----------|----------------|----------------------------------|
| **Facility** | Sites for allocation | When an activity is saved against it |
| **Vehicle** | Fleet master data | When posted to inventory (or linked) |
| **Supplier** | Supplier Scope 3 master data | When posted to inventory (or linked) |

Master data alone does **not** change totals until you save activities.

### 4.4 Emission factors

Factors convert activity units into kgCO₂e.

- Built-in library factors ship with the product  
- Custom factors can be added in **Settings**  
- Higher uncertainty usually lowers data-quality contribution  

### 4.5 Data quality & evidence

- **Data quality score** summarises trustworthiness (method, factor, evidence, estimated vs measured).  
- **Evidence status:** none → pending → uploaded → verified  
- Prefer **measured** values with invoices or meter exports.

### 4.6 Targets & initiatives

- A **climate target** defines baseline, target year, and reduction %.  
- A **reduction initiative** is a project with annual tCO₂e reduction, cost, and status.

---

## 5. Recommended user journey

Use this sequence for a typical reporting cycle:

```text
Create assessment
       ↓
Company profile
       ↓
Select calculation objective (Corporate CCF)
       ↓
Reporting boundaries
       ↓
Operational screening questions
       ↓
Qlimwelt opens relevant emission modules
       ↓
Collect activity data (quantities)
       ↓
Validate and flag missing information
       ↓
Review & mark calculated
       ↓
Dashboard, hotspots and reduction recommendations
```

**Monthly close checklist**

1. Update **Resources** if sites / fleet / suppliers changed  
2. Continue or create an **Assessment** for the period  
3. Complete activated modules (measured + evidence where possible)  
4. Spot-check **Emissions** calculation drawer for large lines  
5. Clear **Data Quality** red / amber items  
6. Confirm **Targets** and **Reduction Planner**  
7. Ask **Climate Intelligence** where to cut next  
8. Export **Reports**  
9. Brief leadership from **Overview**

---

## 6. Assessments (guided flow) in detail

Path: **Operations → Assessments**

### 6.1 Create an assessment

1. Click **New assessment**.  
2. Enter a clear name, for example:
   - `2026 Corporate Carbon Footprint`
   - `Berlin Office Assessment`
3. Choose what to calculate:
   - **A. Corporate Carbon Footprint** — full guided flow (recommended MVP)
   - **B. Product Carbon Footprint** — scaffolded branch (full BOM / PACT later)
   - **C. Event or Project** — coming soon  
   - **D. Supplier Data Collection** — coming soon  
4. Click **Continue**.

### 6.2 Step — Company profile

Capture organisation context once and reuse it.

**Basic fields**

- Legal name, trading name, industry  
- Country of registration, headquarters, website  
- Employees, revenue range, currency  
- Primary / sustainability contacts  

**Organisational structure** (pick one):

| Option | Follow-up examples |
|--------|--------------------|
| One office | Address, floor area, ownership, electricity / heating responsibility |
| Multiple offices | Location count and summary list |
| Manufacturing | Factories, products, refrigeration, process gases |
| Retail / hospitality | Location count/type, refrigeration |
| Logistics / fleet | Vehicle count, fuel types, warehouses |
| Digital / software | Cloud providers, remote-working policy |
| Mixed | Free-text operations summary |

Profile fields sync into **Settings** where possible. A one-office setup can create a starter **facility** if none exist yet.

### 6.3 Step — Reporting boundaries

Before quantities, define the reporting frame:

- Period start / end  
- Base year  
- Reporting standard (GHG Protocol Corporate, Product, PACT, ESRS/CSRD, custom)  
- Consolidation approach (operational / financial / equity / not sure)  
- Included / excluded entities and locations  
- Currency and preferred emission unit  

If you choose **Not sure** for consolidation, Qlimwelt recommends **operational control** and records it as an **assumption** to confirm later.

### 6.4 Step — Operational screening

Answer **yes/no** operational questions. Do **not** enter quantities here.

Examples:

- Own or control buildings?  
- Operate manufacturing?  
- Own or lease vehicles?  
- Burn fuels?  
- Use refrigeration / AC?  
- Purchase electricity / heat?  
- Purchase goods or services?  
- Generate waste?  
- Business travel / commuting?  
- Transport or sell physical products?  

Each “Yes” activates one or more **data modules** (for example, vehicles → mobile combustion; electricity purchase → Scope 2 electricity).

### 6.5 Step — Collect data (modules)

Only activated modules appear. Each module shows progress: **Complete** or **Missing**.

For each module:

1. Confirm how data is available (invoice, meter, spend, estimate, …).  
2. Enter quantity, unit, factor, period, facility.  
3. Mark **Measured** or **Estimated**.  
4. Add a clear source description.  
5. Save — the line is written to the company inventory.

**Phase 1 modules include**

| Module | Typical scope |
|--------|----------------|
| Stationary combustion | Scope 1 |
| Company vehicles | Scope 1 |
| Refrigerants | Scope 1 |
| Process emissions | Scope 1 (if manufacturing) |
| Purchased electricity | Scope 2 |
| Purchased heat / steam | Scope 2 |
| Purchased goods & services | Scope 3 Cat. 1 |
| Waste | Scope 3 Cat. 5 |
| Business travel | Scope 3 Cat. 6 |
| Employee commuting | Scope 3 Cat. 7 |
| Upstream / downstream transport | Scope 3 Cat. 4 / 9 |

**Electricity tip:** location-based results are always stored. If you enter a market-based factor, Qlimwelt can store a separate market-based record — both can be reported.

### 6.6 Step — Review & calculate

The review screen shows:

- **Completeness %** (modules with data vs activated modules)  
- **Calculated tCO₂e so far** from assessment activities  
- **Missing / incomplete modules** (flagged, not blocking)  
- **Assumptions** (e.g. consolidation recommendation)  

You can still calculate with incomplete data. Missing categories remain visible.

Click **Mark calculated & open Emissions** to lock the assessment lightly and jump to the inventory view. Results also feed **Overview** and **Data Quality**.

### 6.7 Assessment statuses

| Status | Meaning |
|--------|---------|
| Draft | Just created |
| In progress | Profile / screening / modules underway |
| Ready for review | Review step opened |
| Calculated | Finalised for this pass |
| Locked | Reserved for stronger lock / assurance later |

---

## 7. Data Collection (manual entry)

Path: **Operations → Data Collection**

Use this when you already know the activity type and want a fast one-off entry (power-user path). Assessments remain the recommended guided journey.

### 7.1 Steps

1. Pick an **activity type** card (electricity, travel, waste, custom, …).  
2. Optionally pick a library **emission factor** (searchable, icon rows).  
3. Enter value, factor, source, period, facility.  
4. Toggle **Measured / Estimated**; add optional notes.  
5. Use period chips (Last month / This month / FY).  
6. Optionally link a vehicle/supplier and attach evidence.  
7. Watch the **live preview**, then **Save to inventory**.

### 7.2 When to use which

| Use **Assessments** when… | Use **Data Collection** when… |
|---------------------------|-------------------------------|
| Starting a reporting year / site footprint | Adding one known invoice line quickly |
| You need screening so only relevant modules appear | Correcting or topping up inventory ad hoc |
| You want completeness tracking by module | You already know scope, category, and factor |

---

## 8. Page-by-page guide

### 8.1 Overview

Leadership snapshot: total footprint, scope mix, intensity KPIs, trends, filters. Empty state points you to start collecting data.

### 8.2 Emissions

Full inventory: scope cards, Scope 3 category charts, activity table. Open a row for the **calculation drawer**. Delete mistaken records with confirmation.

### 8.3 Data Quality

Average score and bands (high / good / moderate / low). Chase estimated or low-evidence lines before audit close.

### 8.4 Resources

- **Facilities** — sites for allocation  
- **Vehicles** — fleet master; CSV bulk where available; post to inventory when ready  
- **Suppliers** — Scope 3 master; post to inventory when ready  

### 8.5 Climate Intelligence

- **Qlim AI chat** — ask about hotspots, scopes, CSRD next steps (uses live inventory when signed in)  
- **Recommendations** — derived insights; some can create / advance reduction initiatives  

AI should assist with classification and explanation; final numbers come from the calculation engine.

### 8.6 Reduction Planner

Add initiatives (name, annual tCO₂e reduction, cost). Advance status: planned → in progress → completed. Review cost-effectiveness.

### 8.7 Targets

View and edit baseline, target year, reduction %, absolute vs intensity. Track pathway progress.

### 8.8 Reports

Export packages such as GHG inventory, scope summary, facility / fleet / travel / supplier views, data quality, target and reduction summaries, carbon cost. Preview and export PDF / CSV / Excel when authenticated.

### 8.9 Team

View members and pending invites. Admins invite by email (role-based) and revoke access when needed.

### 8.10 Settings

Company name, industry, employees, revenue, units produced, baseline / reporting year, carbon price (€/t), GWP values, and **custom emission factors** (appear in Data Collection / modules).

---

## 9. Filters, search, and notifications

### Filters

Shared filters on analytics pages typically include period, facility, country, business unit, scope, category, data quality, and method. Align filters before comparing Overview vs Emissions.

### Search

Shell search jumps between pages and can find activity sources.

### Notifications

Saving assessments / activities creates notifications. Use the bell for recent events.

### Period picker

Focuses analytics on a reporting month or year. Keep assessment activity periods aligned with the period you analyse.

---

## 10. Data storage and modes

| Mode | Meaning | What to do |
|------|---------|------------|
| **Cloud (Supabase)** | Normal connected mode | Work as usual |
| **Local** | Fallback when cloud tables are unreachable | Amber banner; browser storage for that company — reconnect before production close |
| **Empty workspace** | Fresh company | Start with Assessments or Resources |

**Assessments** persist in the `assessments` table when migration `006_assessments.sql` is applied; otherwise they fall back to local storage like other dashboard data.

**Evidence uploads** need cloud storage configured. If upload fails, the activity may still save — re-attach evidence once storage is ready.

---

## 11. Tips for audit-ready data

1. Prefer the **Assessments** guided path so irrelevant categories stay out of scope.  
2. Prefer **measured** over estimated whenever invoices or meters exist.  
3. Write clear **source** strings (site + period + document type).  
4. Attach **evidence** for material Scope 1 and 2 lines.  
5. Keep **facilities** clean — avoid dumping everything into one unnamed site.  
6. Review **Data Quality** during close, not only at year-end.  
7. Freeze **Settings** (reporting year, employees, revenue) before final exports.  
8. Confirm **assumptions** (e.g. consolidation) before locking disclosures.  
9. For fleet and suppliers, post inventory intentionally.  
10. Use Qlim AI for prioritisation; treat inventory + evidence as the system of record.

---

## 12. Troubleshooting

| Problem | Likely cause | What to try |
|---------|--------------|-------------|
| Cannot open dashboard | Session expired | Login again with Google |
| Redirected to onboarding | Incomplete setup | Finish onboarding |
| No modules after screening | All answers No | Re-run screening with applicable Yes answers |
| Cannot save module activity | Missing facility / fields | Add a facility under Resources; fill quantity, factor, source |
| Assessment not in cloud | Migration 006 not applied | Run SQL migration or use local fallback meantime |
| Evidence upload error | Storage not configured | Activity may still save; fix storage and retry |
| Amber local-data banner | Cloud unavailable | Check connection / admin config |
| Qlim AI unavailable | LLM provider not configured | Admin: configure Ollama (local) or Groq (cloud) |
| Totals look wrong | Filters / period mismatch | Reset filters; check activity periods |
| Intensity KPIs odd | Missing employees / revenue | Update Settings |

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **tCO₂e** | Tonnes of carbon dioxide equivalent |
| **Assessment** | Guided reporting exercise with screening and modules |
| **Module** | Emission data collection block activated by screening |
| **GHG Protocol** | Global standard for corporate GHG accounting |
| **Scope 1 / 2 / 3** | Direct / purchased energy / value-chain emissions |
| **Activity data** | Physical or spend quantity (kWh, litres, €, km…) |
| **Emission factor** | kgCO₂e per unit of activity |
| **Location-based** | Grid-average electricity / heat accounting |
| **Market-based** | Contractual instruments (e.g. Guarantees of Origin) |
| **Consolidation** | How group entities are included (operational / financial / equity) |
| **Evidence** | Supporting document for an activity line |
| **DQ score** | Data quality score for audit readiness |
| **SBT** | Science-based style reduction target |
| **CSRD / ESRS** | EU sustainability reporting context |
| **Qlim AI** | In-product assistant for climate analysis |

---

## Quick reference

| Goal | Go to |
|------|--------|
| Start a footprint the right way | **Assessments → New** |
| Add one quick line | **Data Collection** |
| Add sites / fleet / suppliers | **Resources** |
| See totals and trends | **Overview** |
| Inspect every line | **Emissions** |
| Fix weak data | **Data Quality** |
| Ask for hotspots | **Climate Intelligence** |
| Plan reductions | **Reduction Planner** / **Targets** |
| Export disclosure packs | **Reports** |
| Invite colleagues | **Team** |
| Company & factors | **Settings** |

---

*This manual describes the Qlimwelt dashboard as implemented in the product UI, including the guided Assessments pipeline. Feature availability (email invites, evidence storage, AI providers, cloud assessments) depends on your deployment configuration and applied database migrations.*
