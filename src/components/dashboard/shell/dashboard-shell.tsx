"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Gauge,
  Factory,
  BadgeCheck,
  ListChecks,
  DatabaseZap,
  Plug,
  Layers2,
  BrainCircuit,
  TrendingDown,
  Milestone,
  FileChartColumn,
  Scale,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  Search,
  Calendar,
  ChevronDown,
  UsersRound,
  Settings,
  Package,
} from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { cn } from "@/lib/utils";
import { CalculationDrawer } from "@/components/dashboard/shared/calculation-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { AccountMenu } from "@/components/dashboard/AccountMenu";
import { TryQaiMobileButton } from "@/components/qai-mobile/try-qai-mobile-button";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { useT } from "@/components/i18n/locale-provider";
import { QlimAiFloatingChat } from "@/components/qlim-ai/qlim-ai-floating-chat";
import { QlimAiLiveTicker } from "@/components/qlim-ai/qlim-ai-live-ticker";
import { PERIODS } from "@/data/carbon";
import type { LucideIcon } from "lucide-react";

const NAV_GROUP_DEFS = [
  {
    labelKey: "dashNav.analytics",
    items: [
      { href: "/dashboard/overview", labelKey: "dashNav.overview", icon: Gauge },
      { href: "/dashboard/emissions", labelKey: "dashNav.emissions", icon: Factory },
      { href: "/dashboard/data-quality", labelKey: "dashNav.dataQuality", icon: BadgeCheck },
    ],
  },
  {
    labelKey: "dashNav.operations",
    items: [
      { href: "/dashboard/assessments", labelKey: "dashNav.assessments", icon: ListChecks },
      { href: "/dashboard/products", labelKey: "dashNav.products", icon: Package },
      { href: "/dashboard/data-collection", labelKey: "dashNav.dataCollection", icon: DatabaseZap },
      { href: "/dashboard/connected-systems", labelKey: "dashNav.connectedSystems", icon: Plug },
      { href: "/dashboard/resources", labelKey: "dashNav.resources", icon: Layers2 },
    ],
  },
  {
    labelKey: "dashNav.planning",
    items: [
      { href: "/dashboard/climate-intelligence", labelKey: "dashNav.climateIntelligence", icon: BrainCircuit },
      { href: "/dashboard/reduction-planner", labelKey: "dashNav.reductionPlanner", icon: TrendingDown },
      { href: "/dashboard/targets", labelKey: "dashNav.targets", icon: Milestone },
    ],
  },
  {
    labelKey: "dashNav.reporting",
    items: [
      { href: "/dashboard/reports", labelKey: "dashNav.reports", icon: FileChartColumn },
      { href: "/dashboard/compliance", labelKey: "dashNav.compliance", icon: Scale },
    ],
  },
  {
    labelKey: "dashNav.administration",
    items: [
      { href: "/dashboard/team", labelKey: "dashNav.team", icon: UsersRound },
      { href: "/dashboard/settings", labelKey: "dashNav.settings", icon: Settings2 },
    ],
  },
];

function NavIcon({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-150",
        active
          ? "bg-[#82D153] text-white shadow-sm shadow-[#82D153]/30"
          : "bg-slate-100 text-muted-foreground group-hover:bg-[#82D153]/15 group-hover:text-[#3d8b2e]"
      )}
      aria-hidden
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}

