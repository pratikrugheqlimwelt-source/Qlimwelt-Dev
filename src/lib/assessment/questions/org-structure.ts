import type { QuestionDefinition } from "@/types/assessment";

export const ORG_STRUCTURE_QUESTION: QuestionDefinition = {
  id: "org_structure",
  section: "company_profile",
  type: "single_select",
  label: "How is your company structured?",
  required: true,
  options: [
    { value: "one_office", label: "One office or location" },
    { value: "multiple_offices", label: "Multiple offices" },
    { value: "manufacturing", label: "Manufacturing company" },
    { value: "retail_hospitality", label: "Retail or hospitality locations" },
    { value: "logistics_fleet", label: "Logistics or fleet-based company" },
    { value: "digital_software", label: "Digital or software company" },
    { value: "mixed", label: "Mixed operations" },
  ],
};

export const STRUCTURE_FOLLOWUPS: QuestionDefinition[] = [
  // One office
  {
    id: "office_address",
    section: "structure_one_office",
    type: "text",
    label: "Office address",
    visibleWhen: { questionId: "org_structure", equals: "one_office" },
  },
  {
    id: "office_floor_area",
    section: "structure_one_office",
    type: "number",
    label: "Floor area (m²)",
    visibleWhen: { questionId: "org_structure", equals: "one_office" },
  },
  {
    id: "office_employees",
    section: "structure_one_office",
    type: "number",
    label: "Number of employees at this location",
    visibleWhen: { questionId: "org_structure", equals: "one_office" },
  },
  {
    id: "office_ownership",
    section: "structure_one_office",
    type: "single_select",
    label: "Ownership",
    options: [
      { value: "owned", label: "Owned" },
      { value: "rented", label: "Rented" },
      { value: "coworking", label: "Co-working" },
    ],
    visibleWhen: { questionId: "org_structure", equals: "one_office" },
  },
  {
    id: "office_electricity_responsibility",
    section: "structure_one_office",
    type: "single_select",
    label: "Who pays for electricity?",
    options: [
      { value: "company", label: "Our company" },
      { value: "landlord", label: "Landlord" },
      { value: "shared", label: "Shared / included in rent" },
      { value: "unknown", label: "Not sure" },
    ],
    visibleWhen: { questionId: "org_structure", equals: "one_office" },
  },
  {
    id: "office_heating_responsibility",
    section: "structure_one_office",
    type: "single_select",
    label: "Who pays for heating?",
    options: [
      { value: "company", label: "Our company" },
      { value: "landlord", label: "Landlord" },
      { value: "shared", label: "Shared / included in rent" },
      { value: "unknown", label: "Not sure" },
    ],
    visibleWhen: { questionId: "org_structure", equals: "one_office" },
  },
  // Multiple offices
  {
    id: "office_count",
    section: "structure_multiple_offices",
    type: "number",
    label: "How many office locations?",
    visibleWhen: { questionId: "org_structure", equals: "multiple_offices" },
  },
  {
    id: "locations_summary",
    section: "structure_multiple_offices",
    type: "textarea",
    label: "List locations (name, city, approx. floor area)",
    help: "You can refine facilities under Resources later.",
    visibleWhen: { questionId: "org_structure", equals: "multiple_offices" },
  },
  // Manufacturing
  {
    id: "factory_count",
    section: "structure_manufacturing",
    type: "number",
    label: "Number of factories",
    visibleWhen: { questionId: "org_structure", equals: "manufacturing" },
  },
  {
    id: "products_manufactured",
    section: "structure_manufacturing",
    type: "textarea",
    label: "Products manufactured",
    visibleWhen: { questionId: "org_structure", equals: "manufacturing" },
  },
  {
    id: "has_refrigeration_systems",
    section: "structure_manufacturing",
    type: "boolean",
    label: "Do factories use refrigeration systems?",
    visibleWhen: { questionId: "org_structure", equals: "manufacturing" },
  },
  {
    id: "has_industrial_gases",
    section: "structure_manufacturing",
    type: "boolean",
    label: "Do you use industrial process gases?",
    visibleWhen: { questionId: "org_structure", equals: "manufacturing" },
  },
  // Retail
  {
    id: "retail_location_count",
    section: "structure_retail",
    type: "number",
    label: "Number of locations",
    visibleWhen: { questionId: "org_structure", equals: "retail_hospitality" },
  },
  {
    id: "retail_type",
    section: "structure_retail",
    type: "single_select",
    label: "Primary location type",
    options: [
      { value: "store", label: "Store" },
      { value: "restaurant", label: "Restaurant" },
      { value: "hotel", label: "Hotel" },
      { value: "mixed", label: "Mixed" },
    ],
    visibleWhen: { questionId: "org_structure", equals: "retail_hospitality" },
  },
  {
    id: "retail_has_refrigeration",
    section: "structure_retail",
    type: "boolean",
    label: "Do locations use refrigeration equipment?",
    visibleWhen: { questionId: "org_structure", equals: "retail_hospitality" },
  },
  // Logistics
  {
    id: "fleet_vehicle_count",
    section: "structure_logistics",
    type: "number",
    label: "Number of vehicles",
    visibleWhen: { questionId: "org_structure", equals: "logistics_fleet" },
  },
  {
    id: "fleet_fuel_types",
    section: "structure_logistics",
    type: "multi_select",
    label: "Fuel types in the fleet",
    options: [
      { value: "diesel", label: "Diesel" },
      { value: "petrol", label: "Petrol" },
      { value: "electric", label: "Electric" },
      { value: "hybrid", label: "Hybrid" },
      { value: "lng", label: "LNG / CNG" },
    ],
    visibleWhen: { questionId: "org_structure", equals: "logistics_fleet" },
  },
  {
    id: "has_warehouses",
    section: "structure_logistics",
    type: "boolean",
    label: "Do you operate warehouses?",
    visibleWhen: { questionId: "org_structure", equals: "logistics_fleet" },
  },
  // Digital
  {
    id: "cloud_providers",
    section: "structure_digital",
    type: "textarea",
    label: "Cloud / data-centre providers used",
    visibleWhen: { questionId: "org_structure", equals: "digital_software" },
  },
  {
    id: "remote_working_policy",
    section: "structure_digital",
    type: "single_select",
    label: "Remote-working policy",
    options: [
      { value: "office_first", label: "Office-first" },
      { value: "hybrid", label: "Hybrid" },
      { value: "remote_first", label: "Remote-first" },
    ],
    visibleWhen: { questionId: "org_structure", equals: "digital_software" },
  },
  // Mixed
  {
    id: "mixed_operations_notes",
    section: "structure_mixed",
    type: "textarea",
    label: "Briefly describe your main operations",
    visibleWhen: { questionId: "org_structure", equals: "mixed" },
  },
];

