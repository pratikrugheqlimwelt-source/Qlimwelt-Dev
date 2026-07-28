import { createClient } from "@/lib/supabase";
import type { CompanyMember } from "@/types/auth";
import type { Company } from "@/types/company";

export async function fetchUserCompany(userId: string): Promise<{
  company: Company | null;
  membership: CompanyMember | null;
}> {
  const supabase = createClient();

  const { data: membership, error: memberError } = await supabase
    .from("company_members")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError) {
    if (process.env.NODE_ENV === "development") console.error("[company member]", memberError);
    throw new Error("We couldn't load your workspace. Please try again.");
  }

  if (!membership) return { company: null, membership: null };

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", membership.company_id)
    .maybeSingle();

  if (companyError) {
    if (process.env.NODE_ENV === "development") console.error("[company]", companyError);
    throw new Error("We couldn't load your company details. Please try again.");
  }

  return {
    company: company as Company | null,
    membership: membership as CompanyMember,
  };
}

export async function fetchCompanyMembers(companyId: string) {
  const supabase = createClient();
  const { data: members, error } = await supabase
    .from("company_members")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("[team members]", error);
    throw new Error("We couldn't load team members.");
  }

  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, profile_image_url, job_title")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  return members.map((m) => ({
    ...m,
    profiles: profileMap.get(m.user_id) ?? null,
  }));
}
