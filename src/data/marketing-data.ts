export const heroStats = [
  { value: "500k+", label: "Emission factor entries" },
  { value: "12,450", label: "tCO₂e processed this month" },
  { value: "97%", label: "Reporting time reduction" },
  { value: "16", label: "EU frameworks supported" },
];

export const howItWorksSteps = [
  {
    step: "01",
    title: "Connect your data sources",
    description: "Plug in SAP, Oracle, CSV exports, PDF invoices, and bank APIs. Qlimwelt normalises everything into a single emissions ledger automatically.",
    items: ["SAP / Oracle ERP", "CSV & Excel uploads", "PDF invoice extraction", "Bank transaction APIs"],
  },
  {
    step: "02",
    title: "AI calculates every emission",
    description: "Our engine matches activity data to 500k+ emission factors, categorising Scope 1, 2, and 3 with full audit trail and confidence scores.",
    scopes: [
      { name: "Scope 1", progress: 100 },
      { name: "Scope 2", progress: 100 },
      { name: "Scope 3", progress: 87 },
    ],
  },
  {
    step: "03",
    title: "Generate your CSRD report",
    description: "One-click generation of ESRS E1 climate disclosure, S1 workforce metrics, and EU Taxonomy alignment checklist — audit-ready in hours.",
    items: ["ESRS E1 Climate Change", "ESRS S1 Own Workforce", "EU Taxonomy Checklist", "Third-party assurance ready"],
  },
];

export const platformFeatures = [
  { num: "01", title: "Automated Carbon Accounting", description: "Ingest invoices, ERP exports, and utility bills. AI classifies and calculates emissions with zero manual data entry." },
  { num: "02", title: "CSRD & GRI Reports in Hours", description: "Generate audit-ready ESRS disclosures, GRI Standards reports, and EU Taxonomy alignment documents in a single click." },
  { num: "03", title: "Conversational Carbon Intelligence", description: "Ask your emissions data anything in plain language. Carbon Chat understands Scope 3 drivers, compliance gaps, and reduction scenarios." },
  { num: "04", title: "Supplier Emissions Tracking", description: "Request, collect, and score supplier primary data. Identify high-risk suppliers before they impact your CSRD disclosure." },
  { num: "05", title: "Regulatory Deadline Monitoring", description: "Never miss a CSRD, CBAM, or EU Taxonomy deadline. Autonomous agents track regulatory changes and alert your team proactively." },
  { num: "06", title: "Reduction Scenario Modelling", description: "Model fleet electrification, renewable PPAs, and supplier engagement programmes with financial ROI and tCO₂e impact projections." },
];

export const useCases = [
  {
    tag: "MID-MARKET MANUFACTURERS",
    title: "You have CSRD in 2026. Your ERP can't export emission factors.",
    description: "We bridge the gap — connecting SAP, Oracle, and custom ERPs to our emission factor library and generating your ESRS E1 disclosure automatically.",
    stat: "12× faster Scope 3 data collection",
    image: "manufacturing",
  },
  {
    tag: "LOGISTICS & TRANSPORT",
    title: "Scope 3 Category 4 is your biggest blind spot.",
    description: "Qlimwelt ingests fleet telematics, fuel receipts, and freight invoices to calculate upstream and downstream transport emissions with primary data accuracy.",
    stat: "89% reduction in manual freight data entry",
    image: "logistics",
  },
  {
    tag: "FINANCIAL SERVICES",
    title: "Portfolio emissions are a regulatory requirement, not a nice-to-have.",
    description: "Financed emissions calculation aligned with PCAF methodology, integrated with your loan book and investment portfolio data.",
    stat: "PCAF-aligned in 6 weeks",
    image: "finance",
  },
];