const PERIOD_KEYS: Record<string, string> = {
  all: "shell.fy2024",
  "2024-01": "shell.jan",
  "2024-02": "shell.feb",
  "2024-03": "shell.mar",
  "2024-04": "shell.apr",
  "2024-05": "shell.may",
  "2024-06": "shell.jun",
  "2024-07": "shell.jul",
  "2024-08": "shell.aug",
  "2024-09": "shell.sep",
  "2024-10": "shell.oct",
  "2024-11": "shell.nov",
  "2024-12": "shell.dec",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const {
    company,
    filters,
    setFilters,
    notifications,
    unreadCount,
    markAllNotificationsRead,
    activities,
    openCalculation,
    dataMode,
  } = useDashboard();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [seedPreview, setSeedPreview] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const fromQuery = new URLSearchParams(window.location.search).get("seed") === "1";
    const fromStorage = (() => {
      try {
        return sessionStorage.getItem("qlimwelt_dev_seed") === "1";
      } catch {
        return false;
      }
    })();
    const fromCookie = document.cookie.split(";").some((c) => c.trim().startsWith("qlimwelt_dev_seed=1"));
    setSeedPreview(fromQuery || fromStorage || fromCookie);
  }, [pathname]);

  const withSeed = useCallback(
    (href: string) => (seedPreview ? `${href}${href.includes("?") ? "&" : "?"}seed=1` : href),
    [seedPreview]
  );

  const navGroups = useMemo(
    () =>
      NAV_GROUP_DEFS.map((g) => ({
        label: t(g.labelKey),
        items: g.items.map((item) => ({
          href: item.href,
          label: t(item.labelKey),
          icon: item.icon,
        })),
      })),
    [t]
  );

  const allNav = useMemo(() => navGroups.flatMap((g) => g.items), [navGroups]);

  const periodLabel = useCallback(
    (period: string) => {
      const key = PERIOD_KEYS[period];
      return key ? t(key) : period;
    },
    [t]
  );

  const pageTitle = allNav.find((n) => n.href === pathname)?.label ?? t("shell.dashboard");

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { nav: [] as typeof allNav, activities: [] as typeof activities };
    const nav = allNav.filter((n) => n.label.toLowerCase().includes(q));
    const acts = activities
      .filter((a) =>
        `${a.source} ${a.category} ${a.period} ${a.scope}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
    return { nav, activities: acts };
  }, [search, activities, allNav]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(t)) setSearchOpen(false);
      if (periodRef.current && !periodRef.current.contains(t)) setPeriodOpen(false);
      if (bellRef.current && !bellRef.current.contains(t)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="dash-root min-h-screen">
      {mobileOpen && (
        <button
          type="button"
          aria-label={t("common.closeMenu")}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-white transition-all duration-300",
          collapsed ? "w-[4.5rem]" : "w-64",
          mobileOpen ? "translate-x-0 shadow-lg" : "-translate-x-full lg:translate-x-0 lg:shadow-none"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-border px-4", collapsed && "justify-center px-2")}>
          {!collapsed ? <Logo size="sm" /> : <Logo size="sm" variant="icon" />}
          <button type="button" onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden" aria-label={t("shell.closeNav")}>
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("hidden rounded-xl p-1.5 text-muted-foreground hover:bg-secondary lg:flex", !collapsed && "ml-auto")}
            aria-label={collapsed ? t("shell.expandSidebar") : t("shell.collapseSidebar")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="border-b border-border px-4 py-3">
            <Link
              href={withSeed("/dashboard/settings")}
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl border border-border bg-[hsl(var(--siemens-surface))] px-3 py-2 text-left text-sm transition-colors hover:border-primary/30"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#82D153] text-[10px] font-bold text-white">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{company.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {periodLabel(filters.period)} · {t("shell.live")}
                </p>
              </div>
              <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Link>
          </div>
        )}

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="dash-label mb-1.5 px-3 text-brand">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={withSeed(href)}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "dash-nav-item group",
                        active ? "dash-nav-item-active" : "dash-nav-item-idle",
                        collapsed && "justify-center px-2"
                      )}
                      title={collapsed ? label : undefined}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[#82D153]" />}
                      <NavIcon icon={Icon} active={active} />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              ← {t("marketing.backToWebsite")}
            </Link>
          ) : (
            <Link href="/" className="flex justify-center rounded-xl p-2 text-muted-foreground hover:bg-secondary" title={t("marketing.backToWebsite")}>←</Link>
          )}
        </div>
      </aside>

      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-300", collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 border-b border-border bg-white/98 backdrop-blur-[8px]">
          <div className="flex h-16 items-center gap-2 px-4 lg:gap-3 lg:px-6">
            <button type="button" className="rounded-xl p-2 hover:bg-secondary lg:hidden" onClick={() => setMobileOpen(true)} aria-label={t("shell.openNav")}>
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 shrink-0 max-w-[9.5rem] sm:max-w-[11rem] lg:max-w-[12.5rem]">
              <p className="siemens-eyebrow text-[10px]">{t("overview.carbonIntelligence")}</p>
              <h1 className="truncate text-base font-semibold tracking-tight lg:text-lg">{pageTitle}</h1>
            </div>

            <QlimAiLiveTicker />

            <div className="flex shrink-0 items-center gap-2">
              <div className="relative hidden md:block" ref={searchRef}>
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  className="h-8 w-28 rounded-xl border-border bg-secondary/50 pl-8 text-xs shadow-none lg:w-36"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                />
                {searchOpen && search.trim() && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                    {searchResults.nav.length === 0 && searchResults.activities.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-muted-foreground">{t("shell.noMatches")}</p>
                    ) : (
                      <>
                        {searchResults.nav.length > 0 && (
                          <div className="border-b border-border/50 p-2">
                            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("shell.pages")}</p>
                            {searchResults.nav.map((n) => (
                              <button
                                key={n.href}
                                type="button"
                                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-secondary"
                                onClick={() => {
                                  router.push(withSeed(n.href));
                                  setSearch("");
                                  setSearchOpen(false);
                                }}
                              >
                                <n.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                {n.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {searchResults.activities.length > 0 && (
                          <div className="p-2">
                            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("shell.activities")}</p>
                            {searchResults.activities.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                className="flex w-full flex-col rounded-xl px-2 py-2 text-left hover:bg-secondary"
                                onClick={() => {
                                  openCalculation(a);
                                  setSearch("");
                                  setSearchOpen(false);
                                  if (pathname !== "/dashboard/emissions") router.push(withSeed("/dashboard/emissions"));
                                }}
                              >
                                <span className="text-sm font-medium">{a.source}</span>
                                <span className="text-[11px] text-muted-foreground">{a.category} · {a.period}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={periodRef}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 border-border/60 px-2 text-xs sm:px-3"
                  onClick={() => setPeriodOpen((v) => !v)}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="max-w-[5.5rem] truncate sm:max-w-none">
                    {periodLabel(filters.period)}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
                {periodOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 max-h-64 w-40 overflow-auto rounded-xl border border-border bg-background p-1 shadow-lg">
                    {PERIODS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={cn(
                          "flex w-full rounded-xl px-3 py-2 text-left text-xs hover:bg-secondary",
                          filters.period === p && "bg-secondary font-semibold text-primary"
                        )}
                        onClick={() => {
                          setFilters({ period: p });
                          setPeriodOpen(false);
                        }}
                      >
                        {periodLabel(p)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <TryQaiMobileButton variant="header" className="mr-1 hidden sm:block" />
              <LanguageToggle className="mr-1" />
              <div className="relative" ref={bellRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9"
                  onClick={() => setBellOpen((v) => !v)}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
                {bellOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                    <div className="flex items-center justify-between border-b border-border px-3 py-2">
                      <p className="text-xs font-semibold">{t("common.notifications")}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px]"
                        onClick={() => void markAllNotificationsRead()}
                      >
                        {t("common.markAllRead")}
                      </Button>
                    </div>
                    <div className="max-h-72 overflow-auto">
                      {notifications.length === 0 ? (
                        <p className="px-3 py-6 text-center text-xs text-muted-foreground">{t("common.noNotifications")}</p>
                      ) : (
                        notifications.slice(0, 20).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            className={cn(
                              "flex w-full flex-col gap-0.5 border-b border-border/40 px-3 py-2.5 text-left hover:bg-secondary/60",
                              !n.read && "bg-primary/5"
                            )}
                            onClick={() => {
                              setBellOpen(false);
                              if (n.href) router.push(withSeed(n.href));
                            }}
                          >
                            <span className="text-sm font-medium">{n.title}</span>
                            <span className="text-[11px] text-muted-foreground">{n.message}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <AccountMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 lg:px-6 lg:py-5">
          {dataMode === "local" && (
            <div className="mx-auto mb-4 max-w-[1600px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
              {t("common.localDataBanner")}
            </div>
          )}
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>

      <CalculationDrawer />
      <QlimAiFloatingChat />
    </div>
  );
}
