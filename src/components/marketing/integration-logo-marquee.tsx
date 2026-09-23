"use client";

import { useMemo, useState } from "react";
import * as simpleIcons from "simple-icons";
import { cn } from "@/lib/utils";

type SimpleIcon = {
  title: string;
  hex: string;
  path: string;
};

export type MarqueeLogo = {
  id: string;
  name: string;
  /** Company domain for DuckDuckGo icon fallback */
  domain?: string;
  /** simple-icons export key when available */
  simpleIcon?: string;
};

/**
 * Full ecosystem strip — logos only (no text substitutes).
 * Prefer Simple Icons; fall back to DuckDuckGo company icons.
 */
export const INTEGRATION_MARQUEE_LOGOS: MarqueeLogo[] = [
  // ERP & Finance
  { id: "sap", name: "SAP", domain: "sap.com", simpleIcon: "siSap" },
  { id: "oracle", name: "Oracle", domain: "oracle.com" },
  { id: "dynamics", name: "Microsoft Dynamics 365", domain: "microsoft.com" },
  { id: "netsuite", name: "NetSuite", domain: "netsuite.com" },
  { id: "odoo", name: "Odoo", domain: "odoo.com", simpleIcon: "siOdoo" },
  { id: "datev", name: "DATEV", domain: "datev.de", simpleIcon: "siDatev" },
  { id: "quickbooks", name: "QuickBooks", domain: "quickbooks.intuit.com", simpleIcon: "siQuickbooks" },
  { id: "xero", name: "Xero", domain: "xero.com", simpleIcon: "siXero" },
  { id: "sage", name: "Sage", domain: "sage.com", simpleIcon: "siSage" },
  { id: "freshbooks", name: "FreshBooks", domain: "freshbooks.com" },
  // Procurement
  { id: "coupa", name: "Coupa", domain: "coupa.com" },
  { id: "ariba", name: "SAP Ariba", domain: "ariba.com", simpleIcon: "siSap" },
  { id: "jaggaer", name: "JAGGAER", domain: "jaggaer.com" },
  { id: "zip", name: "Zip", domain: "ziphq.com" },
  // Cloud
  { id: "aws", name: "AWS", domain: "aws.amazon.com" },
  { id: "azure", name: "Microsoft Azure", domain: "azure.microsoft.com" },
  { id: "gcp", name: "Google Cloud", domain: "cloud.google.com", simpleIcon: "siGooglecloud" },
  // Energy & IoT
  { id: "siemens", name: "Siemens", domain: "siemens.com", simpleIcon: "siSiemens" },
  { id: "eon", name: "E.ON", domain: "eon.com" },
  { id: "landisgyr", name: "Smart Meter", domain: "landisgyr.com" },
  { id: "octopus", name: "Energy APIs", domain: "octopus.energy" },
  // Logistics & Fleet
  { id: "dhl", name: "DHL", domain: "dhl.com", simpleIcon: "siDhl" },
  { id: "ups", name: "UPS", domain: "ups.com", simpleIcon: "siUps" },
  { id: "fedex", name: "FedEx", domain: "fedex.com", simpleIcon: "siFedex" },
  { id: "samsara", name: "Samsara", domain: "samsara.com" },
  // HR & Travel
  { id: "workday", name: "Workday", domain: "workday.com" },
  { id: "personio", name: "Personio", domain: "personio.com", simpleIcon: "siPersonio" },
  { id: "successfactors", name: "SAP SuccessFactors", domain: "sap.com", simpleIcon: "siSap" },
  { id: "navan", name: "Navan", domain: "navan.com" },
  { id: "concur", name: "SAP Concur", domain: "concur.com" },
  { id: "travelperk", name: "TravelPerk", domain: "travelperk.com" },
  // Manufacturing
  { id: "rockwell", name: "Rockwell Automation", domain: "rockwellautomation.com", simpleIcon: "siRockwellautomation" },
  { id: "abb", name: "ABB", domain: "abb.com", simpleIcon: "siAbb" },
  { id: "ptc", name: "PTC", domain: "ptc.com" },
  // Data & Files
  { id: "excel", name: "Microsoft Excel", domain: "microsoft.com" },
  { id: "sheets", name: "CSV / Sheets", domain: "sheets.google.com", simpleIcon: "siGooglesheets" },
  { id: "adobe", name: "PDF", domain: "adobe.com" },
  { id: "json", name: "JSON", simpleIcon: "siJson" },
  { id: "xml", name: "XML", simpleIcon: "siXml" },
  // Business & Ecosystem
  { id: "deutsche-bank", name: "Deutsche Bank", domain: "db.com", simpleIcon: "siDeutschebank" },
  { id: "salesforce", name: "Salesforce", domain: "salesforce.com" },
  { id: "hubspot", name: "HubSpot", domain: "hubspot.com", simpleIcon: "siHubspot" },
  { id: "stripe", name: "Stripe", domain: "stripe.com", simpleIcon: "siStripe" },
  { id: "verra", name: "Carbon Registries", domain: "verra.org" },
  { id: "sustainalytics", name: "ESG Platforms", domain: "sustainalytics.com" },
  { id: "planet", name: "Satellite APIs", domain: "planet.com" },
  { id: "europa", name: "Government Registries", domain: "europa.eu" },
];