export const pricingPlans = [
  {
    name: "STARTER",
    price: "€299",
    period: "/mo",
    description: "For SMEs starting their sustainability journey",
    features: ["Up to 3 users", "Scope 1 & 2 tracking", "Basic CSRD templates", "Email support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "GROWTH",
    price: "€799",
    period: "/mo",
    description: "For mid-market teams under CSRD obligations",
    features: ["Up to 15 users", "Scope 1, 2 & 3 tracking", "Full ESRS CSRD reports", "AI Carbon Chat access", "Supplier data requests", "Priority support"],
    cta: "Start Free Trial",
    highlighted: true,
    badge: "MOST POPULAR",
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    period: "",
    description: "For complex organizations and group structures",
    features: ["Unlimited users", "Full API access", "SSO / SAML", "Custom data connectors", "Dedicated CSM", "SLA guarantee"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export const storyCards = [
  { stat: "80%", label: "THE PROBLEM", text: "Sustainability teams spend 80% of their time collecting and cleaning data — leaving only 20% for actual analysis and strategy." },
  { stat: "→AI", label: "OUR APPROACH", text: "We use LLMs and structured extraction to automate the 80%. Invoices, PDFs, and ERP exports become clean emissions data automatically." },
  { stat: "100%", label: "THE RESULT", text: "Audit-ready accuracy with full data lineage. Auditors can trace every tonne of CO₂ back to its source document." },
];

export const platformQueries = [
  "Which suppliers carry the highest climate risk?",
  "Draft my ESRS E1 climate narrative for CSRD",
  "What happens if we switch to 100% renewables?",
  "Show me Scope 3 Category 1 breakdown by supplier",
  "Model fleet electrification impact by 2027",
];

export const capabilityTicker = [
  "AI Copilot", "Autonomous Agents", "Document Intelligence", "Digital Carbon Twin",
  "Emissions Forecasting", "Supplier Risk", "CSRD Reports", "Scenario Simulator",
  "Carbon Graph", "Sustainability API",
];

export const capabilityMap = [
  { title: "AI Sustainability Copilot", description: "Natural language interface to your entire emissions database" },
  { title: "Autonomous ESG Agents", description: "Four specialist agents running 24/7 against your data" },
  { title: "Document Intelligence", description: "Zero manual entry — PDFs and invoices auto-classified" },
  { title: "Digital Carbon Twin", description: "Real-time living model of your organisation's carbon footprint" },
  { title: "Emissions Forecasting", description: "Predictive modelling for 1, 3, and 5 year horizons" },
  { title: "Supplier Risk Intelligence", description: "Value chain ranking with primary data scoring" },
  { title: "One-Click ESG Reports", description: "Audit-ready CSRD, GRI, and TCFD reports" },
  { title: "Climate Scenario Simulator", description: "Financial risk modelling under 1.5°C and 2°C paths" },
  { title: "Carbon Intelligence Graph", description: "Knowledge graph connecting emissions to business decisions" },
  { title: "Peer Benchmarking", description: "Compare against 500+ European companies in your sector" },
  { title: "Sustainability API Layer", description: "REST API with webhooks for ERP and BI integration" },
  { title: "Carbon Reduction Marketplace", description: "Coming Q4 2025 — verified offset and reduction projects" },
];

export const autonomousAgents = [
  { name: "Scope Analyst", role: "Emission Accounting", status: "RUNNING", message: "Reconciling Scope 2 figures against latest energy invoices", progress: 62, time: "2m ago", color: "blue" },
  { name: "Supplier Monitor", role: "Value Chain Intelligence", status: "ALERT", message: "MetalWorks SA disclosure gap detected — flagging for review", progress: 18, time: "4m ago", color: "purple" },
  { name: "Compliance Watcher", role: "Regulatory Monitoring", status: "RUNNING", message: "Tracking CSRD Article 19a deadline — 87 days remaining", progress: 74, time: "1m ago", color: "orange" },
  { name: "Reduction Optimizer", role: "Decarbonisation Planning", status: "IDLE", message: "Queued: Model renewable PPA impact on 2026 targets", progress: 40, time: "12m ago", color: "green" },
];

export const copilotExamples = [
  {
    question: "Which of our suppliers pose the highest Scope 3 risk?",
    answer: "Based on your current supplier data, MetalWorks SA (Spain) and ChemBase AG (Germany) are your highest-risk suppliers.\n\nMetalWorks SA: Risk score 82/100 — no SBTi commitment, partial disclosure, +12.4% emission trend.\nChemBase AG: Risk score 78/100 — driving 18% of your Scope 3 Category 1 increase this quarter.\n\nRecommended action: Initiate primary data collection requests for both suppliers within 30 days.",
  },
  {
    question: "Draft the ESRS E1 climate change narrative for our CSRD report",
    answer: "I've drafted your ESRS E1-1 transition plan narrative based on your FY2024 data:\n\n\"Nordic Manufacturing Group has set a science-based target to reduce absolute Scope 1 and 2 GHG emissions by 42% by 2030 from a 2024 baseline, aligned with a 1.5°C pathway. Total emissions for FY2024 were 12,450 tCO₂e, representing an 8.3% reduction from the prior year...\"\n\n[Continue drafting →]",
  },
  {
    question: "Model the impact of switching to 100% renewable electricity",
    answer: "Scenario: 100% Renewable Electricity by Q2 2026\n\nScope 2 reduction: −2,964 tCO₂e (−72%)\nTotal footprint reduction: −23.8%\nESG Score impact: 74 → 80 (+6 points)\nInvestment required: €340k/year (PPA)\nPayback period: 2.4 years\nCSRD Readiness: 76% → 84%\n\nThis is your highest-ROI reduction opportunity.",
  },
];

export const documentStages = ["Uploading", "Extracting", "Mapping", "Audit trail"];
export const extractedDocuments = [
  { item: "Electricity — E.ON invoice Jan 2025", scope: "Scope 2", confidence: 98 },
  { item: "Natural gas — Stadtwerke Munich", scope: "Scope 1", confidence: 96 },
  { item: "Fleet diesel — Shell Fleet Card", scope: "Scope 1", confidence: 94 },
  { item: "Freight — DHL Express Q4", scope: "Scope 3 Cat. 4", confidence: 91 },
];

export const comparisonTable = [
  { feature: "Data ingestion", legacy: "Manual CSV uploads", qlimwelt: "AI auto-extraction from PDFs, ERP, APIs" },
  { feature: "Emission factor matching", legacy: "Static lookup tables", qlimwelt: "500k+ factors with ML matching" },
  { feature: "Scope 3 tracking", legacy: "Spend-based estimates only", qlimwelt: "Primary + secondary data hybrid" },
  { feature: "Report generation", legacy: "Weeks of consultant work", qlimwelt: "Hours, audit-ready" },
  { feature: "Anomaly detection", legacy: "Manual review", qlimwelt: "Autonomous AI agents, 99% catch rate" },
  { feature: "Regulatory updates", legacy: "Annual consultant briefings", qlimwelt: "Real-time CSRD/CBAM monitoring" },
  { feature: "Reduction planning", legacy: "Spreadsheet models", qlimwelt: "AI scenario simulator with ROI" },
  { feature: "Audit trail", legacy: "Partial documentation", qlimwelt: "Full lineage to source document" },
];

export const aiArchitectureSteps = [
  { step: "01", title: "Ingestion & Normalization Layer", description: "Multi-format ingestion from ERP, PDF, CSV, and API sources. Automatic deduplication and unit normalisation." },
  { step: "02", title: "Emission Factor Intelligence Engine", description: "80,000+ curated factors with ML-powered matching. Confidence scoring on every calculation." },
  { step: "03", title: "Anomaly Detection & Quality Assurance", description: "ML layer flags outliers, missing data, and inconsistencies before they reach your report." },
  { step: "04", title: "Conversational Carbon Intelligence", description: "LLM layer with RAG over your emissions data. Ask anything, get auditable answers." },
  { step: "05", title: "CSRD Report Drafting", description: "NLP generation aligned to ESRS E1, S1, and EU Taxonomy requirements. Human-in-the-loop review." },
];

export const safetyCards = [
  { title: "EU-Only Data Hosting", description: "All data stored in Frankfurt and Dublin. No US cloud transfers." },
  { title: "End-to-End Encryption", description: "AES-256 at rest and TLS 1.3 in transit. Zero-knowledge architecture." },
  { title: "No AI Training on Your Data", description: "Your emissions data is never used to train models. Contractually guaranteed." },
  { title: "Role-Based Access Control", description: "Granular permissions by team, facility, and data category." },
  { title: "GDPR Data Rights", description: "Full data portability, erasure, and access request handling." },
  { title: "Responsible AI Principles", description: "Transparent AI decisions with full audit trail and human override." },
];

export const changelog = [
  { date: "May 2025", title: "AI Carbon Chat launched", description: "Natural language interface to your emissions data. Ask anything about Scope 1, 2, 3, suppliers, and compliance." },
  { date: "April 2025", title: "Scenario Modeler v2 with Monte Carlo", description: "Probabilistic forecasting for reduction initiatives with confidence intervals and financial risk modelling." },
  { date: "March 2025", title: "ESRS E1 Auto-Drafting", description: "One-click generation of CSRD climate change narrative aligned to ESRS E1 requirements." },
  { date: "February 2025", title: "Supplier Portal with primary data collection", description: "Self-service portal for suppliers to submit primary emissions data with automated validation." },
  { date: "January 2025", title: "Platform launch (beta)", description: "Initial release with automated carbon accounting, CSRD reporting, and AI document intelligence." },
];

export const carbonChatDemo = [
  { role: "user" as const, content: "Why did our Scope 3 emissions increase 8% this quarter?" },
  { role: "assistant" as const, content: "Your Scope 3 increase is primarily driven by ChemBase AG (+18% vs Q3). They account for 13% of your Category 1 purchased goods emissions.\n\nSecondary factor: LogiCargo EU freight volumes increased 12% following the Rotterdam expansion." },
  { role: "user" as const, content: "Draft a supplier outreach email to ChemBase AG requesting primary emissions data." },
  { role: "assistant" as const, content: "Subject: Request for Primary Emissions Data — CSRD Compliance\n\nDear ChemBase AG Sustainability Team,\n\nAs part of our CSRD reporting obligations under ESRS E1, we are requesting primary greenhouse gas emissions data for the goods and services supplied to Nordic Manufacturing Group during FY2024..." },
];

export const carbonFootprintTopics = [
  {
    id: "scope-1",
    tag: "SCOPE 1 // DIRECT",
    title: "Direct emissions you control",
    description:
      "Combustion in boilers, company vehicles, refrigerant leaks, and on-site industrial processes. These are emissions from sources your organisation owns or operates.",
    share: "9%",
    shareLabel: "Typical mid-market share",
    accent: "#334155",
    examples: ["Fleet diesel & petrol", "Natural gas heating", "F-gas refrigerants", "Process & fugitive emissions"],
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Industrial facility with emissions monitoring equipment",
  },
  {
    id: "scope-2",
    tag: "SCOPE 2 // ENERGY",
    title: "Purchased electricity & heat",
    description:
      "Indirect emissions from electricity, steam, heating, and cooling bought for your operations. Location-based and market-based methods both matter for CSRD.",
    share: "16%",
    shareLabel: "Typical mid-market share",
    accent: "#22c55e",
    examples: ["Grid electricity", "District heating", "Renewable PPAs", "Steam for production"],
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Solar panels generating renewable electricity",
  },
  {
    id: "scope-3",
    tag: "SCOPE 3 // VALUE CHAIN",
    title: "Everything upstream & downstream",
    description:
      "The full value chain — purchased goods, freight, business travel, employee commuting, product use, and end-of-life. Often 60–90% of a company's total footprint.",
    share: "75%",
    shareLabel: "Typical mid-market share",
    accent: "#059669",
    examples: ["Purchased materials", "Upstream logistics", "Business travel", "Product lifecycle"],
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Global logistics and freight containers at port",
  },
];

export const footprintFacts = [
  { value: "50+", label: "GHG Protocol categories mapped", sub: "Scope 3 Cat. 1–15" },
  { value: "500k+", label: "Emission factors in library", sub: "DEFRA · EPA · ecoinvent" },
  { value: "1.5°C", label: "SBTi-aligned pathways", sub: "Science-based targets" },
  { value: "ESRS E1", label: "CSRD climate disclosure", sub: "Audit-ready narratives" },
];

export const insightArticles = [
  {
    slug: "csrd-2026-mid-market",
    category: "REGULATION",
    date: "28 Jul 2026",
    title: "CSRD 2026: What mid-market manufacturers must prepare now",
    excerpt:
      "Wave 2 companies face ESRS E1 disclosure in 2026. Here is a practical 90-day readiness plan — from double materiality to Scope 3 data gaps.",
    readTime: "7 min read",
    featured: true,
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Sustainability team reviewing CSRD compliance documents",
    externalUrl:
      "https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en",
  },
  {
    slug: "scope-3-primary-data",
    category: "METHODOLOGY",
    date: "21 Jul 2026",
    title: "Moving from spend-based to primary supplier data",
    excerpt:
      "Spend-based estimates get you started, but auditors and investors expect activity-based factors. A step-by-step migration playbook for Category 1.",
    readTime: "5 min read",
    featured: false,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Supply chain cargo containers representing Scope 3 emissions",
    externalUrl: "https://ghgprotocol.org/standards/scope-3-standard",
  },
  {
    slug: "cbam-eu-manufacturers",
    category: "POLICY",
    date: "14 Jul 2026",
    title: "CBAM and carbon pricing: impact on EU importers",
    excerpt:
      "The Carbon Border Adjustment Mechanism changes cost structures for steel, aluminium, and cement supply chains. How to model exposure in your footprint.",
    readTime: "6 min read",
    featured: false,
    image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Industrial manufacturing plant at dusk",
    externalUrl: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
  },
  {
    slug: "renewable-ppa-roi",
    category: "REDUCTION",
    date: "7 Jul 2026",
    title: "Renewable PPAs: the highest-ROI Scope 2 lever in 2026",
    excerpt:
      "Analysis of 140 European mid-market sites shows PPAs deliver 2.4-year payback on average — with immediate CSRD readiness gains.",
    readTime: "4 min read",
    featured: false,
    image: "https://images.unsplash.com/photo-1532601224470-5fc387274683?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Wind turbines at sunset — renewable energy for Scope 2 reduction",
    externalUrl: "https://sciencebasedtargets.org/",
  },
];

export const industryNews = [
  {
    source: "EU COMMISSION",
    date: "Jul 2026",
    headline: "ESRS Set 1 reporting standards enter mandatory phase for large undertakings",
    summary: "First sustainability statements under CSRD must include ESRS E1 climate metrics with limited assurance.",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=600&q=80",
    imageAlt: "European parliament building representing EU regulation",
    externalUrl:
      "https://www.efrag.org/en/sustainability-reporting/esrs",
  },
  {
    source: "SBTi",
    date: "Jun 2026",
    headline: "Near-term target validation timelines reduced to 8 weeks for SMEs",
    summary: "Streamlined pathway for companies under 500 employees submitting 1.5°C-aligned targets.",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Sunlight through forest canopy — science-based climate targets",
    externalUrl: "https://sciencebasedtargets.org/companies-taking-action",
  },
  {
    source: "GHG PROTOCOL",
    date: "May 2026",
    headline: "Scope 3 guidance update: improved Category 11 use-phase calculations",
    summary: "New factors for product energy consumption over lifetime — relevant for equipment manufacturers.",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Data analytics dashboard for emissions tracking",
    externalUrl: "https://ghgprotocol.org/standards/scope-3-standard",
  },
  {
    source: "TÜV SÜD",
    date: "Apr 2026",
    headline: "Limited assurance expectations for FY2025 CSRD first reports published",
    summary: "Auditors outline minimum evidence requirements for emission factor selection and data lineage.",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Professional reviewing audit and compliance paperwork",
    externalUrl: "https://www.tuvsud.com/en/topics/sustainability",
  },
];
