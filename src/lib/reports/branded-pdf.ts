import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";

export type BrandedReportInput = {
  reportTitle: string;
  companyName: string;
  industry?: string;
  employeeCount?: number;
  revenueEUR?: number;
  currency?: string;
  periodLabel: string;
  generatedAt: string;
  totalTCO2e: number;
  scope1: number;
  scope2: number;
  scope3: number;
  activityCount: number;
  verifiedPct: number;
  estimatedPct?: number;
  carbonCostEUR?: number;
  targetName?: string;
  targetYear?: number;
  targetReductionPct?: number;
  baselineTCO2e?: number;
  baselineYear?: number;
  categories: { name: string; tCO2e: number }[];
  facilities: { name: string; country: string; tCO2e: number }[];
  initiatives: { name: string; status: string; reduction: number }[];
};

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 48;
const BRAND = rgb(0.51, 0.82, 0.325); // #82D153
const BRAND_DARK = rgb(0.24, 0.545, 0.18); // #3d8b2e
const INK = rgb(0.09, 0.13, 0.2);
const MUTED = rgb(0.39, 0.45, 0.55);
const LINE = rgb(0.86, 0.89, 0.93);
const HEADER_BG = rgb(0.95, 0.98, 0.94);
const WHITE = rgb(1, 1, 1);

