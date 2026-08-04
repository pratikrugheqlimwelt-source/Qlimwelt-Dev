import type { ConnectorCategory, ConnectorCategoryId, ConnectorDef } from "./types";

export const CONNECTOR_CATEGORIES: ConnectorCategory[] = [
  { id: "erp", label: "ERP Systems", description: "Enterprise resource planning platforms" },
  { id: "accounting", label: "Accounting", description: "Finance and bookkeeping systems" },
  { id: "procurement", label: "Procurement", description: "Purchase and supplier platforms" },
  { id: "cloud", label: "Cloud Providers", description: "Cloud infrastructure accounts" },
  { id: "energy", label: "Energy", description: "Meters, utilities, and IoT energy feeds" },
  { id: "logistics", label: "Logistics", description: "Shipping and fleet systems" },
  { id: "hr", label: "HR", description: "Workforce and commuting data sources" },
  { id: "travel", label: "Travel", description: "Business travel platforms" },
  { id: "manufacturing", label: "Manufacturing", description: "Plant and process systems" },
  { id: "documents", label: "Documents", description: "Files and structured data imports" },
  { id: "future", label: "Ecosystem", description: "CRM, banking, registries, and partner platforms" },
];

function c(
  partial: Omit<ConnectorDef, "authMethods" | "features" | "status"> &
    Partial<Pick<ConnectorDef, "authMethods" | "features" | "status">>
): ConnectorDef {
  return {
    features: partial.features ?? ["Data sync", "Emission mapping", "Audit trail"],
    authMethods: partial.authMethods ?? ["api_key", "oauth", "client_secret"],
    ...partial,
    status: "available",
  };
}

