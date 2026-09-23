# Qlimwelt Dashboard — Capabilities & Access

What the dashboard can do today, which actions users can perform, and who can use it right now.

For step-by-step workflows, see [docs/DASHBOARD_USER_MANUAL.md](./docs/DASHBOARD_USER_MANUAL.md).

---

## What the dashboard is for

Qlimwelt is a **carbon intelligence workspace**. Signed-in company members can measure GHG emissions (Scope 1 / 2 / 3), improve data quality, plan reductions, stay compliance-ready, and export disclosure packs — with **Qlim AI** assisting on hotspots and next steps.

**Core formula:** `tCO₂e = activity value × emission factor ÷ 1000`

---

## Capability map (by area)

### Analytics

| Page | What it shows / does |
|------|----------------------|
| **Overview** | Executive KPIs, trends, scope mix, alerts, period filters |
| **Emissions** | Full inventory by scope, category, and activity line; open calculation breakdowns |
| **Data Quality** | Audit-readiness scores and records that need attention |

**Actions:** filter by period / scope / facility; search activities; open calculation drawer; mark notifications read.

### Operations

| Page | What it shows / does |
|------|----------------------|
| **Assessments** | Guided carbon assessments (profile → boundaries → screening → modules → review) |
| **Data Collection** | Manual activity entry with live tCO₂e preview and optional evidence upload |
| **Connected Systems** | Connect catalog systems, test connection, sync, schedule, import files, manage API keys |
| **Resources** | Facilities, vehicles, and suppliers used to allocate emission activities |

**Actions you can perform:**

- Create / continue **Corporate Carbon Footprint** assessments (primary path)
- Start **Product Carbon Footprint** scaffold (full BOM / PACT later); Event / Supplier flows marked coming soon
- Add, edit, and delete activity records (delete restricted for admins in DB)
- Pick templates / emission factors; enter measured or estimated values; attach evidence
- Add facilities, vehicles (incl. bulk), and suppliers
- Connect / disconnect systems; **Test Connection**; **Sync**; set schedules; import files; create / revoke API keys

### Planning

| Page | What it shows / does |
|------|----------------------|
| **Climate Intelligence** | Ask Qlim AI about hotspots and recommended next steps from your inventory |
| **Reduction Planner** | Plan and track decarbonisation initiatives |
| **Targets** | Science-based style reduction pathway and progress |

**Actions:** chat with Qlim AI; save initiatives and update status; save climate targets (admin-gated in DB).

### Reporting

| Page | What it shows / does |
|------|----------------------|
| **Reports** | Export disclosure packages (PDF, CSV, Excel) — GHG, scope, facility, fleet, DQ, targets, etc. |
| **Compliance Center** | Regulatory readiness, gaps, and audit-oriented sustainability views |

**Actions:** preview and download branded report packs.

### Administration

| Page | What it shows / does |
|------|----------------------|
| **Team** | Workspace roster, pending invites, role assignment |
| **Settings** | Company profile, carbon price, GWP values, custom emission factors |

**Actions:** invite / revoke teammates (admins); update company settings and custom factors (settings updates are admin-gated in DB).

### Cross-cutting product features

- **EN / DE** language toggle
- Global **period** selector (FY / month)
- In-app **search** (pages + activity lines)
- **Notifications** bell
- Floating **Qlim AI** chat + live ticker
- **Try QAI Mobile** preview synced with web context
- Dev / demo **sample seed** (`?seed=1`) for local inventory preview when configured

---

## Who can use it right now

Access today is **company-workspace based**: Google sign-in → onboarding (if new) → dashboard. There is no public anonymous dashboard.

### A. By access status

| Category | Who | What they can do now |
|----------|-----|----------------------|
| **Authenticated company members** | Anyone signed in with Google who belongs to a company and finished onboarding | Full dashboard navigation for their workspace |
| **New users (pre-onboarding)** | Signed in but onboarding incomplete | Onboarding only; redirected away from `/dashboard` until complete |
| **Invited colleagues** | Email invited by a workspace **admin** | Join the same company after signing in with the invited email |
| **Unauthenticated visitors** | Not signed in | Marketing site only; dashboard routes are protected |
| **Local / demo preview** | Developers or demos using seed / local-first data | Explore sample FY inventory without waiting on live backend seed (dev flows such as `?seed=1`) |

### B. By workspace role

Roles stored on `company_members`: **admin**, **manager**, **member**, **viewer**.

| Role | Intended for | Capabilities right now |
|------|--------------|------------------------|
| **Admin** | Workspace owners / sustainability leads | Invite & revoke teammates; manage team settings; update company settings & climate targets; delete protected resources (facilities, vehicles, suppliers, activities, initiatives) per RLS |
| **Manager** | Sustainability managers / analysts who operate the inventory | Create and edit assessments, activities, resources, initiatives, connections; use AI, reports, and compliance; cannot manage team invites |
| **Member** | Contributors entering data | Same day-to-day write access pattern as managers for inventory work; no admin team controls |
| **Viewer** | Leadership / auditors who mainly review | Read inventory and analytics; edit actions are limited in product surfaces that check role (e.g. mobile overview treats viewer as non-edit). Prefer this role for review-only access |

> **Note:** Team invite / revoke is enforced in the UI for **admins only**. Broader write vs read for viewers is partly enforced in product code and partly by Supabase RLS (members can insert/update many tables; deletes and some settings/targets require admin).

### C. By job persona (who the product is built for today)

| Persona | Typical role in app | Primary modules |
|---------|---------------------|-----------------|
| **Sustainability / ESG manager** | Admin or Manager | Assessments, Data Collection, Data Quality, Reports, Compliance |
| **Climate / carbon analyst** | Manager or Member | Emissions, Factors, Reduction Planner, Targets, Climate Intelligence |
| **Operations / facility owner** | Member | Resources, Data Collection, evidence uploads |
| **IT / systems integrator** | Admin or Manager | Connected Systems (connectors, sync, API keys, imports) |
| **Executive / board viewer** | Viewer | Overview, Reports, Compliance (read-focused) |
| **Internal team collaborator** | Member (via invite) | Assigned data entry and review within the company workspace |

### D. What is not general availability yet

Treat these as limited or scaffolded — usable for demos / early testing, not full production coverage for every customer type:

- **Product CCF** — scaffold only (full BOM / PACT later)
- **Event / Project** and **Supplier Data Collection** assessment types — coming soon
- **Connected Systems** sync/import — available in-product; depth varies by connector (catalog includes available + future items)
- **Invite email delivery** — recorded always; emailed when Resend is configured
- **Multi-tenant enterprise RBAC** beyond company role (facility-level ACL, etc.) — marketed conceptually; current enforcement is company membership + role

---

## Quick start for a permitted user

1. Open the app → **Login** with Google  
2. Complete **onboarding** if prompted  
3. Recommended path: **Assessments** → Corporate CCF → collect modules → **Emissions** → **Reports**  
4. Optional: connect systems under **Connected Systems**, or load demo data in development with `?seed=1`

Local URL: [http://localhost:3000/dashboard/overview](http://localhost:3000/dashboard/overview)

---

## Related docs

- [README.md](./README.md) — stack, local setup, scripts  
- [docs/DASHBOARD_USER_MANUAL.md](./docs/DASHBOARD_USER_MANUAL.md) — full how-to guide  
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — auth and database  
- [DEPLOYMENT.md](./DEPLOYMENT.md) — deploy  
