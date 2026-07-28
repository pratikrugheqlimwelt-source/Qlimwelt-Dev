export const company = {
  name: "Nordic Manufacturing Group",
  industry: "Industrial Manufacturing",
  headquarters: "Stockholm, Sweden",
  employees: 12400,
  revenue: "$2.8B",
  fiscalYear: 2025,
};

export const kpis = {
  totalEmissions: 487320,
  scope1: 89240,
  scope2: 156780,
  scope3: 241300,
  carbonScore: 72,
  previousYearTotal: 512450,
  targetReduction: 15,
};

export const emissionTrend = [
  { month: "Jan", scope1: 7200, scope2: 12800, scope3: 19800, total: 39800 },
  { month: "Feb", scope1: 7100, scope2: 12500, scope3: 19500, total: 39100 },
  { month: "Mar", scope1: 7400, scope2: 13100, scope3: 20200, total: 40700 },
  { month: "Apr", scope1: 7300, scope2: 12900, scope3: 19900, total: 40100 },
  { month: "May", scope1: 7500, scope2: 13200, scope3: 20400, total: 41100 },
  { month: "Jun", scope1: 7600, scope2: 13400, scope3: 20600, total: 41600 },
  { month: "Jul", scope1: 7700, scope2: 13600, scope3: 20800, total: 42100 },
  { month: "Aug", scope1: 7650, scope2: 13500, scope3: 20700, total: 41850 },
  { month: "Sep", scope1: 7550, scope2: 13300, scope3: 20500, total: 41350 },
  { month: "Oct", scope1: 7450, scope2: 13100, scope3: 20300, total: 40850 },
  { month: "Nov", scope1: 7350, scope2: 12900, scope3: 20100, total: 40350 },
  { month: "Dec", scope1: 7250, scope2: 12700, scope3: 19900, total: 39850 },
];

export const facilities = [
  { id: "f1", name: "Stockholm HQ & Plant", location: "Sweden", emissions: 98420, change: -4.2, status: "compliant" },
  { id: "f2", name: "Munich Assembly", location: "Germany", emissions: 87230, change: -2.8, status: "compliant" },
  { id: "f3", name: "Rotterdam Logistics Hub", location: "Netherlands", emissions: 65400, change: 1.5, status: "review" },
  { id: "f4", name: "Warsaw Distribution", location: "Poland", emissions: 52100, change: -6.1, status: "compliant" },
  { id: "f5", name: "Milan R&D Center", location: "Italy", emissions: 38450, change: -3.4, status: "compliant" },
  { id: "f6", name: "Barcelona Packaging", location: "Spain", emissions: 45720, change: 2.1, status: "at-risk" },
];

export const recentActivities = [
  { id: "a1", type: "report", title: "Q3 Scope 3 audit completed", time: "2 hours ago", user: "Elena Bergström" },
  { id: "a2", type: "alert", title: "Rotterdam facility exceeded energy threshold", time: "5 hours ago", user: "System" },
  { id: "a3", type: "update", title: "Supplier data refresh: 847 records updated", time: "Yesterday", user: "Marcus Chen" },
  { id: "a4", type: "compliance", title: "CSRD disclosure draft approved", time: "Yesterday", user: "Sarah Okafor" },
  { id: "a5", type: "insight", title: "AI identified 12% reduction opportunity in logistics", time: "2 days ago", user: "Qlimwelt AI" },
];

export const aiInsights = [
  {
    id: "i1",
    severity: "high",
    title: "Scope 3 logistics optimization",
    description: "Switching 40% of Rotterdam-Milan freight to rail could reduce emissions by 8,400 tCO₂e annually.",
    savings: 420000,
  },
  {
    id: "i2",
    severity: "medium",
    title: "Renewable energy procurement",
    description: "Barcelona facility can achieve 100% renewable electricity by Q2 2026 with current PPA options.",
    savings: 280000,
  },
  {
    id: "i3",
    severity: "low",
    title: "HVAC efficiency upgrade",
    description: "Munich assembly line cooling systems are operating 18% above benchmark efficiency.",
    savings: 95000,
  },
];

