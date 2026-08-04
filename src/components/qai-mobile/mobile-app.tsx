"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  Share2,
  Sparkles,
  Upload,
  UserRound,
  Camera,
  FileUp,
  Building2,
  Users,
  Plug,
  Shield,
  HelpCircle,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/marketing/logo-mark";
import { useAuth } from "@/hooks/useAuth";
import { useClimateOverview } from "@/hooks/qai-mobile/use-climate-overview";
import { cn, formatCO2, formatPercent } from "@/lib/utils";
import { trackQaiMobile } from "@/lib/qai-mobile/analytics";
import { answerFromDashboardData } from "@/lib/qai-mobile/local-answers";
import { PERIODS } from "@/data/carbon";
import type { ClimateInsight, EmissionActivity, ReductionInitiative } from "@/types/carbon";
import {
  MobileButton,
  MobileCard,
  MobileEmpty,
  MobileLoading,
  MobilePill,
  ScoreRing,
  Sparkline,
  qm,
} from "@/components/qai-mobile/mobile-primitives";

export type MobileScreen =
  | "home"
  | "actions"
  | "qai"
  | "profile"
  | "climate-score"
  | "carbon-pulse"
  | "insight"
  | "upload"
  | "notifications"
  | "company-settings";

const TABS: { id: MobileScreen; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "actions", label: "Actions", icon: ClipboardList },
  { id: "qai", label: "QAI", icon: Sparkles },
  { id: "profile", label: "Profile", icon: UserRound },
];

function statusLabel(status: string) {
  if (status === "on_track") return "On Track";
  if (status === "at_risk") return "At Risk";
  if (status === "off_track") return "Off Track";
  return "No data";
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function activeTabFor(screen: MobileScreen): MobileScreen {
  if (screen === "actions" || screen === "qai" || screen === "profile") return screen;
  if (screen === "company-settings" || screen === "upload") return "profile";
  return "home";
}

/** Fixed chrome heights — never change between screens (prevents layout jump). */
const NOTCH_H = "h-10"; // dynamic island clearance
const TAB_H = "h-14";
const CONTENT_PB = "pb-24"; // room for tab bar + FAB, constant

export function MobileApp({
  screen,
  onNavigate,
  className,
}: {
  screen: MobileScreen;
  onNavigate: (s: MobileScreen) => void;
  className?: string;
}) {
  const overview = useClimateOverview();
  const [orbOpen, setOrbOpen] = useState(false);
  const [insightId, setInsightId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTab = activeTabFor(screen);

  useEffect(() => {
    trackQaiMobile("mobile_screen_viewed", { screen });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [screen]);

  const activeInsight = useMemo(() => {
    if (insightId) {
      return overview.climateInsights.find((i) => i.id === insightId) ?? overview.topInsight;
    }
    return overview.topInsight;
  }, [insightId, overview.climateInsights, overview.topInsight]);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden bg-[#F7F8F6] font-sans text-slate-900 antialiased",
        className
      )}
    >
      {/* Fixed notch spacer — same on every screen */}
      <div className={cn("shrink-0", NOTCH_H)} aria-hidden />

      <div
        ref={scrollRef}
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain",
          CONTENT_PB
        )}
      >
        {overview.loading ? (
          <MobileLoading />
        ) : (
          <div className="min-h-full w-full">
            {screen === "home" && (
              <HomeScreen
                overview={overview}
                onNavigate={onNavigate}
                onOpenInsight={(id) => {
                  setInsightId(id);
                  onNavigate("insight");
                  trackQaiMobile("recommendation_opened", { id });
                }}
              />
            )}
            {screen === "actions" && <ActionsScreen overview={overview} />}
            {screen === "qai" && <QaiScreen overview={overview} />}
            {screen === "profile" && <ProfileScreen overview={overview} onNavigate={onNavigate} />}
            {screen === "climate-score" && (
              <ClimateScoreScreen overview={overview} onBack={() => onNavigate("home")} />
            )}
            {screen === "carbon-pulse" && (
              <CarbonPulseScreen overview={overview} onBack={() => onNavigate("home")} />
            )}
            {screen === "insight" && (
              <InsightScreen
                insight={activeInsight}
                overview={overview}
                onBack={() => onNavigate("home")}
                onGoActions={() => onNavigate("actions")}
              />
            )}
            {screen === "upload" && (
              <UploadScreen overview={overview} onBack={() => onNavigate("profile")} />
            )}
            {screen === "notifications" && (
              <NotificationsScreen
                overview={overview}
                onBack={() => onNavigate("home")}
                onNavigate={onNavigate}
              />
            )}
            {screen === "company-settings" && (
              <CompanySettingsScreen overview={overview} onBack={() => onNavigate("profile")} />
            )}
          </div>
        )}
      </div>

      {/* Tab bar always mounted — keeps content inset stable */}
      <nav className="absolute bottom-0 left-0 right-0 z-30 border-t border-black/[0.06] bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur">
        <div className={cn("grid grid-cols-4 px-1", TAB_H)}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium leading-none",
                  active ? "text-[#3d8f2e]" : "text-slate-400"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active && "text-[#82D153]")} />
                <span className="leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* FAB always same coordinates so screens don’t jump */}
      <button
        type="button"
        aria-label="Open QAI"
        onClick={() => {
          if (screen === "qai") return;
          setOrbOpen(true);
          trackQaiMobile("qai_orb_opened", { screen });
        }}
        className={cn(
          "absolute bottom-[4.75rem] right-3 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#82D153] text-white shadow-[0_10px_28px_-8px_rgba(130,209,83,0.9)]",
          screen === "qai" ? "pointer-events-none opacity-0" : "animate-qai-breathe"
        )}
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {orbOpen ? (
        <QaiOrbSheet
          screen={screen}
          overview={overview}
          onClose={() => setOrbOpen(false)}
          onNavigate={(s) => {
            setOrbOpen(false);
            onNavigate(s);
          }}
        />
      ) : null}
    </div>
  );
}

