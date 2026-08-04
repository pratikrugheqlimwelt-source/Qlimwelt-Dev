"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Maximize2, Minimize2, QrCode } from "lucide-react";
import { PhoneFrame } from "@/components/qai-mobile/phone-frame";
import { MobileApp, type MobileScreen } from "@/components/qai-mobile/mobile-app";
import { MobileButton, MobilePill, qm } from "@/components/qai-mobile/mobile-primitives";
import { trackQaiMobile } from "@/lib/qai-mobile/analytics";
import { cn } from "@/lib/utils";

const SCREEN_CHIPS: { id: MobileScreen; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "carbon-pulse", label: "Pulse" },
  { id: "actions", label: "Actions" },
  { id: "qai", label: "QAI" },
  { id: "upload", label: "Upload" },
  { id: "profile", label: "Profile" },
];

export function QaiMobileExperience() {
  const [screen, setScreen] = useState<MobileScreen>("home");
  const [fullscreen, setFullscreen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [betaSent, setBetaSent] = useState(false);

  useEffect(() => {
    trackQaiMobile("mobile_preview_opened");
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (isNarrow) {
    return (
      <div className="min-h-[100dvh] bg-[#F7F8F6]">
        <MobileApp screen={screen} onNavigate={setScreen} />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(ellipse_at_top,_#f3fbef_0%,_#f8faf7_45%,_#eef2ec_100%)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-14 lg:py-14">
        <div className={cn(fullscreen && "lg:hidden")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Qlimwelt · QAI Mobile
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl">
            Climate intelligence in your pocket
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-600">
            Interactive preview of QAI Mobile using your live authenticated company data — same
            metrics, tasks, and insights as the web dashboard.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>• Live climate score, carbon pulse, and QAI insights</li>
            <li>• Actions sync with the web reduction planner</li>
            <li>• Document upload updates inventory after confirm</li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white">
              <div className="text-center">
                <QrCode className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-1 text-[10px] font-medium text-slate-400">QR placeholder</p>
              </div>
            </div>
            <div>
              <MobileButton
                disabled={betaSent}
                className="w-auto min-w-[180px] px-6 shadow-[0_10px_28px_-12px_rgba(130,209,83,0.9)]"
                onClick={() => {
                  trackQaiMobile("mobile_beta_interest");
                  setBetaSent(true);
                }}
              >
                {betaSent ? "You're on the list" : "Join mobile beta"}
              </MobileButton>
              <p className="mt-2 text-left text-xs leading-relaxed text-slate-500">
                Your climate intelligence, wherever you go.
              </p>
            </div>
          </div>

          <Link href="/dashboard/overview" className={cn(qm.ghost, "mt-8 justify-start px-0")}>
            ← Back to dashboard
          </Link>
        </div>

        <div className={cn("flex w-[360px] flex-col items-center", fullscreen && "lg:col-span-2")}>
          <div className="mb-3 flex w-full flex-wrap items-center justify-center gap-2">
            {SCREEN_CHIPS.map((c) => (
              <MobilePill key={c.id} active={screen === c.id} onClick={() => setScreen(c.id)}>
                {c.label}
              </MobilePill>
            ))}
            <MobilePill onClick={() => setFullscreen((v) => !v)} className="gap-1">
              {fullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              {fullscreen ? "Exit" : "Fullscreen"}
            </MobilePill>
          </div>
          <PhoneFrame framed>
            <MobileApp screen={screen} onNavigate={setScreen} />
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}
