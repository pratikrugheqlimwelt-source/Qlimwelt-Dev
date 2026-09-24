import { newEntityId } from "@/lib/bom/local-store";
import type { CarbonDataset, EmissionFactor } from "./types";

/** Seed a small demo dataset + factors for local / first-run use. */
export function seedDemoCarbonLibrary(companyId: string): {
  dataset: CarbonDataset;
  factors: EmissionFactor[];
} {
  const now = new Date().toISOString();
  const dataset: CarbonDataset = {
    id: newEntityId("cds"),
    companyId,
    code: "QLIM_DEMO_EF",
    name: "Qlimwelt Demo Emission Factors",
    source: "demo",
    geography: "GLO",
    methodology: "ipcc_ar6",
    versionLabel: "1",
    status: "active",
    notes: "Phase 1B demo library — replace with verified datasets",
    createdAt: now,
    updatedAt: now,
  };

  const defs: Array<{
    code: string;
    name: string;
    category: string;
    unit: string;
    value: number;
  }> = [
    { code: "ALU_PRIMARY", name: "Aluminium primary", category: "material", unit: "kg", value: 8.2 },
    { code: "STEEL_CRUDE", name: "Steel crude", category: "material", unit: "kg", value: 1.85 },
    { code: "ABS_POLYMER", name: "ABS polymer", category: "material", unit: "kg", value: 3.1 },
    { code: "COPPER_WIRE", name: "Copper wire", category: "material", unit: "kg", value: 4.5 },
    { code: "PCB_ASSEMBLY", name: "PCB assembly", category: "component", unit: "piece", value: 2.4 },
    { code: "PACK_CARDBOARD", name: "Corrugated cardboard", category: "packaging", unit: "kg", value: 0.9 },
    { code: "ELEC_GRID_EU", name: "Electricity grid EU avg", category: "energy", unit: "kwh", value: 0.23 },
  ];

  const factors: EmissionFactor[] = defs.map((d) => ({
    id: newEntityId("ef"),
    companyId,
    datasetId: dataset.id,
    factorCode: d.code,
    name: d.name,
    category: d.category,
    activityUnit: d.unit,
    valueKgco2e: d.value,
    uncertainty: 0.2,
    geography: "GLO",
    validFrom: null,
    validTo: null,
    metadata: { demo: true },
    createdAt: now,
    updatedAt: now,
  }));

  return { dataset, factors };
}
