import type { QuestionDefinition } from "@/types/assessment";

export const BOUNDARY_QUESTIONS: QuestionDefinition[] = [
  {
    id: "period_start",
    section: "reporting_boundary",
    type: "date",
    label: "Reporting period start",
    required: true,
  },
  {
    id: "period_end",
    section: "reporting_boundary",
    type: "date",
    label: "Reporting period end",
    required: true,
  },
  {
    id: "base_year",
    section: "reporting_boundary",
    type: "number",
    label: "Base year",
    required: true,
  },
  {
    id: "reporting_standard",
    section: "reporting_boundary",
    type: "single_select",
    label: "Reporting standard",
    required: true,
    options: [
      { value: "ghg_corporate", label: "GHG Protocol Corporate Standard" },
      { value: "ghg_product", label: "GHG Protocol Product Standard" },
      { value: "pact_pcf", label: "PACT Product Carbon Footprint" },
      { value: "esrs_csrd", label: "ESRS / CSRD-oriented reporting" },
      { value: "custom_internal", label: "Custom internal assessment" },
    ],
  },
  {
    id: "consolidation",
    section: "reporting_boundary",
    type: "single_select",
    label: "Consolidation approach",
    required: true,
    help: "If unsure, Qlimwelt will recommend operational control and mark it as an assumption.",
    options: [
      { value: "operational_control", label: "Operational control" },
      { value: "financial_control", label: "Financial control" },
      { value: "equity_share", label: "Equity share" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: "included_entities",
    section: "reporting_boundary",
    type: "textarea",
    label: "Included legal entities",
  },
  {
    id: "included_locations",
    section: "reporting_boundary",
    type: "textarea",
    label: "Included locations",
  },
  {
    id: "excluded_locations",
    section: "reporting_boundary",
    type: "textarea",
    label: "Excluded locations",
  },
  {
    id: "currency",
    section: "reporting_boundary",
    type: "single_select",
    label: "Reporting currency",
    options: [
      { value: "EUR", label: "EUR" },
      { value: "USD", label: "USD" },
      { value: "GBP", label: "GBP" },
    ],
  },
  {
    id: "emission_unit",
    section: "reporting_boundary",
    type: "single_select",
    label: "Preferred emission unit",
    options: [
      { value: "tCO2e", label: "tCO₂e" },
      { value: "kgCO2e", label: "kgCO₂e" },
    ],
  },
];