export const PROFILE_BASIC_QUESTIONS: QuestionDefinition[] = [
  { id: "legal_name", section: "company_profile", type: "text", label: "Company legal name", required: true },
  { id: "trading_name", section: "company_profile", type: "text", label: "Trading name" },
  { id: "industry", section: "company_profile", type: "text", label: "Industry", required: true },
  { id: "country_of_registration", section: "company_profile", type: "text", label: "Country of registration", required: true },
  { id: "headquarters", section: "company_profile", type: "text", label: "Headquarters location" },
  { id: "website", section: "company_profile", type: "text", label: "Company website", placeholder: "https://" },
  { id: "employees", section: "company_profile", type: "number", label: "Number of employees", required: true },
  {
    id: "revenue_range",
    section: "company_profile",
    type: "single_select",
    label: "Annual revenue range",
    options: [
      { value: "under_1m", label: "Under €1M" },
      { value: "1m_10m", label: "€1M – €10M" },
      { value: "10m_50m", label: "€10M – €50M" },
      { value: "50m_250m", label: "€50M – €250M" },
      { value: "over_250m", label: "Over €250M" },
    ],
  },
  {
    id: "currency",
    section: "company_profile",
    type: "single_select",
    label: "Reporting currency",
    options: [
      { value: "EUR", label: "EUR" },
      { value: "USD", label: "USD" },
      { value: "GBP", label: "GBP" },
    ],
  },
  { id: "primary_contact", section: "company_profile", type: "text", label: "Primary contact" },
  { id: "sustainability_contact", section: "company_profile", type: "text", label: "Sustainability contact" },
];