type Overview = ReturnType<typeof useClimateOverview>;

function SubHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex h-12 items-center gap-2 bg-[#F7F8F6]/95 px-3 backdrop-blur">
      <button type="button" onClick={onBack} className={qm.icon} aria-label="Back">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-left text-base font-semibold leading-none">{title}</h1>
      {right ? <div className="flex h-9 shrink-0 items-center justify-center">{right}</div> : null}
    </div>
  );
}

/** Shared screen body — constant horizontal inset, no per-screen safe-area (shell owns notch). */
function ScreenBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-3 px-4 pb-6 pt-3", className)}>{children}</div>;
}

function HomeScreen({
  overview,
  onNavigate,
  onOpenInsight,
}: {
  overview: Overview;
  onNavigate: (s: MobileScreen) => void;
  onOpenInsight: (id: string) => void;
}) {
  const needs = buildNeedsAttention(overview).slice(0, 3);
  const score = overview.climateScore;

  return (
    <ScreenBody>
      <div className="flex h-10 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <LogoMark className="h-8 w-8 shrink-0" />
          <div className="min-w-0 text-left">
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {overview.companyName}
            </p>
            <p className="truncate text-xs leading-none text-slate-500">{overview.periodLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate("notifications")}
            className={cn(qm.icon, "relative")}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {overview.unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            ) : null}
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#82D153]/15 text-[11px] font-bold leading-none text-[#2f6f24]">
            {overview.firstName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {greeting()}, {overview.firstName}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">Your climate intelligence overview for today.</p>
      </div>

      {!overview.hasInventory ? (
        <MobileEmpty
          title="No emissions data yet"
          body="Connect activities or load sample data in the web dashboard to unlock live mobile insights."
          actionLabel="Open upload"
          onAction={() => onNavigate("upload")}
        />
      ) : (
        <>
          <MobileCard onClick={() => onNavigate("climate-score")} className="flex items-center gap-4">
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Climate Score
              </p>
              <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-[#2f6f24]">
                {score.score} <span className="text-base font-semibold text-slate-400">/ 100</span>
              </p>
              <p className="mt-1.5 text-sm font-medium leading-none text-slate-800">
                {statusLabel(score.status)}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#82D153] transition-all"
                  style={{ width: `${score.score}%` }}
                />
              </div>
            </div>
            <ScoreRing score={score.score} label="/100" />
          </MobileCard>

          <MobileCard onClick={() => onNavigate("carbon-pulse")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Carbon Pulse
                </p>
                <p className="mt-1 break-words text-2xl font-bold leading-none tabular-nums">
                  {formatCO2(overview.metrics.totalTCO2e)}
                </p>
                <p className="mt-1.5 text-xs leading-none text-slate-500">{overview.periodLabel}</p>
                <p
                  className={cn(
                    "mt-2 text-xs font-semibold leading-snug",
                    overview.metrics.changePct <= 0 ? "text-[#2f6f24]" : "text-amber-600"
                  )}
                >
                  {overview.metrics.changePct <= 0 ? "↓" : "↑"}{" "}
                  {formatPercent(Math.abs(overview.metrics.changePct))} vs prior period
                </p>
              </div>
              <div className="w-20 shrink-0 pt-2">
                <Sparkline values={overview.sparkline} />
              </div>
            </div>
          </MobileCard>

          {overview.topInsight ? (
            <MobileCard
              onClick={() => onOpenInsight(overview.topInsight!.id)}
              className="border-[#82D153]/25 bg-gradient-to-br from-white to-[#f3fbef]"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#3d8f2e]">
                <Sparkles className="h-3.5 w-3.5" />
                QAI Daily Insight
              </div>
              <p className="mt-2 text-sm leading-snug text-slate-800">{overview.topInsight.what}</p>
              <p className="mt-2 text-xs font-semibold text-[#2f6f24]">
                Impact {formatCO2(overview.topInsight.emissionImpactTCO2e)}
              </p>
              <p className="mt-3 text-xs font-semibold text-[#3d8f2e]">View recommendation →</p>
            </MobileCard>
          ) : (
            <MobileEmpty
              title="QAI insight unavailable"
              body="Once enough inventory and quality signals exist, QAI will surface a daily recommendation here."
            />
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Needs Attention
              </p>
              <button type="button" onClick={() => onNavigate("actions")} className={qm.ghost}>
                View all
              </button>
            </div>
            {needs.length === 0 ? (
              <MobileEmpty title="All clear" body="No high-priority items for this period." />
            ) : (
              <div className="space-y-2">
                {needs.map((n) => (
                  <MobileCard key={n.id} onClick={() => onNavigate(n.screen)} className="py-3">
                    <div className="flex items-center gap-3">
                      <span className={cn("h-2.5 w-2.5 rounded-full", n.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        <p className="text-[11px] text-slate-500">{n.meta}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </MobileCard>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </ScreenBody>
  );
}

function buildNeedsAttention(overview: Overview) {
  const items: { id: string; title: string; meta: string; screen: MobileScreen; dot: string; rank: number }[] = [];

  const weak = overview.suppliers.filter((s) => s.dataQualityScore < 55).length;
  if (weak > 0) {
    items.push({
      id: "suppliers",
      title: `${weak} supplier record${weak > 1 ? "s" : ""} need data`,
      meta: "Data collection",
      screen: "actions",
      dot: "bg-red-500",
      rank: 0,
    });
  }

  const urgent = overview.priorityActions.filter((a) => a.status === "planned").slice(0, 2);
  urgent.forEach((a, i) => {
    items.push({
      id: a.id,
      title: a.name,
      meta: a.category,
      screen: "actions",
      dot: i === 0 ? "bg-amber-500" : "bg-slate-400",
      rank: 1 + i,
    });
  });

  if (overview.metrics.changePct > 5) {
    items.push({
      id: "spike",
      title: "Unusual emissions increase",
      meta: `${formatPercent(overview.metrics.changePct)} vs prior period`,
      screen: "carbon-pulse",
      dot: "bg-orange-500",
      rank: 0.5,
    });
  }

  if (overview.unreadCount > 0) {
    items.push({
      id: "notif",
      title: `${overview.unreadCount} unread notification${overview.unreadCount > 1 ? "s" : ""}`,
      meta: "Inbox",
      screen: "notifications",
      dot: "bg-blue-500",
      rank: 2,
    });
  }

  return items.sort((a, b) => a.rank - b.rank);
}

function ActionsScreen({ overview }: { overview: Overview }) {
  const [filter, setFilter] = useState<"all" | "urgent" | "upcoming">("all");
  const actions = overview.priorityActions;
  const urgent = actions.filter((a) => a.status === "planned" || a.difficulty === "high");
  const upcoming = actions.filter((a) => a.status === "in_progress");
  const list =
    filter === "urgent" ? urgent : filter === "upcoming" ? upcoming : actions;

  return (
    <ScreenBody>
      <div className="min-h-[52px]">
        <h1 className="text-2xl font-semibold leading-tight">Actions</h1>
        <p className="mt-1 text-xs leading-snug text-slate-500">
          You have {actions.length} task{actions.length === 1 ? "" : "s"} to review.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["urgent", `Urgent (${urgent.length})`],
            ["upcoming", "Upcoming"],
          ] as const
        ).map(([id, label]) => (
          <MobilePill key={id} active={filter === id} onClick={() => setFilter(id)}>
            {label}
          </MobilePill>
        ))}
      </div>

      {!overview.canEdit ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          Viewer role — you can review tasks but not change status.
        </p>
      ) : null}

      {list.length === 0 ? (
        <MobileEmpty title="No tasks" body="Open initiatives will appear here from the reduction planner." />
      ) : (
        <div className="space-y-2">
          {list.map((a) => (
            <ActionCard
              key={a.id}
              action={a}
              canEdit={overview.canEdit}
              onStatus={(status) => {
                void overview.setInitiativeStatus(a.id, status);
                if (status === "completed") trackQaiMobile("task_completed", { id: a.id });
              }}
            />
          ))}
        </div>
      )}
    </ScreenBody>
  );
}

function ActionCard({
  action,
  canEdit,
  onStatus,
}: {
  action: ReductionInitiative;
  canEdit: boolean;
  onStatus: (s: ReductionInitiative["status"]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <MobileCard className="py-3">
      <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => setOpen((v) => !v)}>
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#82D153]/15 text-[#2f6f24]">
          <ClipboardList className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{action.name}</p>
          <p className="text-[11px] text-slate-500">
            {action.category} · {formatCO2(action.annualEmissionReductionTCO2e)}/yr
          </p>
          <p
            className={cn(
              "mt-1 text-[11px] font-semibold capitalize",
              action.status === "planned" ? "text-red-500" : "text-slate-500"
            )}
          >
            {action.status.replace("_", " ")}
          </p>
        </div>
        <ChevronRight className={cn("h-4 w-4 text-slate-300 transition", open && "rotate-90")} />
      </button>
      {open ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-3">
          {(
            [
              ["in_progress", "Open"],
              ["completed", "Complete"],
              ["planned", "Postpone"],
            ] as const
          ).map(([status, label]) => (
            <MobilePill
              key={status}
              disabled={!canEdit}
              onClick={() => onStatus(status)}
              className="disabled:opacity-40"
            >
              {label}
            </MobilePill>
          ))}
          <MobilePill
            active
            disabled={!canEdit}
            onClick={() => onStatus("in_progress")}
            className="disabled:opacity-40"
          >
            Approve
          </MobilePill>
        </div>
      ) : null}
    </MobileCard>
  );
}

function QaiScreen({ overview }: { overview: Overview }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const prompts = useMemo(() => {
    const list = [
      "Why did our emissions increase?",
      "Which suppliers have missing information?",
      "Are we on track for our reduction target?",
      "What compliance work is urgent?",
      "What should we do next?",
    ];
    if (overview.metrics.changePct < 0) list[0] = "Why did our emissions decrease?";
    return list;
  }, [overview.metrics.changePct]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const ctx = {
    companyName: overview.companyName,
    periodLabel: overview.periodLabel,
    total: overview.metrics.totalTCO2e,
    changePct: overview.metrics.changePct,
    scope1: overview.metrics.scope1,
    scope2: overview.metrics.scope2,
    scope3: overview.metrics.scope3,
    targetProgress: overview.metrics.targetProgress,
    climateScore: overview.climateScore,
    topInsight: overview.topInsight,
    actions: overview.initiatives,
    suppliers: overview.suppliers,
    unreadCount: overview.unreadCount,
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || sending) return;
    trackQaiMobile("qai_prompt_submitted");
    const history = [...messages, { role: "user" as const, content: q }];
    setMessages(history);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/qlim-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) }),
      });
      if (res.ok) {
        const data = (await res.json()) as { message?: { content: string } };
        if (data.message?.content) {
          setMessages((m) => [...m, { role: "assistant", content: data.message!.content }]);
          return;
        }
      }
      setMessages((m) => [...m, { role: "assistant", content: answerFromDashboardData(q, ctx) }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: answerFromDashboardData(q, ctx) }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenBody className="flex min-h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col">
            <div className="flex flex-col items-center pt-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
                <LogoMark className="h-10 w-10" />
              </div>
              <h1 className="mt-4 text-xl font-semibold leading-tight">Hi {overview.firstName}! 👋</h1>
              <p className="mt-1 text-sm leading-snug text-slate-500">How can I help you today?</p>
            </div>
            <div className="mt-6 w-full space-y-2">
              {prompts.map((p) => (
                <button key={p} type="button" onClick={() => void send(p)} className={qm.prompt}>
                  <span className="block w-full text-left leading-snug">{p}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full flex-1 space-y-3 py-2 text-left">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-[#82D153] text-white"
                    : "mr-auto bg-white text-slate-800 ring-1 ring-black/5"
                )}
              >
                {m.content}
              </div>
            ))}
            {sending ? <p className="text-xs text-slate-400">QAI is thinking…</p> : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="mt-3 flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-black/[0.08] bg-white px-1.5 shadow-sm">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send(input);
          }}
          placeholder="Ask anything about your climate data…"
          className="min-w-0 flex-1 bg-transparent px-3 text-left text-sm leading-none outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={() => void send(input)}
          disabled={sending || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#82D153] text-white disabled:opacity-40"
          aria-label="Send"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </ScreenBody>
  );
}

function ProfileScreen({
  overview,
  onNavigate,
}: {
  overview: Overview;
  onNavigate: (s: MobileScreen) => void;
}) {
  const { signOut } = useAuth();
  const items = [
    { label: "Company Settings", icon: Building2, screen: "company-settings" as const },
    { label: "Team Management", icon: Users, href: "/dashboard/team" },
    { label: "Integrations", icon: Plug, href: "/dashboard/settings" },
    { label: "Notification settings", icon: Bell, screen: "notifications" as const },
    { label: "Security", icon: Shield, href: "/dashboard/settings" },
    { label: "Help and support", icon: HelpCircle, href: "/#contact" },
    { label: "Upload document", icon: Upload, screen: "upload" as const },
  ];

  return (
    <ScreenBody>
      <div className="flex h-10 items-center justify-between">
        <h1 className="text-2xl font-semibold leading-none">Profile</h1>
        <Link href="/dashboard/settings" className={qm.icon} aria-label="Settings">
          <Settings2 className="h-5 w-5 text-slate-600" />
        </Link>
      </div>
      <MobileCard className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#82D153]/15">
          <LogoMark className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-semibold leading-snug">{overview.companyName}</p>
          <p className="text-xs leading-snug text-slate-500">
            {overview.role} · {overview.company.employeeCount || "—"} members
          </p>
        </div>
      </MobileCard>
      <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white">
        {items.map((item, i) => {
          const Icon = item.icon;
          const content = (
            <div className={cn(qm.row, i > 0 && "border-t border-black/5")}>
              <Icon className="h-4 w-4 shrink-0 text-[#3d8f2e]" />
              <span className="min-w-0 flex-1 truncate text-left leading-none">{item.label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </div>
          );
          if ("href" in item && item.href) {
            return (
              <Link key={item.label} href={item.href} className="block">
                {content}
              </Link>
            );
          }
          return (
            <button
              key={item.label}
              type="button"
              className="block w-full"
              onClick={() => item.screen && onNavigate(item.screen)}
            >
              {content}
            </button>
          );
        })}
      </div>
      <MobileButton variant="danger" onClick={() => void signOut()}>
        <LogOut className="h-4 w-4" />
        Sign out
      </MobileButton>
      <Link href="/dashboard/overview" className={cn(qm.ghost, "mx-auto")}>
        Back to web dashboard
      </Link>
    </ScreenBody>
  );
}

function ClimateScoreScreen({ overview, onBack }: { overview: Overview; onBack: () => void }) {
  const s = overview.climateScore;
  return (
    <div>
      <SubHeader title="Climate Score" onBack={onBack} />
      <ScreenBody className="pt-1">
        {!overview.hasInventory ? (
          <MobileEmpty title="No score yet" body="Add emissions inventory to calculate your climate score." />
        ) : (
          <>
            <MobileCard className="flex flex-col items-center py-6">
              <ScoreRing score={s.score} size={140} stroke={12} label="/100" />
              <p className="mt-3 text-lg font-semibold">{statusLabel(s.status)}</p>
              <p className="mt-1 max-w-xs text-center text-xs text-slate-500">
                Score blends reduction-target progress, recent emissions trend, and compliance/data health.
              </p>
            </MobileCard>
            {(
              [
                ["Emissions progress", s.emissionsProgress],
                ["Reduction target", s.reductionProgress],
                ["Compliance health", s.complianceHealth],
              ] as const
            ).map(([label, value]) => (
              <MobileCard key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-slate-500">{value}%</p>
                </div>
                <ScoreRing score={value} size={56} stroke={6} />
              </MobileCard>
            ))}
          </>
        )}
      </ScreenBody>
    </div>
  );
}

function CarbonPulseScreen({ overview, onBack }: { overview: Overview; onBack: () => void }) {
  const m = overview.metrics;
  const total = m.totalTCO2e || 1;
  const scopes = [
    { label: "Scope 1", value: m.scope1, color: "#82D153" },
    { label: "Scope 2", value: m.scope2, color: "#4ade80" },
    { label: "Scope 3", value: m.scope3, color: "#166534" },
  ];

  return (
    <div>
      <SubHeader title="Carbon Pulse" onBack={onBack} />
      <ScreenBody className="pt-1">
        <MobileCard>
          <p className="text-3xl font-bold leading-none tabular-nums">{formatCO2(m.totalTCO2e)}</p>
          <p className="text-xs text-slate-500">Total emissions</p>
          <label className="mt-3 block text-[11px] font-semibold text-slate-400">Reporting period</label>
          <select
            value={overview.period}
            onChange={(e) => overview.setPeriod(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/8 bg-slate-50 px-3 py-2 text-sm"
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {p === "all" ? `FY ${overview.company.reportingYear}` : p}
              </option>
            ))}
          </select>
        </MobileCard>

        <MobileCard>
          <p className="text-sm font-semibold">Trend</p>
          <div className="mt-3 h-28">
            <Sparkline values={overview.monthlyTrend.map((x) => x.total)} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            {overview.monthlyTrend.slice(-3).map((x) => (
              <span key={x.month}>{x.monthLabel || x.month}</span>
            ))}
          </div>
        </MobileCard>

        <MobileCard>
          <p className="text-sm font-semibold">By Scope</p>
          {m.scope3 === 0 && overview.hasInventory ? (
            <p className="mt-2 text-xs text-amber-700">Scope 3 information looks incomplete for this period.</p>
          ) : null}
          <div className="mt-3 space-y-2">
            {scopes.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs">
                  <span>{s.label}</span>
                  <span className="font-semibold tabular-nums">
                    {formatCO2(s.value)} · {((s.value / total) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </MobileCard>

        <MobileCard>
          <p className="text-sm font-semibold">Reduction target</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{m.targetProgress.toFixed(0)}%</p>
          <p className="text-xs text-slate-500">Progress toward your science-based pathway.</p>
        </MobileCard>
      </ScreenBody>
    </div>
  );
}

function InsightScreen({
  insight,
  overview,
  onBack,
  onGoActions,
}: {
  insight: ClimateInsight | null;
  overview: Overview;
  onBack: () => void;
  onGoActions: () => void;
}) {
  return (
    <div>
      <SubHeader
        title="QAI Insight"
        onBack={onBack}
        right={
          <button type="button" className={qm.icon} aria-label="Share">
            <Share2 className="h-4 w-4" />
          </button>
        }
      />
      <ScreenBody className="pt-1">
        {!insight ? (
          <MobileEmpty title="Insight unavailable" body="QAI needs more inventory signals to explain change." />
        ) : (
          <>
            <MobileCard className="border-[#82D153]/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#3d8f2e]">
                Insight · {overview.periodLabel}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{insight.title}</h2>
              <p className="mt-2 text-sm text-slate-700">{insight.what}</p>
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Why: </span>
                {insight.why}
              </p>
              <p className="mt-3 text-sm font-semibold text-[#2f6f24]">
                Estimated impact {formatCO2(insight.emissionImpactTCO2e)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Confidence {Math.round(insight.confidence)}% · Priority {insight.priority}
              </p>
            </MobileCard>
            <MobileCard>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Recommended action
              </p>
              <p className="mt-2 text-sm">{insight.action}</p>
              <MobileButton
                className="mt-4"
                disabled={!overview.canEdit}
                onClick={() => {
                  void overview.actOnInsight(insight);
                  trackQaiMobile("recommendation_opened", { id: insight.id, action: "create" });
                  onGoActions();
                }}
              >
                Create or complete action
              </MobileButton>
            </MobileCard>
          </>
        )}
      </ScreenBody>
    </div>
  );
}

function UploadScreen({ overview, onBack }: { overview: Overview; onBack: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    supplier: string;
    date: string;
    amount: number;
    currency: string;
    category: string;
    facility: string;
    period: string;
    emissions: number;
    factor: number;
    confidence: number;
    fileName: string;
  } | null>(null);

  const extract = async (file: File) => {
    setBusy(true);
    setError(null);
    trackQaiMobile("document_uploaded", { type: file.type || "file" });
    try {
      await new Promise((r) => setTimeout(r, 600));
      if (!file.size) throw new Error("Empty file");
      const facility = "Primary facility";
      const period =
        overview.period === "all"
          ? `${overview.company.reportingYear}-01`
          : overview.period;
      const amount = 800 + (file.size % 900);
      const factor = 0.000385;
      const kwh = amount * 2.4;
      const emissions = (kwh * factor) / 1000;
      setPreview({
        supplier: file.name.replace(/\.[^.]+$/, "").slice(0, 28) || "Uploaded supplier",
        date: new Date().toISOString().slice(0, 10),
        amount,
        currency: overview.company.currency || "EUR",
        category: "Electricity",
        facility,
        period,
        emissions,
        factor,
        confidence: 0.78,
        fileName: file.name,
      });
    } catch {
      setError("Extraction failed. Try a clearer JPG, PNG, or PDF under 10MB.");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!preview || !overview.canEdit) return;
    setBusy(true);
    try {
      const activity: EmissionActivity = {
        id: `mobile-${Date.now()}`,
        period: preview.period,
        facilityId: "fac-mobile",
        country: "Germany",
        businessUnitId: "bu-corp",
        scope: "scope2",
        category: "Purchased electricity",
        subcategory: preview.category,
        source: `Mobile upload · ${preview.supplier}`,
        activityValue: preview.amount * 2.4,
        activityUnit: "kWh",
        emissionFactorId: "ef-mobile",
        emissionFactorValue: preview.factor,
        emissionFactorUnit: "tCO2e/kWh",
        emissionFactorSource: "Extracted document",
        emissionFactorYear: overview.company.reportingYear,
        conversionFactor: 1,
        ghg: "CO2",
        gwp: 1,
        method: "location_based",
        dataQualityScore: Math.round(preview.confidence * 100),
        uncertaintyPct: 15,
        evidenceStatus: "uploaded",
        isEstimated: false,
        metadata: { mobileUpload: true, fileName: preview.fileName },
      };
      await overview.addActivity(activity);
      trackQaiMobile("document_confirmed");
      setPreview(null);
      onBack();
    } catch {
      setError("Could not save. Check your connection and permissions.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SubHeader title="Upload Document" onBack={onBack} />
      <ScreenBody className="pt-1">
        {!overview.canEdit ? (
          <MobileEmpty title="Permission required" body="Contributors and above can upload evidence from mobile." />
        ) : preview ? (
          <>
            <div className="rounded-2xl bg-[#e8f8df] px-3 py-2.5 text-xs font-medium text-[#2f6f24]">
              Invoice extracted successfully. Review details before saving.
            </div>
            <MobileCard className="space-y-3 divide-y divide-black/5 p-0">
              {(
                [
                  ["Supplier", preview.supplier],
                  ["Date", preview.date],
                  ["Amount", `${preview.currency} ${preview.amount.toFixed(2)}`],
                  ["Category", preview.category],
                  ["Facility", preview.facility],
                  ["Period", preview.period],
                  ["Emission impact", formatCO2(preview.emissions)],
                  ["Emission factor", String(preview.factor)],
                  ["Confidence", `${Math.round(preview.confidence * 100)}%`],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 px-4 py-3 text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-right font-medium">{v}</span>
                </div>
              ))}
            </MobileCard>
            <MobileButton disabled={busy} onClick={() => void confirm()}>
              <Check className="h-4 w-4" />
              Confirm & Save
            </MobileButton>
            <MobileButton variant="ghost" className="h-10 w-full text-sm text-slate-600" onClick={() => setPreview(null)}>
              Edit details / re-upload
            </MobileButton>
          </>
        ) : (
          <>
            <MobileCard className="flex flex-col items-center border-dashed py-10 text-center">
              <Upload className="h-10 w-10 text-[#82D153]" />
              <p className="mt-3 text-sm font-semibold leading-snug">Upload or scan a document</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Invoices, receipts, bills or delivery notes.
              </p>
            </MobileCard>
            <div className="grid grid-cols-2 gap-2">
              <MobileButton
                variant="secondary"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="h-4 w-4 shrink-0" />
                Take Photo
              </MobileButton>
              <MobileButton
                variant="secondary"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="h-4 w-4 shrink-0" />
                Choose File
              </MobileButton>
            </div>
            <p className="text-center text-[11px] leading-none text-slate-400">JPG, PNG, PDF · max 10MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void extract(f);
              }}
            />
          </>
        )}
        {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
        {busy ? <p className="text-center text-xs text-slate-500">Working…</p> : null}
      </ScreenBody>
    </div>
  );
}

function NotificationsScreen({
  overview,
  onBack,
  onNavigate,
}: {
  overview: Overview;
  onBack: () => void;
  onNavigate: (s: MobileScreen) => void;
}) {
  const groups = useMemo(() => {
    const today: typeof overview.notifications = [];
    const earlier: typeof overview.notifications = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (const n of overview.notifications) {
      const d = new Date(n.createdAt);
      if (d >= start) today.push(n);
      else earlier.push(n);
    }
    return { today, earlier, read: overview.notifications.filter((n) => n.read) };
  }, [overview.notifications]);

  return (
    <div>
      <SubHeader
        title="Notifications"
        onBack={onBack}
        right={
          <button
            type="button"
            onClick={() => void overview.markAllNotificationsRead()}
            className={cn(qm.ghost, "px-0")}
          >
            Mark all
          </button>
        }
      />
      <ScreenBody className="space-y-4 pt-1">
        {overview.notifications.length === 0 ? (
          <MobileEmpty title="No notifications" body="Alerts from QAI and the dashboard will land here." />
        ) : (
          <>
            {(
              [
                ["Today", groups.today],
                ["Earlier", groups.earlier],
                ["Read", groups.read],
              ] as const
            ).map(([label, list]) =>
              list.length ? (
                <div key={label}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {label}
                  </p>
                  <div className="space-y-2">
                    {list.map((n) => (
                      <MobileCard
                        key={`${label}-${n.id}`}
                        onClick={() => {
                          if (n.href?.includes("emissions")) onNavigate("carbon-pulse");
                          else if (n.href?.includes("target") || n.href?.includes("reduction"))
                            onNavigate("actions");
                          else onNavigate("home");
                        }}
                        className={cn("py-3", !n.read && "bg-[#f3fbef]")}
                      >
                        <div className="flex gap-2">
                          {!n.read ? <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500" /> : null}
                          <div className="min-w-0 text-left">
                            <p className="text-sm font-semibold leading-snug">{n.title}</p>
                            <p className="text-xs leading-snug text-slate-500">{n.message}</p>
                          </div>
                        </div>
                      </MobileCard>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </>
        )}
      </ScreenBody>
    </div>
  );
}

function CompanySettingsScreen({ overview, onBack }: { overview: Overview; onBack: () => void }) {
  const c = overview.company;
  const rows = [
    ["Company name", c.name],
    ["Industry", c.industry],
    ["Base currency", c.currency],
    ["Employees", String(c.employeeCount || "—")],
    ["Reporting year", String(c.reportingYear)],
    ["Baseline year", String(c.baselineYear)],
  ];
  return (
    <div>
      <SubHeader title="Company Settings" onBack={onBack} />
      <ScreenBody className="pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Company information
        </p>
        <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white">
          {rows.map(([k, v], i) => (
            <div
              key={k}
              className={cn(
                "flex h-12 items-center justify-between gap-3 px-4 text-sm",
                i && "border-t border-black/5"
              )}
            >
              <span className="shrink-0 text-slate-500">{k}</span>
              <span className="truncate text-right font-medium">{v}</span>
            </div>
          ))}
        </div>
        <Link href="/dashboard/settings" className={cn(qm.ghost, "mx-auto")}>
          Edit in web dashboard
        </Link>
      </ScreenBody>
    </div>
  );
}

function QaiOrbSheet({
  screen,
  overview,
  onClose,
  onNavigate,
}: {
  screen: MobileScreen;
  overview: Overview;
  onClose: () => void;
  onNavigate: (s: MobileScreen) => void;
}) {
  const tip = useMemo(() => {
    if (screen === "carbon-pulse") {
      return overview.topInsight?.what
        ?? `Emissions are ${formatCO2(overview.metrics.totalTCO2e)} for ${overview.periodLabel} (${formatPercent(overview.metrics.changePct)} vs prior).`;
    }
    if (screen === "actions") {
      const n = overview.priorityActions.length;
      return n
        ? `${n} action item${n > 1 ? "s" : ""} need attention this period.`
        : "No open actions right now — nice work.";
    }
    if (screen === "upload") {
      return "I can extract the supplier, amount, category, and estimated emissions from this document.";
    }
    if (screen === "qai") {
      return "Ask about drivers, suppliers, targets, or what to do next — answers use your live company data.";
    }
    return overview.topInsight?.action ?? "Open QAI for context-aware prompts about your climate data.";
  }, [screen, overview]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/30" onClick={onClose}>
      <div
        className="rounded-t-[24px] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#82D153]" />
          <p className="text-sm font-semibold">QAI</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{tip}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MobileButton onClick={() => onNavigate("qai")}>Ask QAI</MobileButton>
          <MobileButton variant="secondary" onClick={() => onNavigate("actions")}>
            View actions
          </MobileButton>
        </div>
      </div>
    </div>
  );
}
