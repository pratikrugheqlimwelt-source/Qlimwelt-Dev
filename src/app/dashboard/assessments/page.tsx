"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export default function AssessmentsPage() {
  const { assessments, loading } = useDashboard();
  const router = useRouter();
  const t = useT();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.assessments.title")}
        description={t("pages.assessments.description")}
        tip={t("pages.assessments.tip")}
        actions={
          <Button onClick={() => router.push("/dashboard/assessments/new")}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("pages.assessments.new")}
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("pages.assessments.loading")}</p>
      ) : assessments.length === 0 ? (
        <div className="dash-card flex flex-col items-start gap-4 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-dark ring-1 ring-brand/20">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight">{t("pages.assessments.emptyTitle")}</h3>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {t("pages.assessments.emptyBody")}
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard/assessments/new")}>
            {t("pages.assessments.create")}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {assessments.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/assessments/${a.id}`}
              className="dash-card flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/20"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold tracking-tight">{a.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(`types.${a.type}`)} · {t("pages.assessments.updated")}{" "}
                  {new Date(a.updatedAt).toLocaleDateString()}
                  {a.enabledModules.length > 0
                    ? ` · ${a.enabledModules.length} ${t("pages.assessments.modules")}`
                    : ""}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  a.status === "calculated" && "bg-emerald-50 text-emerald-700",
                  a.status === "in_progress" && "bg-amber-50 text-amber-700",
                  a.status === "draft" && "bg-slate-100 text-slate-600",
                  a.status === "ready_for_review" && "bg-sky-50 text-sky-700",
                  a.status === "locked" && "bg-muted text-muted-foreground"
                )}
              >
                {t(`status.${a.status}`)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
