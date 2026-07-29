export const qlimAiResearchNotice = {
  title: "Climate Intelligence, in active research",
  body: "We are always working on AI in research for climate change — advancing models, regulatory alignment, and emissions science so Qlim AI gets sharper every release.",
};

export const qlimAiPipeline = [
  {
    id: "capture",
    phase: "01",
    title: "Capture",
    subtitle: "Every source, one stream",
    description: "ERP exports, utility bills, travel ledgers, supplier files, and bank data — ingested continuously with source metadata preserved.",
    metrics: ["12.4k rows/sync", "156 vendors", "847 invoices"],
  },
  {
    id: "normalize",
    phase: "02",
    title: "Normalize",
    subtitle: "Units, factors, scopes",
    description: "Emission factors matched from 500k+ databases, scopes classified, currencies converted — every row becomes comparable tCO₂e.",
    metrics: ["99.2% scope accuracy", "500k+ EF library", "Full unit graph"],
  },
  {
    id: "lineage",
    phase: "03",
    title: "Lineage",
    subtitle: "Audit-ready by design",
    description: "Each data point carries provenance: who uploaded it, which factor was applied, and why — ready for CSRD assurance.",
    metrics: ["100% traceability", "Immutable audit log", "ESRS E1 aligned"],
  },
  {
    id: "reason",
    phase: "04",
    title: "Reason",
    subtitle: "AI agents on your data",
    description: "Anomaly nets, supply-chain graphs, and compliance engines run 24/7 — surfacing drivers, gaps, and risks before your auditor does.",
    metrics: ["3 anomaly flags", "Tier-2 supply GNN", "E1–E5 coverage"],
  },
  {
    id: "act",
    phase: "05",
    title: "Act",
    subtitle: "Intelligence you can use",
    description: "Live footprint updates, abatement scenarios, CSRD drafts, and Qlim AI conversations — turning raw data into decisions.",
    metrics: ["40.5k tCO₂e live", "−23.8% abatement paths", "< 3s response"],
  },
] as const;

export const qlimAiCapabilities = [
  {
    id: "nlq",
    title: "Natural language queries",
    description: "Ask anything about Scope 1, 2, or 3 — drivers, trends, suppliers, and compliance gaps — in plain language.",
  },
  {
    id: "anomaly",
    title: "Anomaly & driver detection",
    description: "AI flags unexpected spikes, attributes them to vendors or facilities, and quantifies financial and carbon impact.",
  },
  {
    id: "csrd",
    title: "CSRD & ESRS drafting",
    description: "Auto-generates climate narratives, disclosure gaps, and audit-ready evidence chains aligned to ESRS E1.",
  },
  {
    id: "docs",
    title: "Document intelligence",
    description: "Reads PDFs, CSVs, ERP exports, and bank statements — zero manual entry, full extraction confidence scores.",
  },
  {
    id: "scenario",
    title: "Scenario modeling",
    description: "Models reduction initiatives, PPAs, fleet electrification, and supplier switches with ROI and payback.",
  },
  {
    id: "supplier",
    title: "Supplier intelligence",
    description: "Tracks primary vs. spend-based data, drafts outreach, and maps Tier-2 exposure across your value chain.",
  },
] as const;

export const qlimAiDemo = [
  { role: "user" as const, content: "Why did our Scope 3 emissions increase 8% this quarter?" },
  {
    role: "assistant" as const,
    content:
      "Your Scope 3 increase is primarily driven by ChemBase AG (+18% vs Q3). They account for 13% of your Category 1 purchased goods emissions.\n\nSecondary factor: LogiCargo EU freight volumes increased 12% following the Rotterdam expansion.",
  },
  {
    role: "user" as const,
    content: "Draft a supplier outreach email to ChemBase AG requesting primary emissions data.",
  },
  {
    role: "assistant" as const,
    content:
      "Subject: Request for Primary Emissions Data — CSRD Compliance\n\nDear ChemBase AG Sustainability Team,\n\nAs part of our CSRD reporting obligations under ESRS E1, we are requesting primary greenhouse gas emissions data for the goods and services supplied to Nordic Manufacturing Group during FY2024...",
  },
];

export const qlimAiMessages = [
  {
    role: "user" as const,
    content: "What would happen if we switched to 100% renewable electricity across all facilities?",
  },
  {
    role: "assistant" as const,
    content:
      "Based on your current energy mix (28% renewable), switching to 100% would reduce Scope 2 emissions by 2,964 tCO₂e annually — a 72% reduction in your Scope 2 footprint.\n\nFinancial impact:\n• Estimated PPA cost: €340k/year\n• Carbon cost avoidance: €148k/year (at €50/tCO₂e)\n• Net payback period: 2.4 years\n\nESG Score impact: +6 points (74 → 80)\nCSRD Readiness: +8% (76% → 84%)",
  },
];
