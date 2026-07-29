export const dashboardCompany = {
  name: "Nordic Manufacturing Group",
  plan: "Enterprise",
};

export const dashboardKpis = {
  totalEmissions: 12450,
  totalChange: -8.3,
  scope1: 2840,
  scope2: 4120,
  scope3: 5490,
  esgScore: 74,
  carbonCostExposure: 622000,
  csrdReadiness: 76,
  reductionVsTarget: -38,
  reductionTargetYear: 2030,
};

export const monthlyEmissions = [
  { month: "Jan", scope1: 240, scope2: 350, scope3: 460, target: 1100 },
  { month: "Feb", scope1: 235, scope2: 345, scope3: 455, target: 1090 },
  { month: "Mar", scope1: 250, scope2: 360, scope3: 470, target: 1080 },
  { month: "Apr", scope1: 245, scope2: 355, scope3: 465, target: 1070 },
  { month: "May", scope1: 238, scope2: 348, scope3: 458, target: 1060 },
  { month: "Jun", scope1: 232, scope2: 340, scope3: 450, target: 1050 },
  { month: "Jul", scope1: 228, scope2: 335, scope3: 445, target: 1040 },
  { month: "Aug", scope1: 230, scope2: 338, scope3: 448, target: 1030 },
  { month: "Sep", scope1: 225, scope2: 330, scope3: 440, target: 1020 },
  { month: "Oct", scope1: 220, scope2: 325, scope3: 435, target: 1010 },
  { month: "Nov", scope1: 218, scope2: 320, scope3: 430, target: 1000 },
  { month: "Dec", scope1: 215, scope2: 318, scope3: 428, target: 990 },
];

export const departmentEmissions = [
  { dept: "Manufacturing", scope1: 1800, scope2: 1200, scope3: 2100 },
  { dept: "Logistics", scope1: 420, scope2: 680, scope3: 1420 },
  { dept: "Facilities", scope1: 380, scope2: 1680, scope3: 420 },
  { dept: "IT", scope1: 80, scope2: 340, scope3: 180 },
  { dept: "Corporate", scope1: 160, scope2: 220, scope3: 1370 },
];

export const topEmissionSources = [
  { source: "Electricity", emissions: 4120 },
  { source: "Supply Chain", emissions: 3890 },
  { source: "Manufacturing", emissions: 2840 },
  { source: "Logistics", emissions: 1920 },
  { source: "Facilities", emissions: 1480 },
];

export const renewableMix = [
  { name: "Renewable", value: 28, color: "#16a34a" },
  { name: "Grid Mix", value: 72, color: "#94a3b8" },
];

export const carbonCostTrend = [
  { year: "2023", cost: 420 },
  { year: "2024", cost: 510 },
  { year: "2025", cost: 622 },
  { year: "2026", cost: 680 },
  { year: "2027", cost: 809 },
];

export const dashboardSuppliers = [
  { id: "1", name: "MetalWorks SA", country: "Spain", category: "Raw Materials", scope3: 1840, riskScore: 82, risk: "high", sbti: "Not committed", disclosure: "Partial", trend: 12.4 },
  { id: "2", name: "ChemBase AG", country: "Germany", category: "Chemicals", scope3: 1620, riskScore: 78, risk: "high", sbti: "Committed", disclosure: "Full", trend: 8.2 },
  { id: "3", name: "TechParts GmbH", country: "Germany", category: "Components", scope3: 980, riskScore: 45, risk: "medium", sbti: "Validated", disclosure: "Full", trend: -2.1 },
  { id: "4", name: "LogiCargo EU", country: "Netherlands", category: "Logistics", scope3: 720, riskScore: 52, risk: "medium", sbti: "Not committed", disclosure: "Partial", trend: 4.5 },
  { id: "5", name: "PackGroup PL", country: "Poland", category: "Packaging", scope3: 410, riskScore: 28, risk: "low", sbti: "Committed", disclosure: "Full", trend: -5.8 },
  { id: "6", name: "SolarComp Ltd", country: "Sweden", category: "Energy", scope3: 180, riskScore: 15, risk: "low", sbti: "Validated", disclosure: "Full", trend: -12.3 },
];

export const dashboardReports = [
  { id: "r1", name: "CSRD Annual Report 2024", status: "Ready", format: "PDF" },
  { id: "r2", name: "Scope 3 Supplier Audit Q4", status: "Ready", format: "PDF" },
  { id: "r3", name: "EU Taxonomy Disclosure", status: "Ready", format: "PDF" },
  { id: "r4", name: "GRI Standards Report 2024", status: "Ready", format: "PDF" },
  { id: "r5", name: "TCFD Climate Risk Report", status: "Draft", format: "PDF" },
  { id: "r6", name: "Net Zero Transition Plan", status: "Ready", format: "PDF" },
];

export const csrdChecklist = [
  { name: "GHG Inventory", progress: 94 },
  { name: "Climate Risk", progress: 78 },
  { name: "Biodiversity", progress: 42 },
  { name: "Workforce", progress: 88 },
  { name: "Supply Chain Due Diligence", progress: 61 },
  { name: "Governance", progress: 97 },
];

export const aiRecommendations = [
  { id: "1", title: "Switch to 100% Renewables", priority: "high", saving: 4890, cost: 340000, roi: "2.4 yr" },
  { id: "2", title: "Initiate Supplier Data Collection", priority: "high", saving: 1780, cost: 12000, roi: "0.4 yr" },
  { id: "3", title: "Electrify Fleet", priority: "medium", saving: 620, cost: 220000, roi: "3.1 yr" },
  { id: "4", title: "Optimise Manufacturing Process Heat", priority: "medium", saving: 340, cost: 89000, roi: "2.8 yr" },
];

export const aiChips = [
  "Switch Rotterdam freight to rail — save 840 tCO₂e",
  "ChemBase AG driving 18% Scope 3 increase",
  "Renewable PPA available for Barcelona facility",
  "CSRD ESRS E1 draft ready for review",
];

export { qlimAiMessages as carbonChatMessages, qlimAiMessages } from "@/data/qlim-ai-data";

export const scopeBreakdown = [
  { name: "Scope 1", value: 2840, color: "#1e293b" },
  { name: "Scope 2", value: 4120, color: "#82E05C" },
  { name: "Scope 3", value: 5490, color: "#5cb832" },
];
