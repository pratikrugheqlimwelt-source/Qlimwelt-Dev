"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpCorner } from "@/components/ui/tooltip";
import { useT } from "@/components/i18n/locale-provider";
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
  const t = useT();
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [invites, setInvites] = useState<TeamInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const isAdmin = membership?.role === "admin";

  const roleLabel = (r: string) => {
    const map: Record<string, string> = {
      member: t("teamPage.member"),
      manager: t("teamPage.manager"),
      admin: t("teamPage.admin"),
      viewer: t("teamPage.viewer"),
    };
    return map[r] ?? r;
  };

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
        toast({ title: t("teamPage.toastInviteEmailed", { email: trimmed }), variant: "success" });
      } else if (res.ok) {
        toast({
          title: t("teamPage.toastInviteRecorded"),
          description: t("teamPage.toastEmailUnavailable"),
        });
      }
    } catch {
      toast({
        title: t("teamPage.toastInviteRecorded"),
        description: t("teamPage.toastEmailFailed"),
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
      toast({ title: t("teamPage.toastInviteRevoked"), variant: "success" });
      await reload();
    } catch (err) {
      toast({
        title: t("teamPage.toastRevokeFailed"),
        description: err instanceof Error ? err.message : t("teamPage.toastTryAgain"),
        variant: "destructive",
      });
    }
  };

  const pending = invites.filter((i) => i.status === "pending");

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.team.title")}
        description={t("pages.team.description")}
      />

      <div className="dash-card relative overflow-hidden">
        <HelpCorner content={t("teamPage.helpTip")} />
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 pr-12">
          <p className="text-sm font-semibold">{company?.name ?? t("account.workspace")}</p>
          <Button
            disabled={!isAdmin}
            title={isAdmin ? t("teamPage.inviteColleague") : t("teamPage.onlyAdminsInvite")}
            onClick={() => setShowInvite((v) => !v)}
          >
            {t("teamPage.inviteTeamMember")}
          </Button>
        </div>

        {showInvite && isAdmin && (
          <div className="grid gap-3 border-b border-border/40 bg-muted/20 px-5 py-4 sm:grid-cols-[1fr_auto_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">{t("teamPage.email")}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t("teamPage.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">{t("teamPage.role")}</Label>
              <select
                id="invite-role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="member">{t("teamPage.member")}</option>
                <option value="manager">{t("teamPage.manager")}</option>
                <option value="admin">{t("teamPage.admin")}</option>
                <option value="viewer">{t("teamPage.viewer")}</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => void handleInvite()} disabled={saving || !email.includes("@")}>
                {saving ? t("teamPage.sending") : t("teamPage.sendInvite")}
              </Button>
              <Button variant="ghost" onClick={() => setShowInvite(false)}>{t("common.cancel")}</Button>
            </div>
          </div>
        )}

        {!isAdmin && (
          <p className="border-b border-border/40 bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
            {t("teamPage.onlyAdminsManage")}
          </p>
        )}

        <div className="divide-y divide-border/40">
          {loading ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t("teamPage.loadingTeam")}</p>
          ) : members.length === 0 ? (
            <div className="flex items-center gap-4 px-5 py-6">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.profile_image_url ?? undefined} />
                <AvatarFallback>{profile?.full_name?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{profile?.full_name ?? t("teamPage.you")}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <Badge variant="secondary" className="ml-auto capitalize">
                {roleLabel(membership?.role ?? "admin")}
              </Badge>
              <Badge variant="outline">{t("teamPage.active")}</Badge>
            </div>
          ) : (
            members.map((member) => {
              const p = member.profiles;
              const name = p?.full_name ?? p?.email ?? t("teamPage.member");
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
                    {roleLabel(member.role)}
                  </Badge>
                  <Badge variant="outline">{t("teamPage.active")}</Badge>
                </div>
              );
            })
          )}
        </div>

        {pending.length > 0 && (
          <div className="border-t border-border/40">
            <p className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("teamPage.pendingInvites", { count: pending.length })}
            </p>
            <div className="divide-y divide-border/40">
              {pending.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{roleLabel(inv.role)} · {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="warning" className="text-[10px]">{t("teamPage.pending")}</Badge>
                  {isAdmin && (
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => void handleRevoke(inv.id)}>
                      {t("teamPage.revoke")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="border-t border-border/40 px-5 py-3 text-xs text-muted-foreground">
          {t("teamPage.invitesFooter")}
        </p>
      </div>
    </div>
  );
}
