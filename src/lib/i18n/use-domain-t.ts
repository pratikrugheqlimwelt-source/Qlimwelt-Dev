"use client";

import { useCallback } from "react";
import { useT } from "@/components/i18n/locale-provider";

/** Maps English seed/domain values → i18n keys under `domain.*` */
const CATEGORY: Record<string, string> = {
  "Stationary combustion": "domain.cat.stationaryCombustion",
  "Mobile combustion": "domain.cat.mobileCombustion",
  "Fugitive emissions": "domain.cat.fugitiveEmissions",
  "Process emissions": "domain.cat.processEmissions",
  "Purchased electricity": "domain.cat.purchasedElectricity",
  "Purchased heat": "domain.cat.purchasedHeat",
  "Purchased heating": "domain.cat.purchasedHeating",
  "Purchased steam": "domain.cat.purchasedSteam",
  "Category 1": "domain.cat.category1",
  "Category 2": "domain.cat.category2",
  "Category 3": "domain.cat.category3",
  "Category 4": "domain.cat.category4",
  "Category 5": "domain.cat.category5",
  "Category 6": "domain.cat.category6",
  "Category 7": "domain.cat.category7",
  "Category 8": "domain.cat.category8",
  "Category 9": "domain.cat.category9",
  "Category 10": "domain.cat.category10",
  "Category 11": "domain.cat.category11",
  "Category 12": "domain.cat.category12",
  "Category 13": "domain.cat.category13",
  "Category 14": "domain.cat.category14",
  "Category 15": "domain.cat.category15",
  Custom: "domain.cat.custom",
};

const SUBCATEGORY: Record<string, string> = {
  "Natural gas": "domain.sub.naturalGas",
  "Natural gas combustion": "domain.sub.naturalGasCombustion",
  Diesel: "domain.sub.diesel",
  Petrol: "domain.sub.petrol",
  Refrigerants: "domain.sub.refrigerants",
  "Industrial process": "domain.sub.industrialProcess",
  "Grid electricity": "domain.sub.gridElectricity",
  "Grid mix": "domain.sub.gridMix",
  "District heating": "domain.sub.districtHeating",
  "Process steam": "domain.sub.processSteam",
  "Purchased goods": "domain.sub.purchasedGoods",
  "Capital goods": "domain.sub.capitalGoods",
  "Upstream transport": "domain.sub.upstreamTransport",
  "Downstream transport": "domain.sub.downstreamTransport",
  Freight: "domain.sub.freight",
  Travel: "domain.sub.travel",
  "Business travel": "domain.sub.businessTravel",
  Commuting: "domain.sub.commuting",
  "Employee commuting": "domain.sub.employeeCommuting",
  Waste: "domain.sub.waste",
};

const EVIDENCE: Record<string, string> = {
  none: "domain.evidence.none",
  pending: "domain.evidence.pending",
  uploaded: "domain.evidence.uploaded",
  verified: "domain.evidence.verified",
};

const UNIT: Record<string, string> = {
  litre: "domain.unit.litre",
  litres: "domain.unit.litre",
  l: "domain.unit.litre",
  kg: "domain.unit.kg",
  kWh: "domain.unit.kWh",
  MWh: "domain.unit.mwh",
  tonne: "domain.unit.tonne",
  EUR: "domain.unit.eur",
  km: "domain.unit.km",
  "passenger-km": "domain.unit.passengerKm",
  "tonne-km": "domain.unit.tonneKm",
  unit: "domain.unit.unit",
};

const SOURCE: Record<string, string> = {
  "Berlin Plant": "domain.source.berlinPlant",
  "Munich boiler": "domain.source.munichBoiler",
  "Hamburg heating": "domain.source.hamburgHeating",
  "Fleet fuel — vans": "domain.source.fleetVans",
  "Fleet fuel – vans": "domain.source.fleetVans",
  "Fleet fuel — cars": "domain.source.fleetCars",
  "Fleet fuel – cars": "domain.source.fleetCars",
  "HVAC Munich": "domain.source.hvacMunich",
  "Coating line": "domain.source.coatingLine",
  "Amsterdam office": "domain.source.amsterdamOffice",
  "Munich plant": "domain.source.munichPlant",
  "Hamburg warehouse": "domain.source.hamburgWarehouse",
  "Raw materials — steel": "domain.source.rawSteel",
  "Raw materials – steel": "domain.source.rawSteel",
  "Components & parts": "domain.source.components",
  "Machinery capex": "domain.source.machineryCapex",
  "Road freight inbound": "domain.source.roadFreightIn",
  "Road freight outbound": "domain.source.roadFreightOut",
  "General waste": "domain.source.generalWaste",
  "Flights — short haul": "domain.source.flightsShort",
  "Flights – short haul": "domain.source.flightsShort",
  "Flights — long haul": "domain.source.flightsLong",
  "Flights – long haul": "domain.source.flightsLong",
  "Car commute": "domain.source.carCommute",
  "Public transit": "domain.source.publicTransit",
  "German grid — Berlin": "domain.source.germanGridBerlin",
  "German grid — Munich": "domain.source.germanGridMunich",
  "Dutch grid — Amsterdam": "domain.source.dutchGridAmsterdam",
  "Munich Plant": "domain.source.munichPlantCap",
  "Hamburg Warehouse": "domain.source.hamburgWarehouseCap",
  "Amsterdam Office": "domain.source.amsterdamOfficeCap",
  Operations: "domain.bu.operations",
  Logistics: "domain.bu.logistics",
  "R&D": "domain.bu.rnd",
  "Sales & Marketing": "domain.bu.sales",
  Corporate: "domain.bu.corporate",
};