export const complianceStatus = [
  { framework: "CSRD", progress: 78, status: "On Track", deadline: "Jun 2026" },
  { framework: "GHG Protocol", progress: 92, status: "Compliant", deadline: "Ongoing" },
  { framework: "ISO 14064", progress: 85, status: "On Track", deadline: "Mar 2026" },
  { framework: "SBTi", progress: 65, status: "In Progress", deadline: "Dec 2026" },
];

export const products = [
  {
    id: "p1",
    name: "Industrial Pump X500",
    sku: "IPX-500-A",
    category: "Heavy Machinery",
    totalEmissions: 1240,
    unit: "kg CO₂e/unit",
    lifecycle: { raw: 420, manufacturing: 380, transport: 180, use: 210, endOfLife: 50 },
    materials: [
      { name: "Steel alloy", percentage: 45, emissions: 558 },
      { name: "Aluminum", percentage: 22, emissions: 273 },
      { name: "Copper wiring", percentage: 12, emissions: 149 },
      { name: "Plastic polymers", percentage: 8, emissions: 99 },
      { name: "Other components", percentage: 13, emissions: 161 },
    ],
    supplier: "Nordic Components AB",
    lastUpdated: "2025-11-15",
  },
  {
    id: "p2",
    name: "Precision Valve V200",
    sku: "PV-200-B",
    category: "Components",
    totalEmissions: 186,
    unit: "kg CO₂e/unit",
    lifecycle: { raw: 62, manufacturing: 58, transport: 28, use: 32, endOfLife: 6 },
    materials: [
      { name: "Stainless steel", percentage: 55, emissions: 102 },
      { name: "Rubber seals", percentage: 15, emissions: 28 },
      { name: "Brass fittings", percentage: 20, emissions: 37 },
      { name: "Packaging", percentage: 10, emissions: 19 },
    ],
    supplier: "Precision Parts GmbH",
    lastUpdated: "2025-10-28",
  },
  {
    id: "p3",
    name: "Control Panel CP-900",
    sku: "CP-900-C",
    category: "Electronics",
    totalEmissions: 342,
    unit: "kg CO₂e/unit",
    lifecycle: { raw: 120, manufacturing: 95, transport: 45, use: 72, endOfLife: 10 },
    materials: [
      { name: "PCB & semiconductors", percentage: 35, emissions: 120 },
      { name: "Enclosure (ABS)", percentage: 25, emissions: 86 },
      { name: "Wiring harness", percentage: 20, emissions: 68 },
      { name: "Display module", percentage: 12, emissions: 41 },
      { name: "Fasteners & misc", percentage: 8, emissions: 27 },
    ],
    supplier: "ElectroTech Solutions",
    lastUpdated: "2025-12-01",
  },
  {
    id: "p4",
    name: "Hydraulic Cylinder HC-750",
    sku: "HC-750-D",
    category: "Heavy Machinery",
    totalEmissions: 890,
    unit: "kg CO₂e/unit",
    lifecycle: { raw: 310, manufacturing: 280, transport: 120, use: 160, endOfLife: 20 },
    materials: [
      { name: "Carbon steel", percentage: 50, emissions: 445 },
      { name: "Hydraulic fluid system", percentage: 20, emissions: 178 },
      { name: "Chrome plating", percentage: 15, emissions: 134 },
      { name: "Seals & gaskets", percentage: 10, emissions: 89 },
      { name: "Packaging", percentage: 5, emissions: 44 },
    ],
    supplier: "HydraForce Industries",
    lastUpdated: "2025-09-20",
  },
];

