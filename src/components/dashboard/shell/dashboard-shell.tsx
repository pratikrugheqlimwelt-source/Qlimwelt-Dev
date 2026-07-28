"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Cloud, Database, Boxes, Brain, Target, Flag,
  FileText, ShieldCheck, Settings, ChevronLeft, ChevronRight, Menu, X,
  Bell, Search, Calendar, ChevronDown, Users,
} from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { cn } from "@/lib/utils";
import { CalculationDrawer } from "@/components/dashboard/shared/calculation-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { AccountMenu } from "@/components/dashboard/AccountMenu";

const NAV_GROUPS = [
  {
    label: "Analytics",
    items: [
      { href: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/emissions", label: "Emissions", icon: Cloud },
      { href: "/dashboard/data-quality", label: "Data Quality", icon: ShieldCheck },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/data-collection", label: "Data Collection", icon: Database },
      { href: "/dashboard/resources", label: "Resources", icon: Boxes },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/dashboard/climate-intelligence", label: "Climate Intelligence", icon: Brain },
      { href: "/dashboard/reduction-planner", label: "Reduction Planner", icon: Target },
      { href: "/dashboard/targets", label: "Targets", icon: Flag },
    ],
  },
  {
    label: "Reporting",
    items: [
      { href: "/dashboard/reports", label: "Reports", icon: FileText },
      { href: "/dashboard/team", label: "Team", icon: Users },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { company } = useDashboard();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = ALL_NAV.find((n) => n.href === pathname)?.label ?? "Dashboard";

  return (
    <div className="dash-root min-h-screen">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/60 bg-white transition-all duration-300",
          collapsed ? "w-[4.5rem]" : "w-64",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none"
        )}
      >
        <div className={cn("flex h-[4.25rem] items-center border-b border-border/60 px-4", collapsed && "justify-center px-2")}>
          {!collapsed ? <Logo size="sm" /> : <Logo size="sm" variant="icon" />}
          <button type="button" onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden" aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:flex", !collapsed && "ml-auto")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="border-b border-border/40 px-4 py-3">
            <button type="button" className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/15 text-xs font-bold text-brand-dark">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{company.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">FY 2024 · Demo</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </div>
        )}

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-gradient-to-r from-[#82D153]/15 to-emerald-500/10 text-[#3d8b2e] shadow-sm ring-1 ring-[#82D153]/20"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        collapsed && "justify-center px-2"
                      )}
                      title={collapsed ? label : undefined}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand-dark" />}
                      <Icon className={cn("h-4 w-4 shrink-0", active && "text-brand-dark")} />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border/40 p-3">
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
              ← Back to website
            </Link>
          ) : (
            <Link href="/" className="flex justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted/50" title="Back to website">←</Link>
          )}
        </div>
      </aside>

      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-300", collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 border-b border-border/60 bg-white/90 backdrop-blur-md">
          <div className="flex h-[4.25rem] items-center gap-3 px-4 lg:px-6">
            <button type="button" className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Carbon Intelligence</p>
              <h1 className="truncate text-lg font-semibold tracking-tight">{pageTitle}</h1>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search records…" className="h-9 w-52 border-border/60 bg-muted/30 pl-9 text-xs shadow-none" />
              </div>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border/60 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                FY 2024
              </Button>
            </div>

            <div className="flex items-center gap-1">
              {company.isDemo && (
                <Badge variant="secondary" className="hidden font-mono text-[10px] uppercase sm:inline-flex">
                  Demo data
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />
              </Button>
              <AccountMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 lg:px-6 lg:py-5">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>

      <CalculationDrawer />
    </div>
  );
}
