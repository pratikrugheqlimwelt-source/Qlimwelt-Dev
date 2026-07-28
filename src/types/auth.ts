import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  profile_image_url: string | null;
  job_title: string | null;
  phone: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: "admin" | "manager" | "member" | "viewer";
  created_at: string;
}

export interface OnboardingResponse {
  id: string;
  user_id: string;
  company_id: string;
  emission_measurement_status: string | null;
  measured_scopes: string[];
  has_climate_target: boolean | null;
  reporting_standards: string[];
  interests: string[];
  sustainability_challenge: string | null;
  implementation_timeline: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: import("@/types/company").Company | null;
  membership: CompanyMember | null;
  loading: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshCompany: () => Promise<void>;
}