export const suppliers = [
  { id: "s1", name: "Nordic Components AB", country: "Sweden", category: "Raw Materials", carbonScore: 82, risk: "low", emissions: 45200, spend: "$12.4M", trend: -3.2 },
  { id: "s2", name: "Precision Parts GmbH", country: "Germany", category: "Components", carbonScore: 76, risk: "low", emissions: 32100, spend: "$8.7M", trend: -1.8 },
  { id: "s3", name: "ElectroTech Solutions", country: "Taiwan", category: "Electronics", carbonScore: 58, risk: "medium", emissions: 67800, spend: "$15.2M", trend: 2.4 },
  { id: "s4", name: "HydraForce Industries", country: "USA", category: "Hydraulics", carbonScore: 71, risk: "low", emissions: 28400, spend: "$6.1M", trend: -4.5 },
  { id: "s5", name: "Global Steel Corp", country: "China", category: "Raw Materials", carbonScore: 42, risk: "high", emissions: 98400, spend: "$22.8M", trend: 5.1 },
  { id: "s6", name: "EcoPack Solutions", country: "Netherlands", category: "Packaging", carbonScore: 88, risk: "low", emissions: 8900, spend: "$2.3M", trend: -6.2 },
  { id: "s7", name: "TransLog Express", country: "Poland", category: "Logistics", carbonScore: 55, risk: "medium", emissions: 41200, spend: "$9.5M", trend: 1.2 },
  { id: "s8", name: "ChemBase Industries", country: "India", category: "Chemicals", carbonScore: 38, risk: "high", emissions: 56700, spend: "$4.8M", trend: 3.8 },
];

export const complianceFrameworks = [
  {
    id: "csrd",
    name: "CSRD",
    fullName: "Corporate Sustainability Reporting Directive",
    progress: 78,
    status: "On Track",
    items: [
      { name: "Double materiality assessment", done: true },
      { name: "Scope 1-3 data collection", done: true },
      { name: "ESRS E1 climate disclosure", done: false },
      { name: "Third-party assurance", done: false },
    ],
  },
  {
    id: "ghg",
    name: "GHG Protocol",
    fullName: "Greenhouse Gas Protocol",
    progress: 92,
    status: "Compliant",
    items: [
      { name: "Organizational boundary defined", done: true },
      { name: "Scope 1 inventory complete", done: true },
      { name: "Scope 2 market-based", done: true },
      { name: "Scope 3 categories 1-15", done: true },
    ],
  },
  {
    id: "iso",
    name: "ISO 14064",
    fullName: "ISO 14064-1:2018",
    progress: 85,
    status: "On Track",
    items: [
      { name: "GHG inventory quantification", done: true },
      { name: "Uncertainty assessment", done: true },
      { name: "Verification readiness", done: false },
      { name: "Management system integration", done: false },
    ],
  },
  {
    id: "esg",
    name: "ESG Readiness",
    fullName: "Enterprise ESG Maturity",
    progress: 71,
    status: "In Progress",
    items: [
      { name: "Board-level ESG governance", done: true },
      { name: "Stakeholder engagement plan", done: true },
      { name: "Climate risk scenario analysis", done: false },
      { name: "Biodiversity impact assessment", done: false },
    ],
  },
];

export const reports = [
  { id: "r1", name: "Annual Sustainability Report", type: "ESG", lastGenerated: "2025-11-30", status: "Ready" },
  { id: "r2", name: "GHG Inventory Report", type: "Emissions", lastGenerated: "2025-12-15", status: "Ready" },
  { id: "r3", name: "CSRD Disclosure Draft", type: "Compliance", lastGenerated: "2026-01-10", status: "Draft" },
  { id: "r4", name: "Supplier Carbon Assessment", type: "Supply Chain", lastGenerated: "2025-10-20", status: "Ready" },
  { id: "r5", name: "Product Carbon Footprint Summary", type: "PCF", lastGenerated: "2025-12-01", status: "Ready" },
  { id: "r6", name: "TCFD Climate Risk Report", type: "Risk", lastGenerated: "2025-09-15", status: "Ready" },
];

export const carbonForecast = [
  { year: "2024", actual: 512450, projected: null, target: 520000 },
  { year: "2025", actual: 487320, projected: 487320, target: 480000 },
  { year: "2026", actual: null, projected: 452000, target: 440000 },
  { year: "2027", actual: null, projected: 418000, target: 400000 },
  { year: "2028", actual: null, projected: 385000, target: 360000 },
  { year: "2029", actual: null, projected: 352000, target: 320000 },
  { year: "2030", actual: null, projected: 320000, target: 280000 },
];

