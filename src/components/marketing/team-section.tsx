"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { MetaLabel, FadeUp, Section, SectionContainer } from "@/components/marketing/editorial";
import { useT } from "@/components/i18n/locale-provider";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TEAM = [
  {
    id: "pratik",
    name: "Pratik Rughe",
    image: "/team/pratik-rughe.png",
    roleKey: "teamPratikRole",
    focusKey: "teamPratikFocus",
  },
  {
    id: "aditi",
    name: "Aditi Raibagkar",
    image: "/team/aditi-raibagkar.png",
    roleKey: "teamAditiRole",
    focusKey: "teamAditiFocus",
  },
  {
    id: "jasmin",
    name: "Jasmin Heimann",
    image: "/team/jasmin-heimann.png",
    roleKey: "teamJasminRole",
    focusKey: "teamJasminFocus",
  },
] as const;

type ProfileTab = "founders" | "support";

export function TeamSection() {
  const t = useT();
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<ProfileTab>("founders");

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "founders", label: t("marketing.teamTabFounders") },
    { id: "support", label: t("marketing.teamTabSupport") },
  ];

  return (
    <Section id="about" viewport className="overflow-visible bg-[hsl(var(--siemens-surface))] !py-8 lg:!py-10">
      <SectionContainer>
        <FadeUp className="mx-auto max-w-xl text-center">
          <MetaLabel className="text-brand">{t("marketing.teamLabel")}</MetaLabel>
          <h2 className="mt-2 font-sans text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {tab === "founders"
              ? `${t("marketing.teamTitle1")} ${t("marketing.teamTitle2")}`
              : t("marketing.supportTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {tab === "founders" ? t("marketing.teamIntro") : t("marketing.supportIntro")}
          </p>
        </FadeUp>

        <div
          className="mx-auto mt-6 flex w-fit items-center rounded-sm border border-border bg-white p-1"
          role="tablist"
          aria-label={t("marketing.teamToggleAria")}
        >
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded-sm px-4 py-2 text-xs font-semibold tracking-tight transition-colors sm:px-5 sm:text-sm",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {tab === "founders" ? (
            <motion.div
              key="founders"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              <div className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-3 sm:gap-4">
                {TEAM.map((member, i) => (
                  <motion.article
                    key={member.id}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease: EASE_OUT }}
                    className="group flex flex-col items-center text-center"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-border transition-shadow duration-300 group-hover:ring-brand/40 sm:h-[6.5rem] sm:w-[6.5rem]">
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={104}
                        height={104}
                        className="h-full w-full object-cover object-[center_12%] transition-transform duration-400 group-hover:scale-105"
                        sizes="104px"
                        priority={i === 0}
                      />
                    </div>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
                      {t(`marketing.${member.focusKey}`)}
                    </p>
                    <h3 className="mt-1 font-sans text-sm font-semibold tracking-tight text-foreground">
                      {member.name}
                    </h3>
                    <p className="mt-0.5 max-w-[14rem] text-[11px] leading-snug text-muted-foreground">
                      {t(`marketing.${member.roleKey}`)}
                    </p>
                  </motion.article>
                ))}
              </div>

              <FadeUp delay={0.1}>
                <p className="mx-auto mt-8 max-w-lg text-center text-xs italic leading-relaxed text-muted-foreground sm:text-sm">
                  “{t("marketing.founderQuote")}”
                </p>
              </FadeUp>
            </motion.div>
          ) : (
            <motion.div
              key="support"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="mx-auto mt-8 max-w-4xl"
            >
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                {/* iHubMinds */}
                <article className="flex flex-col border-t border-border pt-6">
                  <MetaLabel className="text-brand">{t("marketing.supportIhubLabel")}</MetaLabel>
                  <h3 className="mt-2 font-sans text-lg font-semibold tracking-tight text-foreground">
                    {t("marketing.supportIhubName")}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {t("marketing.supportIhubTagline")}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {t("marketing.supportIhubBody")}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {(["supportIhubPoint1", "supportIhubPoint2", "supportIhubPoint3"] as const).map(
                      (key) => (
                        <li key={key} className="flex gap-2.5 text-sm text-foreground/80">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                          <span>{t(`marketing.${key}`)}</span>
                        </li>
                      )
                    )}
                  </ul>
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    {t("marketing.supportIhubLocation")}
                  </p>
                  <Link
                    href="https://www.ihubmids.de/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="siemens-btn-secondary mt-6 w-fit text-sm"
                  >
                    {t("marketing.supportIhubCta")}
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>

                {/* Qlimwelt */}
                <article className="flex flex-col border-t border-border pt-6">
                  <MetaLabel className="text-brand">{t("marketing.supportQlimLabel")}</MetaLabel>
                  <h3 className="mt-2 font-sans text-lg font-semibold tracking-tight text-foreground">
                    {t("marketing.supportQlimName")}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {t("marketing.supportQlimTagline")}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {t("marketing.supportQlimBody")}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {(["supportQlimPoint1", "supportQlimPoint2", "supportQlimPoint3"] as const).map(
                      (key) => (
                        <li key={key} className="flex gap-2.5 text-sm text-foreground/80">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                          <span>{t(`marketing.${key}`)}</span>
                        </li>
                      )
                    )}
                  </ul>
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    {t("marketing.supportQlimOrigin")}
                  </p>
                  <Link href="#capabilities" className="siemens-btn-secondary mt-6 w-fit text-sm">
                    {t("marketing.supportQlimCta")}
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              </div>

              <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {t("marketing.supportBridge")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionContainer>
    </Section>
  );
}
