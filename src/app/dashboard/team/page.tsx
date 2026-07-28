"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchCompanyMembers } from "@/services/companyService";

interface TeamMemberRow {
  id: string;
  role: string;
  profiles?: {
    full_name: string | null;
    email: string;
    profile_image_url: string | null;
    job_title: string | null;
  };
}

export default function TeamPage() {
  const { company, membership, profile } = useAuth();
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    fetchCompanyMembers(company.id)
      .then((data) => setMembers(data as TeamMemberRow[]))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [company?.id]);

  const isAdmin = membership?.role === "admin";

  return (
    <div className="space-y-6">
        <SectionHeader
          title="Team members"
          description="Manage who has access to your Qlimwelt workspace."
        />

        <div className="dash-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
            <p className="text-sm font-semibold">{company?.name ?? "Workspace"}</p>
            <Button disabled title="Team invitations are coming soon.">
              Invite team member
            </Button>
          </div>

          {!isAdmin && (
            <p className="border-b border-border/40 bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
              Only workspace admins can manage team settings.
            </p>
          )}

          <div className="divide-y divide-border/40">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">Loading team…</p>
            ) : members.length === 0 ? (
              <div className="flex items-center gap-4 px-5 py-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.profile_image_url ?? undefined} />
                  <AvatarFallback>{profile?.full_name?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile?.full_name ?? "You"}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
                <Badge variant="secondary" className="ml-auto capitalize">
                  {membership?.role ?? "admin"}
                </Badge>
                <Badge variant="outline">Active</Badge>
              </div>
            ) : (
              members.map((member) => {
                const p = member.profiles;
                const name = p?.full_name ?? p?.email ?? "Member";
                return (
                  <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p?.profile_image_url ?? undefined} />
                      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{name}</p>
                      <p className="truncate text-sm text-muted-foreground">{p?.email}</p>
                      {p?.job_title && (
                        <p className="truncate text-xs text-muted-foreground">{p.job_title}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {member.role}
                    </Badge>
                    <Badge variant="outline">Active</Badge>
                  </div>
                );
              })
            )}
          </div>

          <p className="border-t border-border/40 px-5 py-3 text-xs text-muted-foreground">
            Team invitations are coming soon.
          </p>
        </div>
    </div>
  );
}