function money(n: number | undefined, currency = "EUR") {
  if (n == null || Number.isNaN(n)) return "—";
  return `${currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function num(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function safe(text: string) {
  // WinAnsi-safe for StandardFonts
  return text
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/₂/g, "2")
    .replace(/₃/g, "3")
    .replace(/°/g, " deg")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function drawFooter(page: PDFPage, font: PDFFont, pageNo: number, pageCount: number) {
  page.drawLine({
    start: { x: MARGIN, y: 36 },
    end: { x: PAGE_W - MARGIN, y: 36 },
    thickness: 0.6,
    color: LINE,
  });
  page.drawText(safe("Qlimwelt Climate Intelligence"), {
    x: MARGIN,
    y: 22,
    size: 8,
    font,
    color: MUTED,
  });
  page.drawText(safe(`Confidential  |  Page ${pageNo} of ${pageCount}`), {
    x: PAGE_W - MARGIN - 130,
    y: 22,
    size: 8,
    font,
    color: MUTED,
  });
}

function drawBrandBar(page: PDFPage) {
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 8,
    width: PAGE_W,
    height: 8,
    color: BRAND,
  });
}

function drawHeader(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  logo: PDFImage | null,
  reportTitle: string,
  subtitle: string
) {
  drawBrandBar(page);

  let textX = MARGIN;
  if (logo) {
    const logoW = 28;
    const logoH = Math.min(28, (logo.height / logo.width) * logoW);
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_H - 58,
      width: logoW,
      height: logoH,
    });
    textX = MARGIN + logoW + 10;
  }

  page.drawText(safe("QLIMWELT"), {
    x: textX,
    y: PAGE_H - 42,
    size: 11,
    font: fontBold,
    color: BRAND_DARK,
  });
  page.drawText(safe("Climate Intelligence Platform"), {
    x: textX,
    y: PAGE_H - 54,
    size: 8,
    font,
    color: MUTED,
  });

  page.drawLine({
    start: { x: MARGIN, y: PAGE_H - 68 },
    end: { x: PAGE_W - MARGIN, y: PAGE_H - 68 },
    thickness: 1,
    color: LINE,
  });

  page.drawText(safe(reportTitle), {
    x: MARGIN,
    y: PAGE_H - 92,
    size: 16,
    font: fontBold,
    color: INK,
  });
  page.drawText(safe(subtitle), {
    x: MARGIN,
    y: PAGE_H - 108,
    size: 9,
    font,
    color: MUTED,
  });
}

type Col = { label: string; width: number; align?: "left" | "right" };

function drawTable(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  startY: number,
  columns: Col[],
  rows: string[][],
  opts?: { maxRows?: number }
) {
  const maxRows = opts?.maxRows ?? 22;
  const rowH = 18;
  const tableW = columns.reduce((s, c) => s + c.width, 0);
  let y = startY;

  // Header
  page.drawRectangle({
    x: MARGIN,
    y: y - rowH + 4,
    width: tableW,
    height: rowH,
    color: HEADER_BG,
  });
  page.drawRectangle({
    x: MARGIN,
    y: y - rowH + 4,
    width: tableW,
    height: rowH,
    borderColor: LINE,
    borderWidth: 0.7,
  });

  let x = MARGIN;
  for (const col of columns) {
    const label = safe(col.label);
    const tw = fontBold.widthOfTextAtSize(label, 8);
    const tx = col.align === "right" ? x + col.width - tw - 6 : x + 6;
    page.drawText(label, {
      x: tx,
      y: y - 9,
      size: 8,
      font: fontBold,
      color: BRAND_DARK,
    });
    x += col.width;
  }
  y -= rowH;

  const slice = rows.slice(0, maxRows);
  for (let i = 0; i < slice.length; i++) {
    const row = slice[i];
    if (i % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - rowH + 4,
        width: tableW,
        height: rowH,
        color: rgb(0.98, 0.99, 1),
      });
    }
    page.drawRectangle({
      x: MARGIN,
      y: y - rowH + 4,
      width: tableW,
      height: rowH,
      borderColor: LINE,
      borderWidth: 0.5,
    });

    x = MARGIN;
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      let cell = safe(row[c] ?? "");
      const maxW = col.width - 12;
      while (cell.length > 3 && font.widthOfTextAtSize(cell, 8) > maxW) {
        cell = cell.slice(0, -2) + ".";
      }
      const tw = font.widthOfTextAtSize(cell, 8);
      const tx = col.align === "right" ? x + col.width - tw - 6 : x + 6;
      page.drawText(cell, {
        x: tx,
        y: y - 9,
        size: 8,
        font,
        color: INK,
      });
      x += col.width;
    }
    y -= rowH;
  }

  if (rows.length > maxRows) {
    page.drawText(safe(`Showing top ${maxRows} of ${rows.length} rows.`), {
      x: MARGIN,
      y: y - 6,
      size: 8,
      font,
      color: MUTED,
    });
    y -= 16;
  }

  return y;
}

function infoPair(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  x: number,
  y: number,
  label: string,
  value: string
) {
  page.drawText(safe(label), { x, y, size: 8, font, color: MUTED });
  page.drawText(safe(value), { x, y: y - 12, size: 10, font: fontBold, color: INK });
}

/** Build a professional A4 branded Qlimwelt report PDF. */
export async function buildBrandedReportPdf(
  input: BrandedReportInput,
  logoBytes?: ArrayBuffer | Uint8Array | null
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let logo: PDFImage | null = null;
  if (logoBytes) {
    try {
      const bytes = logoBytes instanceof Uint8Array ? logoBytes : new Uint8Array(logoBytes);
      logo = await doc.embedPng(bytes);
    } catch {
      try {
        const bytes = logoBytes instanceof Uint8Array ? logoBytes : new Uint8Array(logoBytes);
        logo = await doc.embedJpg(bytes);
      } catch {
        logo = null;
      }
    }
  }

  const pageCount = 5;
  const subtitle = `${input.companyName}  |  Reporting period: ${input.periodLabel}`;

  // —— Page 1: Cover / Executive summary ——
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawHeader(page, font, fontBold, logo, input.reportTitle, subtitle);

    // Company info card
    const cardY = PAGE_H - 250;
    page.drawRectangle({
      x: MARGIN,
      y: cardY,
      width: PAGE_W - MARGIN * 2,
      height: 118,
      color: HEADER_BG,
      borderColor: LINE,
      borderWidth: 0.8,
    });
    page.drawText(safe("Prepared for"), {
      x: MARGIN + 14,
      y: cardY + 98,
      size: 8,
      font,
      color: MUTED,
    });
    page.drawText(safe(input.companyName), {
      x: MARGIN + 14,
      y: cardY + 82,
      size: 14,
      font: fontBold,
      color: INK,
    });

    infoPair(page, font, fontBold, MARGIN + 14, cardY + 58, "Industry", input.industry || "—");
    infoPair(
      page,
      font,
      fontBold,
      MARGIN + 170,
      cardY + 58,
      "Employees",
      input.employeeCount != null ? String(input.employeeCount) : "—"
    );
    infoPair(
      page,
      font,
      fontBold,
      MARGIN + 300,
      cardY + 58,
      "Annual revenue",
      input.revenueEUR != null ? `${input.currency ?? "EUR"} ${input.revenueEUR}M` : "—"
    );
    infoPair(page, font, fontBold, MARGIN + 14, cardY + 28, "Period", input.periodLabel);
    infoPair(page, font, fontBold, MARGIN + 170, cardY + 28, "Generated", input.generatedAt);
    infoPair(page, font, fontBold, MARGIN + 300, cardY + 28, "Platform", "Qlimwelt");

    page.drawText(safe("1. Executive emissions summary"), {
      x: MARGIN,
      y: cardY - 28,
      size: 12,
      font: fontBold,
      color: INK,
    });

    drawTable(
      page,
      font,
      fontBold,
      cardY - 44,
      [
        { label: "Metric", width: 280 },
        { label: "Value", width: 219, align: "right" },
      ],
      [
        ["Total GHG emissions (tCO2e)", num(input.totalTCO2e)],
        ["Scope 1 - Direct (tCO2e)", num(input.scope1)],
        ["Scope 2 - Purchased energy (tCO2e)", num(input.scope2)],
        ["Scope 3 - Value chain (tCO2e)", num(input.scope3)],
        ["Activity records", String(input.activityCount)],
        ["Verified share (%)", num(input.verifiedPct, 1)],
        ...(input.estimatedPct != null
          ? [["Estimated share (%)", num(input.estimatedPct, 1)]]
          : []),
        ...(input.carbonCostEUR != null
          ? [["Carbon cost exposure (EUR)", money(input.carbonCostEUR, "EUR")]]
          : []),
      ]
    );

    page.drawText(
      safe(
        "This report summarises inventory metrics for internal disclosure drafting and management review."
      ),
      {
        x: MARGIN,
        y: 72,
        size: 8,
        font,
        color: MUTED,
        maxWidth: PAGE_W - MARGIN * 2,
        lineHeight: 11,
      }
    );
    drawFooter(page, font, 1, pageCount);
  }

  // —— Page 2: Targets ——
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawHeader(page, font, fontBold, logo, "Climate targets & pathway", subtitle);

    page.drawText(safe("2. Target profile"), {
      x: MARGIN,
      y: PAGE_H - 130,
      size: 12,
      font: fontBold,
      color: INK,
    });

    drawTable(
      page,
      font,
      fontBold,
      PAGE_H - 148,
      [
        { label: "Field", width: 220 },
        { label: "Detail", width: 279 },
      ],
      [
        ["Target name", input.targetName ?? "Not configured"],
        ["Baseline year", input.baselineYear != null ? String(input.baselineYear) : "—"],
        ["Target year", input.targetYear != null ? String(input.targetYear) : "—"],
        [
          "Reduction commitment",
          input.targetReductionPct != null ? `${input.targetReductionPct}%` : "—",
        ],
        [
          "Baseline emissions",
          input.baselineTCO2e != null ? `${num(input.baselineTCO2e)} tCO2e` : "—",
        ],
      ]
    );

    page.drawText(safe("Governance checklist (draft)"), {
      x: MARGIN,
      y: PAGE_H - 310,
      size: 12,
      font: fontBold,
      color: INK,
    });

    const checks = [
      "Board oversight of climate targets documented",
      "Transition plan linked to CapEx / OpEx planning",
      "Scope 3 materiality assessment attached",
      "Primary evidence retained for assurance readiness",
    ];
    let cy = PAGE_H - 332;
    for (const item of checks) {
      page.drawRectangle({
        x: MARGIN,
        y: cy - 2,
        width: 10,
        height: 10,
        borderColor: BRAND_DARK,
        borderWidth: 1,
        color: WHITE,
      });
      page.drawText(safe(item), {
        x: MARGIN + 18,
        y: cy,
        size: 9,
        font,
        color: INK,
      });
      cy -= 22;
    }

    drawFooter(page, font, 2, pageCount);
  }

  // —— Page 3: Categories ——
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawHeader(page, font, fontBold, logo, "Emissions by category", subtitle);
    page.drawText(safe("3. Material category totals"), {
      x: MARGIN,
      y: PAGE_H - 130,
      size: 12,
      font: fontBold,
      color: INK,
    });

    const rows = input.categories.length
      ? input.categories.map((c, i) => [
          String(i + 1),
          c.name,
          num(c.tCO2e),
          input.totalTCO2e > 0 ? `${num((c.tCO2e / input.totalTCO2e) * 100, 1)}%` : "—",
        ])
      : [["—", "No category breakdown available", "—", "—"]];

    drawTable(
      page,
      font,
      fontBold,
      PAGE_H - 148,
      [
        { label: "#", width: 36 },
        { label: "Category", width: 280 },
        { label: "tCO2e", width: 90, align: "right" },
        { label: "Share", width: 93, align: "right" },
      ],
      rows,
      { maxRows: 28 }
    );
    drawFooter(page, font, 3, pageCount);
  }

  // —— Page 4: Facilities ——
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawHeader(page, font, fontBold, logo, "Facility allocation", subtitle);
    page.drawText(safe("4. Emissions by facility"), {
      x: MARGIN,
      y: PAGE_H - 130,
      size: 12,
      font: fontBold,
      color: INK,
    });

    const rows = input.facilities.length
      ? input.facilities.map((f, i) => [
          String(i + 1),
          f.name,
          f.country,
          num(f.tCO2e),
        ])
      : [["—", "No facility allocation available", "—", "—"]];

    drawTable(
      page,
      font,
      fontBold,
      PAGE_H - 148,
      [
        { label: "#", width: 36 },
        { label: "Facility", width: 250 },
        { label: "Country", width: 100 },
        { label: "tCO2e", width: 113, align: "right" },
      ],
      rows,
      { maxRows: 28 }
    );
    drawFooter(page, font, 4, pageCount);
  }

  // —— Page 5: Initiatives ——
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawHeader(page, font, fontBold, logo, "Reduction initiatives", subtitle);
    page.drawText(safe("5. Abatement pipeline"), {
      x: MARGIN,
      y: PAGE_H - 130,
      size: 12,
      font: fontBold,
      color: INK,
    });

    const rows = input.initiatives.length
      ? input.initiatives.map((i, idx) => [
          String(idx + 1),
          i.name,
          i.status,
          num(i.reduction),
        ])
      : [["—", "No initiatives recorded", "—", "—"]];

    drawTable(
      page,
      font,
      fontBold,
      PAGE_H - 148,
      [
        { label: "#", width: 36 },
        { label: "Initiative", width: 250 },
        { label: "Status", width: 100 },
        { label: "tCO2e / yr", width: 113, align: "right" },
      ],
      rows,
      { maxRows: 24 }
    );

    page.drawText(safe("End of report. Generated by Qlimwelt Climate Intelligence."), {
      x: MARGIN,
      y: 58,
      size: 8,
      font,
      color: MUTED,
    });
    drawFooter(page, font, 5, pageCount);
  }

  return doc.save();
}

/** CSV cover / metadata block for tabular exports. */
export function brandedCsvPreamble(meta: {
  reportTitle: string;
  companyName: string;
  industry?: string;
  periodLabel: string;
  generatedAt: string;
}): (string | number)[][] {
  return [
    ["Qlimwelt Climate Intelligence"],
    ["Report", meta.reportTitle],
    ["Company", meta.companyName],
    ["Industry", meta.industry ?? ""],
    ["Period", meta.periodLabel],
    ["Generated", meta.generatedAt],
    ["Confidential", "Internal use"],
    [],
  ];
}
