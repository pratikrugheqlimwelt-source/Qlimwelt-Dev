# Qlimwelt Dashboard — User Manual

A practical guide for sustainability managers, climate analysts, and team members using the Qlimwelt carbon accounting platform.

---

## Table of contents

1. [What Qlimwelt does](#1-what-qlimwelt-does)
2. [Getting started](#2-getting-started)
3. [How the dashboard is organised](#3-how-the-dashboard-is-organised)
4. [Core concepts](#4-core-concepts)
5. [Recommended workflow](#5-recommended-workflow)
6. [Page-by-page guide](#6-page-by-page-guide)
7. [Data Collection in detail](#7-data-collection-in-detail)
8. [Filters, search, and notifications](#8-filters-search-and-notifications)
9. [Data storage and modes](#9-data-storage-and-modes)
10. [Tips for audit-ready data](#10-tips-for-audit-ready-data)
11. [Troubleshooting](#11-troubleshooting)
12. [Glossary](#12-glossary)

---

## 1. What Qlimwelt does

Qlimwelt helps your organisation measure, manage, and reduce greenhouse gas (GHG) emissions using the **GHG Protocol** structure (Scope 1, 2, and 3).

With the dashboard you can:

- Enter activity data (fuel, electricity, travel, waste, goods, and more)
- Convert activity into **tonnes of CO₂ equivalent (tCO₂e)** using emission factors
- Track facilities, fleet, and suppliers
- Monitor data quality and attach evidence (invoices, meters, spreadsheets)
- Set science-based style targets and plan reduction initiatives
- Ask **Qlim AI** for hotspot analysis and next steps
- Export reports for disclosure and internal review

**Core calculation:**

```text
tCO₂e = activity value × emission factor ÷ 1000
```

Example: `10,000 kWh × 0.385 kgCO₂e/kWh ÷ 1000 = 3.85 tCO₂e`

---

## 2. Getting started

### 2.1 Sign in

1. Go to the Qlimwelt site and open **Login**.
2. Sign in with **Google**.
3. After authentication you land on the dashboard (usually **Overview**), or continue onboarding if your workspace is new.

### 2.2 Onboarding (new companies)

If you are creating a new company workspace, complete the onboarding steps:

1. **Personal** — your profile basics  
2. **Company** — organisation name and context  
3. **Climate maturity** — where you are on your climate journey  
4. **Interests** — focus areas that personalise guidance  
5. **Review & consent** — confirm and create the workspace  

If you were **invited** to an existing company, you typically skip company creation and join that workspace directly.

### 2.3 First login expectations

- New workspaces start **empty** (no sample inventory loaded automatically).
- You will still see a built-in **emission factor library** you can use when entering data.
- Best first actions: add at least one **facility** under Resources, then enter your first activity under **Data Collection**.

---

## 3. How the dashboard is organised

The left sidebar groups pages by job:

### Analytics

| Page | Purpose |
|------|---------|
| **Overview** | Executive snapshot: total footprint, KPIs, trends |
| **Emissions** | Full inventory by scope, category, and activity line |
| **Data Quality** | Audit readiness scores and weak records |

### Operations

| Page | Purpose |
|------|---------|
| **Data Collection** | Enter new emission activities |
| **Resources** | Master data: facilities, vehicles, suppliers |

### Planning

| Page | Purpose |
|------|---------|
| **Climate Intelligence** | Qlim AI chat + AI recommendations |
| **Reduction Planner** | Decarbonisation projects and status |
| **Targets** | Science-based style reduction pathway |

### Reporting

| Page | Purpose |
|------|---------|
| **Reports** | PDF / CSV / Excel disclosure packages |
| **Team** | Invite and manage colleagues |
| **Settings** | Company profile, carbon price, custom factors, GWP |

### Shell extras (top / sidebar)

- **Company chip** — quick path toward Settings  
- **Global search** — jump to pages or find activities  
- **Period picker** — focus analytics on a month or reporting year  
- **Notifications** — activity saves and system messages  
- **Account menu** — profile, team, sign out  
- **Calculation drawer** — opens from Emissions when you inspect a row  

If you see an amber banner about **local storage**, your browser is holding data locally because cloud tables are unavailable — see [Section 9](#9-data-storage-and-modes).

---

## 4. Core concepts

### 4.1 Scopes (GHG Protocol)

| Scope | Meaning | Typical examples in Qlimwelt |
|-------|---------|------------------------------|
| **Scope 1** | Direct emissions you control | Fleet fuel, natural gas boilers, refrigerant leaks |
| **Scope 2** | Purchased energy | Grid electricity, district heat / steam |
| **Scope 3** | Value chain | Purchased goods, freight, business travel, commuting, waste |

### 4.2 Emission activity (inventory line)

One **activity** is one calculated record for a period, for example:

- Period: `2024-12`
- Facility: Munich HQ
- Scope: 2
- Category: Purchased electricity
- Activity value: `45,000` kWh
- Factor: `0.000385` kgCO₂e/kWh
- Result: calculated tCO₂e
- Source text: invoice or meter description
- Optional: evidence file, linked vehicle/supplier, estimated flag

### 4.3 Resources vs inventory

| Resource | What it stores | When it becomes inventory |
|----------|----------------|---------------------------|
| **Facility** | Sites for allocation | Used when saving any activity |
| **Vehicle** | Fleet master data | Use **Add to inventory** (or link from Data Collection) |
| **Supplier** | Supplier Scope 3 master data | Use **Add to inventory** (or link from Data Collection) |

Master data alone does **not** change your footprint until you post an activity.

### 4.4 Emission factors

An emission factor converts an activity unit into kgCO₂e.

- Built-in library factors ship with the product  
- Custom factors can be added in **Settings**  
- Choosing a library factor on Data Collection overrides the template default  
- Higher uncertainty usually means a lower data-quality contribution  

### 4.5 Data quality & evidence

- **Data quality score** summarises how trustworthy a record is (method, factor age, evidence, estimated vs measured, etc.).
- Labels typically map to bands such as high / good / moderate / low.
- **Evidence status:** none → pending → uploaded → verified  
- Prefer **measured** values with invoices or meter exports when possible.

### 4.6 Targets & initiatives

- A **climate target** defines baseline year/emissions, target year, and reduction % (absolute or intensity).
- A **reduction initiative** is a planned project with annual tCO₂e reduction, cost, and status (`planned` → `in_progress` → `completed`).

---

## 5. Recommended workflow

Use this sequence for a typical reporting month:

1. **Settings** — confirm company name, reporting year, employee count, revenue, carbon price (€/t).  
2. **Resources** — ensure facilities exist; update fleet and suppliers if needed.  
3. **Data Collection** — enter electricity, fuel, heat, travel, waste, goods, etc. Attach evidence where available.  
4. **Emissions** — review Scope 1–3 totals and open calculation details for spot checks.  
5. **Data Quality** — fix estimated or low-score records before audit close.  
6. **Overview** — share KPIs and trends with leadership.  
7. **Targets / Reduction Planner** — keep pathway and projects current.  
8. **Climate Intelligence** — ask Qlim AI where to focus next.  
9. **Reports** — export GHG / disclosure packages.  
10. **Team** — invite data owners for facilities or categories you do not own yourself.

---

## 6. Page-by-page guide

### 6.1 Overview

**Use when:** you need a leadership-ready snapshot.

What you will see:

- Total footprint and Scope 1 / 2 / 3 mix  
- Intensity KPIs (e.g. per employee / revenue) when company metrics are set  
- Trend charts over months  
- Filters for period, facility, scope, and more  

Empty state: if you have no activities yet, Overview prompts you to start in Data Collection.

---

### 6.2 Emissions

**Use when:** you need the full inventory and audit lineage.

What you can do:

- Review Scope cards and Scope 3 category breakdowns  
- Browse the activity table  
- Open a row to see the **calculation drawer** (formula + result)  
- Delete a record if it was entered in error (confirm first)  

Tip: use the same filters as Overview so leadership totals match inventory detail.

---

### 6.3 Data Quality

**Use when:** preparing for assurance, CSRD, or internal audit.

What you can do:

- See average quality and counts by quality band  
- Scan records for low scores, missing evidence, or estimated flags  
- Prioritise follow-ups with facility owners  

Goal: replace estimates with measured data and attach evidence before report freeze.

---

### 6.4 Data Collection

**Use when:** logging new activity data (primary operational page).

See the full walkthrough in [Section 7](#7-data-collection-in-detail).

---

### 6.5 Resources

Three tabs:

#### Facilities
Add sites with name, country, type, and floor area. Every activity should be allocated to a facility.

#### Vehicles
Add fleet units (manufacturer, model, registration, fuel/electricity usage, factors).  
You can add one-by-one or bulk via CSV where available.  
Use **Add to inventory** to create the corresponding Scope 1 or Scope 2 activity for a period.

#### Suppliers
Add suppliers with category and reported Scope 3 tCO₂e / quality score.  
Use **Add to inventory** to post Category 1 (or related) emissions for a period.

---

### 6.6 Climate Intelligence

Two panels:

1. **Qlim AI chat** — ask natural-language questions about your inventory (for example: “Which scope dominates?”, “Where should we cut first?”, “What do we need for CSRD?”).  
2. **AI analysis / recommendations** — derived insights from your current data; you can act on some insights to create or advance reduction initiatives.

Local development may use Ollama; production typically uses a cloud free-tier model when configured. If chat is unavailable, check Settings / environment configuration with your admin.

---

### 6.7 Reduction Planner

**Use when:** turning targets into projects.

What you can do:

- Add initiatives (name, annual tCO₂e reduction, cost)  
- View prioritisation / cost-effectiveness views  
- Move status: start work → mark completed  
- Review payback or cost-per-tonne style metrics  

---

### 6.8 Targets

**Use when:** defining or updating your reduction pathway.

What you can do:

- View baseline, target year, and progress  
- Edit target name, years, baseline tCO₂e, reduction %, and absolute vs intensity type  
- Review the pathway chart against current performance  

Keep baseline emissions aligned with a locked inventory year so progress stays meaningful.

---

### 6.9 Reports

**Use when:** exporting packages for disclosure or board packs.

Typical report types include:

- GHG inventory  
- Scope summary  
- Facility / fleet / travel / supplier views  
- Data quality  
- Target and reduction summaries  
- Carbon cost  

Actions usually include preview plus export to **PDF**, **CSV**, or **Excel** (authentication required for server exports).

---

### 6.10 Team

**Use when:** collaborating across facilities or functions.

What you can do (role-dependent):

- View members and pending invites  
- Invite by email with a role (e.g. member, manager, admin, viewer)  
- Revoke access when someone leaves  

Invite emails send when the email integration is configured for your deployment.

---

### 6.11 Settings

**Use when:** configuring company context and calculation inputs.

Important fields:

- Company name, industry  
- Employees, revenue, units produced  
- Baseline / reporting year  
- Carbon price (€ per tCO₂e) — used for carbon cost KPIs  
- GWP values (AR6-style) for GHG gases  
- **Custom emission factors** — appear in Data Collection’s factor picker  

Update Settings before closing a reporting period so intensity and carbon-cost metrics stay accurate.

---

## 7. Data Collection in detail

Path: **Operations → Data Collection**

### 7.1 Step-by-step

1. **Choose an activity type**  
   Click an icon card (Mobile combustion, Electricity, Waste, Custom, etc.).  
   Qlimwelt fills scope, category, unit, and a default factor.

2. **Confirm or change the emission factor**  
   Use the searchable factor library (icons show category).  
   Selecting a library factor switches you toward custom/manual override behaviour.  
   Clear the selection to return to the template factor.  
   Custom factors from Settings appear in this list.

3. **Enter activity details**  
   - Scope / category / unit (editable if needed)  
   - Activity value (required)  
   - Emission factor value (required; editable)  
   - **Measured / Estimated** toggle  
     - Measured = preferred for audits  
     - Estimated = allowed, but lowers data-quality score  
   - Source / description (required) — e.g. “Munich plant electricity — Dec invoice”  
   - Notes (optional) — assumptions, gaps, invoice refs (saved into source/evidence context)

4. **Set period and allocation**  
   - Period as `YYYY-MM`  
   - Quick chips: **Last month**, **This month**, **FY {reporting year}**  
   - Facility (required in practice — add one under Resources first)  
   - Optional link to a vehicle or supplier

5. **Attach evidence (optional)**  
   Accepted types typically include PDF, PNG, JPG, CSV, XLSX.  
   File uploads after the activity is saved (requires cloud storage setup).

6. **Watch the live preview**  
   The side panel shows calculated tCO₂e as you type, plus scope, period, quality mode, and factor source.

7. **Save to inventory**  
   Creates the activity record, notifies the workspace, and uploads evidence if provided.  
   Find the new line under **Emissions**.

### 7.2 Activity type catalogue

| Activity type | Scope | Typical unit | Good for |
|---------------|-------|--------------|----------|
| Mobile combustion | S1 | litre | Fleet diesel / petrol |
| Natural gas | S1 | kWh | Stationary combustion |
| Refrigerants | S1 | kg | Fugitive leaks |
| Electricity | S2 | kWh | Purchased grid power |
| Purchased heat | S2 | kWh | District heat / steam |
| Purchased goods | S3 | EUR | Spend-based Category 1 |
| Freight transport | S3 | tonne-km | Logistics |
| Business travel | S3 | passenger-km | Flights / rail |
| Commuting | S3 | passenger-km | Employee commuting |
| Waste | S3 | tonne | Disposal / treatment |
| Custom | varies | unit | Manual or library-driven entries |

### 7.3 After save checklist

- [ ] Record appears on Emissions for the correct period  
- [ ] Calculation drawer shows expected formula  
- [ ] Evidence status updated if a file was attached  
- [ ] Data Quality score looks reasonable (measured + evidence scores higher)

---

## 8. Filters, search, and notifications

### Filters

Most analytics pages respect a shared filter set, for example:

- Period  
- Facility  
- Country  
- Business unit  
- Scope  
- Category  
- Data quality label  
- Calculation method  

Change filters before interpreting Overview vs Emissions so the numbers stay consistent.

### Search

Use the shell search to jump between pages or locate activity sources quickly.

### Notifications

Saving activities and similar actions create notifications. Use the bell to review recent workspace events.

### Period picker

The shell period control focuses the dashboard on a reporting month or year view. Align Data Collection periods with the period you analyse.

---

## 9. Data storage and modes

| Mode | Meaning | What you should do |
|------|---------|--------------------|
| **Cloud (Supabase)** | Normal connected mode | Work as usual; data persists for the company |
| **Local** | Fallback when cloud tables are unreachable | Amber banner appears; data is stored in the browser for that company id — treat as temporary and reconnect soon |
| **Loading / empty** | Fresh workspace | Add Resources + Data Collection entries |

**Evidence uploads** need cloud storage configured (product migration for evidence storage). If upload fails, the activity may still be saved — re-attach evidence once storage is available.

---

## 10. Tips for audit-ready data

1. Prefer **measured** over estimated whenever invoices or meters exist.  
2. Always write a clear **source** string (site + period + document type).  
3. Attach **evidence** for material Scope 1 and 2 lines.  
4. Keep **facilities** clean — avoid dumping everything into one unnamed site.  
5. Use the correct **activity type** so scope/category stay consistent year on year.  
6. Review **Data Quality** weekly during close, not only at year-end.  
7. Freeze **Settings** (reporting year, employees, revenue) before exporting final reports.  
8. Document factor choices — library name/source appears on the activity for lineage.  
9. For fleet and suppliers, post inventory intentionally; do not assume master data auto-counts.  
10. Use Qlim AI for prioritisation, but treat exported inventory + evidence as the system of record.

---

## 11. Troubleshooting

| Problem | Likely cause | What to try |
|---------|--------------|-------------|
| Cannot open dashboard | Not signed in / session expired | Login again with Google |
| Redirected to onboarding | Incomplete company setup | Finish onboarding steps |
| No facilities in dropdown | Empty Resources | Add a facility first |
| Preview shows “—” | Missing value or factor | Enter both activity value and factor |
| Save button disabled | Missing required fields | Need value, factor, and source |
| Evidence upload error | Storage / migration not ready | Activity may still save; fix storage and re-upload |
| Amber local-data banner | Cloud unavailable | Check connection / admin config; avoid relying on local-only for production close |
| Qlim AI unavailable | LLM provider not configured | Admin: configure local Ollama or cloud Groq/compatible key |
| Totals look wrong | Filters / period mismatch | Reset filters; confirm activity periods |
| Intensity KPIs blank/odd | Missing employees or revenue | Update Settings |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **tCO₂e** | Tonnes of carbon dioxide equivalent |
| **GHG Protocol** | Global standard for corporate GHG accounting |
| **Scope 1 / 2 / 3** | Direct / purchased energy / value-chain emissions |
| **Activity data** | Physical or spend quantity (kWh, litres, €, km…) |
| **Emission factor** | kgCO₂e per unit of activity |
| **Location-based** | Grid-average electricity/heat accounting method |
| **Spend-based** | Estimating emissions from financial spend |
| **Evidence** | Supporting document for an activity line |
| **DQ score** | Data quality score for audit readiness |
| **SBT / science-based target** | Target aligned with climate science pathways |
| **CSRD** | EU Corporate Sustainability Reporting Directive context |
| **GWP** | Global Warming Potential used to convert gases to CO₂e |
| **Qlim AI** | In-product assistant for climate analysis |

---

## Quick reference — monthly close

1. Update Resources if sites/fleet/suppliers changed  
2. Enter all material activities in Data Collection (measured + evidence)  
3. Spot-check Emissions calculation drawer for large lines  
4. Clear Data Quality red/amber items  
5. Confirm Targets progress and Reduction Planner status  
6. Export Reports package  
7. Brief leadership from Overview  

---

*This manual describes the Qlimwelt dashboard as implemented in the product UI. Feature availability (email invites, evidence storage, AI providers) depends on your deployment configuration.*
