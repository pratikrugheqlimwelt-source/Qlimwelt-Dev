"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpCorner } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { fetchCompanyMembers } from "@/services/companyService";
import {
  listTeamInvites,
  revokeTeamInvite,
  type TeamInviteRow,
} from "@/services/carbon/dashboardService";
import { toast } from "@/hooks/use-toast";

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
  const { inviteTeamMember, saving } = useDashboard();
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [invites, setInvites] = useState<TeamInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const isAdmin = membership?.role === "admin";

  const reload = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [memberData, inviteData] = await Promise.all([
        fetchCompanyMembers(company.id).catch(() => []),
        listTeamInvites(company.id).catch(() => [] as TeamInviteRow[]),
      ]);
      setMembers(memberData as TeamMemberRow[]);
      setInvites(inviteData);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    await inviteTeamMember(trimmed, role);
    try {
      const res = await fetch("/api/team/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: trimmed,
          role,
          companyName: company?.name ?? "Qlimwelt",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; emailed?: boolean };
      if (res.ok && data.emailed) {
        toast({ title: `Invite emailed to ${trimmed}`, variant: "success" });
      } else if (res.ok) {
        toast({
          title: "Invite recorded",
          description: "Email service unavailable — share the login link manually.",
        });
      }
    } catch {
      toast({
        title: "Invite recorded",
        description: "Could not send email — share the login link manually.",
      });
    }
    setEmail("");
    setShowInvite(false);
    await reload();
  };

  const handleRevoke = async (inviteId: string) => {
    if (!company?.id) return;
    try {
      await revokeTeamInvite(company.id, inviteId);
      toast({ title: "Invite revoked", variant: "success" });
      await reload();
    } catch (err) {
      toast({
        title: "Could not revoke invite",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const pending = invites.filter((i) => i.status === "pending");

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Team members"
        description="Invite colleagues. After they sign in with the invited email, they join this workspace automatically."
      />

      <div className="dash-card relative overflow-hidden">
        <HelpCorner content="Workspace team roster and pending invites. Admins can invite and revoke; invitees join via accept_team_invite on login." />
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 pr-12">
          <p className="text-sm font-semibold">{company?.name ?? "Workspace"}</p>
          <Button
            disabled={!isAdmin}
            title={isAdmin ? "Invite a colleague" : "Only admins can invite"}
            onClick={() => setShowInvite((v) => !v)}
          >
            Invite team member
          </Button>
        </div>

        {showInvite && isAdmin && (
          <div className="grid gap-3 border-b border-border/40 bg-muted/20 px-5 py-4 sm:grid-cols-[1fr_auto_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => void handleInvite()} disabled={saving || !email.includes("@")}>
                {saving ? "Sending…" : "Send invite"}
              </Button>
              <Button variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
            </div>
          </div>
        )}

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

        {pending.length > 0 && (
          <div className="border-t border-border/40">
            <p className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending invites ({pending.length})
            </p>
            <div className="divide-y divide-border/40">
              {pending.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{inv.role} · {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="warning" className="text-[10px]">Pending</Badge>
                  {isAdmin && (
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => void handleRevoke(inv.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="border-t border-border/40 px-5 py-3 text-xs text-muted-foreground">
          Invites are recorded and emailed when Resend is configured. Invitees join this company automatically after signing in with the invited email.
        </p>
      </div>
    </div>
  );
}