function getSimpleIcon(key?: string): SimpleIcon | null {
  if (!key) return null;
  const icon = (simpleIcons as Record<string, SimpleIcon | undefined>)[key];
  return icon?.path ? icon : null;
}

function companyIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

function MarqueeLogoItem({
  logo,
  opacityClass,
  decorative,
}: {
  logo: MarqueeLogo;
  opacityClass: string;
  decorative?: boolean;
}) {
  const brand = getSimpleIcon(logo.simpleIcon);
  const [imgFailed, setImgFailed] = useState(false);

  if (!brand && (!logo.domain || imgFailed)) {
    return null;
  }

  return (
    <li
      className={cn(
        "group/logo relative flex h-11 shrink-0 cursor-default items-center justify-center px-6 sm:px-8",
        "transition-opacity duration-300",
        opacityClass,
        "hover:!opacity-100"
      )}
      title={logo.name}
      aria-hidden={decorative || undefined}
    >
      {!decorative && <span className="sr-only">{logo.name}</span>}

      {brand ? (
        <svg
          role="img"
          viewBox="0 0 24 24"
          width={34}
          height={34}
          xmlns="http://www.w3.org/2000/svg"
          className="h-[34px] w-[34px]"
          aria-hidden
        >
          <title>{logo.name}</title>
          <path d={brand.path} fill={`#${brand.hex}`} />
        </svg>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={companyIconUrl(logo.domain!)}
          alt=""
          width={36}
          height={36}
          className="h-8 w-8 object-contain sm:h-9 sm:w-9"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      )}

      {!decorative && (
        <span
          role="tooltip"
          className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-200 group-hover/logo:opacity-100"
        >
          {logo.name}
        </span>
      )}
    </li>
  );
}

export function IntegrationLogoMarquee({
  className,
  logos = INTEGRATION_MARQUEE_LOGOS,
}: {
  className?: string;
  logos?: MarqueeLogo[];
}) {
  const opacityFor = (i: number) => {
    const n = i % 5;
    if (n === 0) return "opacity-90";
    if (n === 1) return "opacity-50";
    if (n === 2) return "opacity-75";
    if (n === 3) return "opacity-40";
    return "opacity-65";
  };

  const primary = useMemo(() => logos, [logos]);

  return (
    <div
      className={cn("logo-marquee relative w-full overflow-hidden py-3", className)}
      role="region"
      aria-label="Integration partners"
    >
      <ul className="logo-marquee-track flex w-max items-center gap-1 sm:gap-2">
        {primary.map((logo, i) => (
          <MarqueeLogoItem
            key={`${logo.id}-a-${i}`}
            logo={logo}
            opacityClass={opacityFor(i)}
          />
        ))}
        {primary.map((logo, i) => (
          <MarqueeLogoItem
            key={`${logo.id}-b-${i}`}
            logo={logo}
            opacityClass={opacityFor(i)}
            decorative
          />
        ))}
      </ul>
    </div>
  );
}
