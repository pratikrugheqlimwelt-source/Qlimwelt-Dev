/**
 * Brand logo mapping for Connected Systems.
 * Prefers Simple Icons SVGs when present; otherwise high-res company favicons.
 */
export type ConnectorLogoMeta = {
  /** Company site used for favicon fallback */
  domain?: string;
  /** simple-icons export key, e.g. siSap */
  simpleIcon?: string;
};

export const CONNECTOR_LOGOS: Record<string, ConnectorLogoMeta> = {
  // ERP
  sap: { domain: "sap.com", simpleIcon: "siSap" },
  oracle: { domain: "oracle.com" },
  dynamics365: { domain: "dynamics.microsoft.com" },
  netsuite: { domain: "netsuite.com" },
  odoo: { domain: "odoo.com", simpleIcon: "siOdoo" },

  // Accounting
  datev: { domain: "datev.de", simpleIcon: "siDatev" },
  quickbooks: { domain: "quickbooks.intuit.com", simpleIcon: "siQuickbooks" },
  xero: { domain: "xero.com", simpleIcon: "siXero" },
  sage: { domain: "sage.com", simpleIcon: "siSage" },
  freshbooks: { domain: "freshbooks.com" },

  // Procurement
  coupa: { domain: "coupa.com" },
  ariba: { domain: "ariba.com" },
  jaggaer: { domain: "jaggaer.com" },
  zip: { domain: "ziphq.com" },
  "sap-procurement": { domain: "sap.com", simpleIcon: "siSap" },

  // Cloud
  aws: { domain: "aws.amazon.com" },
  azure: { domain: "azure.microsoft.com" },
  gcp: { domain: "cloud.google.com", simpleIcon: "siGooglecloud" },

  // Energy (category-style)
  "smart-meter": { domain: "siemens.com" },
  "utility-provider": { domain: "eon.com" },
  "iot-devices": { domain: "iot.google.com" },
  "energy-apis": { domain: "octopus.energy" },

  // Logistics
  dhl: { domain: "dhl.com", simpleIcon: "siDhl" },
  ups: { domain: "ups.com", simpleIcon: "siUps" },
  fedex: { domain: "fedex.com", simpleIcon: "siFedex" },
  "fleet-systems": { domain: "samsara.com" },

  // HR
  workday: { domain: "workday.com" },
  personio: { domain: "personio.com", simpleIcon: "siPersonio" },
  successfactors: { domain: "sap.com", simpleIcon: "siSap" },

  // Travel
  navan: { domain: "navan.com" },
  concur: { domain: "concur.com" },
  travelperk: { domain: "travelperk.com" },

  // Manufacturing
  mes: { domain: "siemens.com" },
  scada: { domain: "rockwellautomation.com" },
  plc: { domain: "abb.com" },
  "factory-apis": { domain: "ptc.com" },

  // Documents
  csv: { domain: "google.com", simpleIcon: "siGooglesheets" },
  excel: { domain: "microsoft.com" },
  pdf: { domain: "adobe.com" },
  json: { domain: "json.org", simpleIcon: "siJson" },
  xml: { domain: "w3.org" },

  // Ecosystem
  "carbon-registries": { domain: "verra.org" },
  banks: { domain: "deutsche-bank.de" },
  salesforce: { domain: "salesforce.com" },
  hubspot: { domain: "hubspot.com", simpleIcon: "siHubspot" },
  stripe: { domain: "stripe.com", simpleIcon: "siStripe" },
  "iot-platforms": { domain: "particle.io" },
  "esg-platforms": { domain: "sustainalytics.com" },
  "satellite-apis": { domain: "planet.com" },
  "gov-registries": { domain: "europa.eu" },
  "supplier-portals": { domain: "sap.com", simpleIcon: "siSap" },
};

export function faviconUrl(domain: string, size = 128): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}