export const CONNECTOR_CATALOG: ConnectorDef[] = [
  // ERP
  c({ id: "sap", name: "SAP", category: "erp", mark: "SA", description: "Enterprise ERP for finance, procurement, and operations.", status: "available" }),
  c({ id: "oracle", name: "Oracle", category: "erp", mark: "OR", description: "Oracle Cloud ERP and financials.", status: "available" }),
  c({ id: "dynamics365", name: "Microsoft Dynamics 365", category: "erp", mark: "D365", description: "Microsoft Dynamics 365 business applications.", status: "available" }),
  c({ id: "netsuite", name: "NetSuite", category: "erp", mark: "NS", description: "Cloud ERP for mid-market and enterprise.", status: "available" }),
  c({ id: "odoo", name: "Odoo", category: "erp", mark: "OD", description: "Open-source ERP suite.", status: "available" }),

  // Accounting
  c({ id: "datev", name: "DATEV", category: "accounting", mark: "DV", description: "German accounting and tax workflows.", status: "available" }),
  c({ id: "quickbooks", name: "QuickBooks", category: "accounting", mark: "QB", description: "Small-business accounting ledgers.", status: "available" }),
  c({ id: "xero", name: "Xero", category: "accounting", mark: "XE", description: "Cloud accounting platform.", status: "available" }),
  c({ id: "sage", name: "Sage", category: "accounting", mark: "SG", description: "Sage accounting and finance.", status: "available" }),
  c({ id: "freshbooks", name: "FreshBooks", category: "accounting", mark: "FB", description: "Invoicing and expense accounting.", status: "available" }),

  // Procurement
  c({ id: "coupa", name: "Coupa", category: "procurement", mark: "CP", description: "Spend management and procurement.", status: "available" }),
  c({ id: "ariba", name: "Ariba", category: "procurement", mark: "AR", description: "SAP Ariba supplier network.", status: "available" }),
  c({ id: "jaggaer", name: "Jaggaer", category: "procurement", mark: "JG", description: "Source-to-pay procurement suite.", status: "available" }),
  c({ id: "zip", name: "Zip", category: "procurement", mark: "ZP", description: "Intake-to-procure workflows.", status: "available" }),
  c({ id: "sap-procurement", name: "SAP Procurement", category: "procurement", mark: "SP", description: "SAP purchasing modules.", status: "available" }),

  // Cloud
  c({ id: "aws", name: "AWS", category: "cloud", mark: "AWS", description: "Amazon Web Services usage and billing.", status: "available", features: ["Cost & usage", "Region mapping", "Scope 3 cloud"] }),
  c({ id: "azure", name: "Azure", category: "cloud", mark: "AZ", description: "Microsoft Azure cloud emissions.", status: "available" }),
  c({ id: "gcp", name: "Google Cloud", category: "cloud", mark: "GC", description: "Google Cloud Platform usage data.", status: "available" }),

  // Energy
  c({ id: "smart-meter", name: "Smart Meter", category: "energy", mark: "SM", description: "Interval meter feeds for buildings.", status: "available" }),
  c({ id: "utility-provider", name: "Utility Provider", category: "energy", mark: "UP", description: "Utility bills and tariff data.", status: "available" }),
  c({ id: "iot-devices", name: "IoT Devices", category: "energy", mark: "IoT", description: "Sensor streams for energy and assets.", status: "available" }),
  c({ id: "energy-apis", name: "Energy APIs", category: "energy", mark: "EA", description: "Third-party energy data APIs.", status: "available" }),

  // Logistics
  c({ id: "dhl", name: "DHL", category: "logistics", mark: "DHL", description: "Parcel and freight shipping data.", status: "available" }),
  c({ id: "ups", name: "UPS", category: "logistics", mark: "UPS", description: "UPS shipment activity.", status: "available" }),
  c({ id: "fedex", name: "FedEx", category: "logistics", mark: "FX", description: "FedEx logistics activity.", status: "available" }),
  c({ id: "fleet-systems", name: "Fleet Systems", category: "logistics", mark: "FL", description: "Fleet telematics and fuel cards.", status: "available" }),

  // HR
  c({ id: "workday", name: "Workday", category: "hr", mark: "WD", description: "HRIS workforce and location data.", status: "available" }),
  c({ id: "personio", name: "Personio", category: "hr", mark: "PE", description: "HR platform for European teams.", status: "available" }),
  c({ id: "successfactors", name: "SAP SuccessFactors", category: "hr", mark: "SF", description: "SAP HCM and employee data.", status: "available" }),

  // Travel
  c({ id: "navan", name: "Navan", category: "travel", mark: "NV", description: "Corporate travel bookings.", status: "available" }),
  c({ id: "concur", name: "SAP Concur", category: "travel", mark: "SC", description: "Travel and expense management.", status: "available" }),
  c({ id: "travelperk", name: "TravelPerk", category: "travel", mark: "TP", description: "Business travel platform.", status: "available" }),

  // Manufacturing
  c({ id: "mes", name: "MES", category: "manufacturing", mark: "MES", description: "Manufacturing execution systems.", status: "available" }),
  c({ id: "scada", name: "SCADA", category: "manufacturing", mark: "SC", description: "Supervisory control and data acquisition.", status: "available" }),
  c({ id: "plc", name: "PLC", category: "manufacturing", mark: "PLC", description: "Programmable logic controller feeds.", status: "available" }),
  c({ id: "factory-apis", name: "Factory APIs", category: "manufacturing", mark: "FA", description: "Custom plant and factory APIs.", status: "available" }),

  // Documents — available
  c({
    id: "csv",
    name: "CSV",
    category: "documents",
    mark: "CSV",
    description: "Import structured CSV activity and emissions data.",
    status: "available",
    authMethods: ["api_key"],
    features: ["Column mapping", "Validation", "Bulk import"],
  }),
  c({
    id: "excel",
    name: "Excel",
    category: "documents",
    mark: "XLS",
    description: "Import Excel workbooks with guided field mapping.",
    status: "available",
    authMethods: ["api_key"],
    features: ["Sheet preview", "Validation", "Bulk import"],
  }),
  c({
    id: "pdf",
    name: "PDF",
    category: "documents",
    mark: "PDF",
    description: "Upload utility bills and reports for extraction.",
    status: "available",
    authMethods: ["api_key"],
    features: ["Evidence store", "Manual review", "Audit trail"],
  }),
  c({
    id: "json",
    name: "JSON",
    category: "documents",
    mark: "JS",
    description: "Import JSON payloads from internal systems.",
    status: "available",
    authMethods: ["api_key"],
    features: ["Schema check", "Bulk import", "API-ready"],
  }),
  c({
    id: "xml",
    name: "XML",
    category: "documents",
    mark: "XML",
    description: "Import XML exports from legacy enterprise systems.",
    status: "available",
    authMethods: ["api_key"],
    features: ["Schema check", "Bulk import", "Audit trail"],
  }),

  // Future
  c({ id: "carbon-registries", name: "Carbon Registries", category: "future", mark: "CR", description: "Offset and registry linkages.", status: "available" }),
  c({ id: "banks", name: "Banks", category: "future", mark: "BK", description: "Banking and transaction feeds.", status: "available" }),
  c({ id: "salesforce", name: "Salesforce", category: "future", mark: "SF", description: "CRM account and opportunity data.", status: "available" }),
  c({ id: "hubspot", name: "HubSpot", category: "future", mark: "HS", description: "CRM and marketing data.", status: "available" }),
  c({ id: "stripe", name: "Stripe", category: "future", mark: "ST", description: "Payment and merchant activity.", status: "available" }),
  c({ id: "iot-platforms", name: "IoT Platforms", category: "future", mark: "IP", description: "Cross-vendor IoT platforms.", status: "available" }),
  c({ id: "esg-platforms", name: "ESG Platforms", category: "future", mark: "ESG", description: "Third-party ESG data platforms.", status: "available" }),
  c({ id: "satellite-apis", name: "Satellite APIs", category: "future", mark: "SAT", description: "Geospatial and satellite datasets.", status: "available" }),
  c({ id: "gov-registries", name: "Government Registries", category: "future", mark: "GV", description: "Public regulatory registries.", status: "available" }),
  c({ id: "supplier-portals", name: "Supplier Portals", category: "future", mark: "SP", description: "Supplier self-service portals.", status: "available" }),
];

export function getConnectorById(id: string): ConnectorDef | undefined {
  return CONNECTOR_CATALOG.find((x) => x.id === id);
}

export function connectorsByCategory(category: ConnectorCategoryId): ConnectorDef[] {
  return CONNECTOR_CATALOG.filter((x) => x.category === category);
}

export function primaryCategories(): ConnectorCategory[] {
  return CONNECTOR_CATEGORIES;
}

export function ecosystemConnectors(): ConnectorDef[] {
  return CONNECTOR_CATALOG.filter((x) => x.category === "future");
}

/** @deprecated use ecosystemConnectors */
export function futureConnectors(): ConnectorDef[] {
  return ecosystemConnectors();
}