const METHOD: Record<string, string> = {
  fuel_based: "domain.method.fuelBased",
  location_based: "domain.method.locationBased",
  market_based: "domain.method.marketBased",
  spend_based: "domain.method.spendBased",
  distance_based: "domain.method.distanceBased",
  activity_specific: "domain.method.activitySpecific",
  average_data: "domain.method.averageData",
  "fuel based": "domain.method.fuelBased",
  "location based": "domain.method.locationBased",
  "spend based": "domain.method.spendBased",
  "distance based": "domain.method.distanceBased",
  "activity specific": "domain.method.activitySpecific",
  "average data": "domain.method.averageData",
};

const QUALITY: Record<string, string> = {
  high: "filters.qualityHigh",
  good: "filters.qualityGood",
  moderate: "filters.qualityModerate",
  low: "filters.qualityLow",
  Measured: "domain.quality.measured",
  Estimated: "domain.quality.estimated",
  measured: "domain.quality.measured",
  estimated: "domain.quality.estimated",
};

const PRESET: Record<string, { label: string; hint: string }> = {
  mobile: { label: "domain.preset.mobile", hint: "domain.preset.mobileHint" },
  gas: { label: "domain.preset.gas", hint: "domain.preset.gasHint" },
  refrigerants: { label: "domain.preset.refrigerants", hint: "domain.preset.refrigerantsHint" },
  electricity: { label: "domain.preset.electricity", hint: "domain.preset.electricityHint" },
  heat: { label: "domain.preset.heat", hint: "domain.preset.heatHint" },
  goods: { label: "domain.preset.goods", hint: "domain.preset.goodsHint" },
  freight: { label: "domain.preset.freight", hint: "domain.preset.freightHint" },
  travel: { label: "domain.preset.travel", hint: "domain.preset.travelHint" },
  commuting: { label: "domain.preset.commuting", hint: "domain.preset.commutingHint" },
  waste: { label: "domain.preset.waste", hint: "domain.preset.wasteHint" },
  custom: { label: "domain.preset.custom", hint: "domain.preset.customHint" },
};

const FACTOR: Record<string, string> = {
  "Template / manual factor": "domain.factor.templateManual",
  "Natural gas combustion": "domain.factor.naturalGas",
  "German grid electricity": "domain.factor.germanGrid",
  "Diesel road fuel": "domain.factor.diesel",
};

function lookup(map: Record<string, string>, value: string, t: (k: string) => string): string {
  const key = map[value] ?? map[value.replace(/–/g, "—")];
  return key ? t(key) : value;
}

/** Translate GHG / inventory domain strings (categories, methods, units, demo sources). */
export function useDomainT() {
  const t = useT();

  const category = useCallback((v: string) => lookup(CATEGORY, v, t), [t]);
  const subcategory = useCallback((v: string) => lookup(SUBCATEGORY, v, t), [t]);
  const method = useCallback((v: string) => lookup(METHOD, v, t), [t]);
  const quality = useCallback((v: string) => lookup(QUALITY, v, t), [t]);
  const evidence = useCallback((v: string) => lookup(EVIDENCE, v, t), [t]);
  const unit = useCallback((v: string) => lookup(UNIT, v, t), [t]);
  const source = useCallback((v: string) => lookup(SOURCE, v, t), [t]);
  const factorName = useCallback((v: string) => lookup(FACTOR, v, t), [t]);
  const scope = useCallback(
    (v: string) => {
      const n = v.replace(/\s/g, "").toLowerCase().replace("scope", "");
      if (n === "1" || n === "2" || n === "3") return t(`overview.scope${n}`);
      return v;
    },
    [t]
  );
  const preset = useCallback(
    (id: string) => {
      const keys = PRESET[id];
      if (!keys) return { label: id, hint: "" };
      return { label: t(keys.label), hint: t(keys.hint) };
    },
    [t]
  );
  const yesNo = useCallback((yes: boolean) => t(yes ? "common.yes" : "common.no"), [t]);

  return { category, subcategory, method, quality, evidence, unit, source, factorName, scope, preset, yesNo };
}
