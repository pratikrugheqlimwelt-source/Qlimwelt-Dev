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
    <Section id="about" viewport className="overflow-visible bg-[hsl(var(--siemens-surface))] !py-14 lg:!py-20">
      <SectionContainer>
        <FadeUp className="mx-auto max-w-3xl text-center">
          <MetaLabel className="text-brand">{t("marketing.teamLabel")}</MetaLabel>
          <h2 className="siemens-display mt-4">
            {tab === "founders"
              ? `${t("marketing.teamTitle1")} ${t("marketing.teamTitle2")}`
              : t("marketing.supportTitle")}
          </h2>
          <p className="siemens-body mx-auto mt-5 max-w-2xl">
            {tab === "founders" ? t("marketing.teamIntro") : t("marketing.supportIntro")}
          </p>
        </FadeUp>

        <div
          className="mx-auto mt-8 flex w-fit items-center rounded-sm border border-border bg-white p-1.5"
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
                  "rounded-sm px-5 py-2.5 text-sm font-semibold tracking-tight transition-colors sm:px-6 sm:text-base",
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
              <div className="mx-auto mt-12 grid max-w-5xl gap-10 sm:grid-cols-3 sm:gap-8 lg:mt-14 lg:gap-10">
                {TEAM.map((member, i) => (
                  <motion.article
                    key={member.id}
                    initial={reduced ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: EASE_OUT }}
                    className="group flex flex-col items-center text-center"
                  >
                    <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full border-[3px] border-white shadow-[0_12px_40px_-16px_rgba(15,23,42,0.35)] ring-1 ring-border transition-shadow duration-300 group-hover:ring-brand/45 sm:h-44 sm:w-44 lg:h-52 lg:w-52">
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={208}
                        height={208}
                        className="h-full w-full object-cover object-[center_12%] transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 160px, (max-width: 1024px) 176px, 208px"
                        priority={i === 0}
                      />
                    </div>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand sm:text-[13px]">
                      {t(`marketing.${member.focusKey}`)}
                    </p>
                    <h3 className="mt-2 font-sans text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {member.name}
                    </h3>
                    <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {t(`marketing.${member.roleKey}`)}
                    </p>
                  </motion.article>
                ))}
              </div>

              <FadeUp delay={0.1}>
                <p className="mx-auto mt-12 max-w-2xl text-center text-base italic leading-relaxed text-muted-foreground sm:mt-14 sm:text-lg lg:text-xl">
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
              className="mx-auto mt-12 max-w-5xl lg:mt-14"
            >
              <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
                <article className="flex flex-col border-t border-border pt-8">
                  <MetaLabel className="text-brand">{t("marketing.supportIhubLabel")}</MetaLabel>
                  <h3 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {t("marketing.supportIhubName")}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-muted-foreground sm:text-base">
                    {t("marketing.supportIhubTagline")}
                  </p>
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-[17px]">
                    {t("marketing.supportIhubBody")}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {(["supportIhubPoint1", "supportIhubPoint2", "supportIhubPoint3"] as const).map(
                      (key) => (
                        <li key={key} className="flex gap-3 text-base text-foreground/85">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
                          <span>{t(`marketing.${key}`)}</span>
                        </li>
                      )
                    )}
                  </ul>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                    {t("marketing.supportIhubLocation")}
                  </p>
                  <Link
                    href="https://www.ihubmids.de/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="siemens-btn-secondary mt-8 w-fit"
                  >
                    {t("marketing.supportIhubCta")}
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>

                <article className="flex flex-col border-t border-border pt-8">
                  <MetaLabel className="text-brand">{t("marketing.supportQlimLabel")}</MetaLabel>
                  <h3 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {t("marketing.supportQlimName")}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-muted-foreground sm:text-base">
                    {t("marketing.supportQlimTagline")}
                  </p>
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-[17px]">
                    {t("marketing.supportQlimBody")}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {(["supportQlimPoint1", "supportQlimPoint2", "supportQlimPoint3"] as const).map(
                      (key) => (
                        <li key={key} className="flex gap-3 text-base text-foreground/85">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
                          <span>{t(`marketing.${key}`)}</span>
                        </li>
                      )
                    )}
                  </ul>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                    {t("marketing.supportQlimOrigin")}
                  </p>
                  <Link href="#capabilities" className="siemens-btn-secondary mt-8 w-fit">
                    {t("marketing.supportQlimCta")}
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              </div>

              <p className="mx-auto mt-12 max-w-3xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("marketing.supportBridge")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionContainer>
    </Section>
  );
}