export const reductionOpportunities = [
  { id: "o1", title: "Fleet electrification", impact: 12400, cost: 2400000, payback: "3.2 years", priority: "high" },
  { id: "o2", title: "Solar installation (Barcelona)", impact: 6800, cost: 890000, payback: "4.1 years", priority: "high" },
  { id: "o3", title: "Supplier engagement program", impact: 18200, cost: 450000, payback: "1.8 years", priority: "medium" },
  { id: "o4", title: "Heat recovery systems", impact: 4200, cost: 620000, payback: "5.5 years", priority: "medium" },
  { id: "o5", title: "Packaging material switch", impact: 2100, cost: 120000, payback: "2.1 years", priority: "low" },
];

export const riskIndicators = [
  { category: "Regulatory", level: "medium", description: "EU CBAM tariffs may increase import costs by 8-12% for steel components." },
  { category: "Supply Chain", level: "high", description: "Global Steel Corp accounts for 20% of Scope 3 Category 1 emissions with declining carbon score." },
  { category: "Physical Climate", level: "low", description: "Barcelona facility faces moderate flood risk under RCP 4.5 scenario by 2040." },
  { category: "Transition", level: "medium", description: "Customer contracts increasingly require PCF data — 34% of revenue at risk without disclosure." },
];

export const industries = [
  "Industrial Manufacturing",
  "Automotive",
  "Technology & Electronics",
  "Food & Beverage",
  "Retail & Consumer Goods",
  "Energy & Utilities",
  "Healthcare & Pharma",
  "Financial Services",
];

export const aiChatResponses: Record<string, string> = {
  default: "Based on Nordic Manufacturing Group's latest data, your total emissions stand at 487,320 tCO₂e — a 4.9% reduction from last year. Scope 3 remains your largest category at 49.5% of total emissions. Would you like me to dive deeper into any specific area?",
  emissions: "Your emission breakdown for FY2025:\n\n• Scope 1 (Direct): 89,240 tCO₂e (18.3%)\n• Scope 2 (Energy): 156,780 tCO₂e (32.2%)\n• Scope 3 (Value Chain): 241,300 tCO₂e (49.5%)\n\nThe largest Scope 3 categories are purchased goods (Cat. 1) at 38% and upstream transport (Cat. 4) at 22%.",
  reduction: "I've identified 5 high-impact reduction opportunities totaling 43,700 tCO₂e potential savings:\n\n1. Fleet electrification — 12,400 tCO₂e\n2. Supplier engagement — 18,200 tCO₂e\n3. Solar installation — 6,800 tCO₂e\n4. Heat recovery — 4,200 tCO₂e\n5. Packaging switch — 2,100 tCO₂e\n\nCombined estimated savings: $795,000/year in carbon costs.",
  compliance: "Your compliance status overview:\n\n• CSRD: 78% complete — on track for Jun 2026 deadline\n• GHG Protocol: 92% — fully compliant\n• ISO 14064: 85% — verification pending\n• ESG Readiness: 71% — climate risk analysis needed\n\nPriority action: Complete ESRS E1 climate disclosure section.",
  suppliers: "Supplier risk summary:\n\n• 2 high-risk suppliers identified (Global Steel Corp, ChemBase Industries)\n• Combined emissions: 155,100 tCO₂e (32% of Scope 3 Cat. 1)\n• Recommended: Initiate supplier engagement program with tier-1 suppliers in Q1 2026\n• EcoPack Solutions leads with carbon score of 88/100",
};

export const suggestedPrompts = [
  "What are our total emissions this year?",
  "Show me reduction opportunities",
  "What's our compliance status?",
  "Which suppliers are high risk?",
  "How can we reduce Scope 3 emissions?",
  "Generate a summary for the board",
];

export const notifications = [
  { id: "n1", title: "CSRD deadline approaching", message: "ESRS E1 disclosure due in 142 days", time: "1h ago", read: false },
  { id: "n2", title: "Supplier alert", message: "Global Steel Corp carbon score dropped to 42", time: "3h ago", read: false },
  { id: "n3", title: "Report ready", message: "Q4 GHG Inventory Report is available", time: "Yesterday", read: true },
  { id: "n4", title: "AI insight", message: "New optimization found for Rotterdam logistics", time: "2 days ago", read: true },
];
