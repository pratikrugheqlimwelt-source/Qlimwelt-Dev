"use client";

import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Eye, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const REPORTS = [
  { id: "ghg", name: "Corporate GHG Inventory", pages: 42, status: "Ready" as const, updated: "2 days ago" },
  { id: "scope", name: "Scope 1, 2 & 3 Summary", pages: 18, status: "Ready" as const, updated: "2 days ago" },
  { id: "facility", name: "Facility Emission Report", pages: 24, status: "Ready" as const, updated: "1 week ago" },
  { id: "fleet", name: "Vehicle Fleet Report", pages: 16, status: "Ready" as const, updated: "1 week ago" },
  { id: "travel", name: "Business Travel Report", pages: 12, status: "Draft" as const, updated: "3 days ago" },
  { id: "supplier", name: "Supplier Emission Report", pages: 28, status: "Ready" as const, updated: "5 days ago" },
  { id: "dq", name: "Data Quality Report", pages: 14, status: "Ready" as const, updated: "2 days ago" },
  { id: "target", name: "Target Progress Report", pages: 10, status: "Ready" as const, updated: "2 days ago" },
  { id: "reduction", name: "Reduction Opportunity Report", pages: 20, status: "Ready" as const, updated: "4 days ago" },
  { id: "carbon-cost", name: "Carbon Cost Exposure Report", pages: 8, status: "Ready" as const, updated: "2 days ago" },
];

export default function ReportsPage() {
  const download = (name: string, format: string) => {
    toast({ title: `${format} export started`, description: `${name} — demonstration export placeholder.` });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & exports"
        description="Audit-ready reports for CSRD, GHG Protocol, and internal disclosure. All data labelled as demonstration."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <div key={r.id} className="dash-card group p-5 transition-all hover:shadow-[0_8px_30px_rgba(15,23,42,0.07)]">
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                r.status === "Ready" ? "bg-brand/10 text-brand-dark" : "bg-amber-50 text-amber-600"
              )}>
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold tracking-tight">{r.name}</h3>
                  <Badge variant={r.status === "Ready" ? "success" : "warning"} className="text-[10px]">{r.status}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{r.pages} pages</span>
                  <span>·</span>
                  <span>FY 2024</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.updated}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => download(r.name, "PDF")}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />PDF
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => download(r.name, "Excel")}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />Excel
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    <Eye className="mr-1.5 h-3.5 w-3.5" />Preview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
