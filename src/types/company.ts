export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  headquarters_country: string | null;
  countries_of_operation: string[];
  employee_count: number | null;
  annual_revenue: number | null;
  currency: string;
  facility_count: number | null;
  created_at: string;
  updated_at: string;
}
