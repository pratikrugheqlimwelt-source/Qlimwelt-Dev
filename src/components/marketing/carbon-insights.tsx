"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ExternalLink, Newspaper } from "lucide-react";
import {
  Section,
  SectionContainer,
  SectionNumberWrap,
  SectionIntro,
  MetaLabel,
  ThinRule,
  FadeUp,
  FadeUpStagger,
  FadeUpItem,
  EditorialCta,
} from "@/components/marketing/editorial";
import { ExternalResourceLink } from "@/components/marketing/external-link";
import { useT } from "@/components/i18n/locale-provider";
import { useLocalizedMarketing } from "@/lib/i18n/use-localized-marketing";
import { cn } from "@/lib/utils";
import { MetricFigure } from "@/components/ui/metric-figure";

const IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80";

type ScopeTopic = {
  id: string;
  tag: string;
  title: string;
  description: string;
  share: string;
  shareLabel: string;
  accent: string;
  examples: string[];
  image: string;
  imageAlt: string;
};

/** Unsplash photos — native img avoids Next.js optimizer config issues on deploy */
function EditorialImage({
  src,
  alt,
  className,
  priority,
  fill,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Position image absolute inside a relative parent (for hero banners) */
  fill?: boolean;
}) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  const img = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={resolvedSrc}
      alt={alt}
      className={cn(
        fill ? "absolute inset-0 h-full w-full object-cover" : "h-full w-full object-cover",
        className
      )}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setResolvedSrc(IMAGE_FALLBACK)}
    />
  );

  if (fill) return img;

  return <div className={cn("overflow-hidden bg-neutral-900", className)}>{img}</div>;
}

function ScopeCard({ topic }: { topic: ScopeTopic }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden border border-border bg-background shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[5/4] overflow-hidden bg-neutral-900">
        <EditorialImage src={topic.image} alt={topic.imageAlt} fill />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <MetaLabel className="text-white/70">{topic.tag}</MetaLabel>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h3 className="max-w-[70%] font-serif text-xl font-bold leading-tight text-white sm:text-2xl">
              {topic.title}
            </h3>
            <MetricFigure
              size="xl"
              className="sm:text-4xl"
              style={{ color: topic.accent === "#334155" ? "#e2e8f0" : topic.accent }}
            >
              {topic.share}
            </MetricFigure>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{topic.description}</p>
        <ThinRule className="my-5" />
        <div className="flex flex-wrap gap-2">
          {topic.examples.map((ex) => (
            <span key={ex} className="bg-muted/60 px-2.5 py-1 type-label">
              {ex}
            </span>
          ))}
        </div>
        <p className="mt-4 type-label">{topic.shareLabel}</p>
      </div>
    </article>
  );
}

function ArticleBanner({
  image,
  imageAlt,
  category,
  priority,
}: {
  image: string;
  imageAlt: string;
  category: string;
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900">
      <EditorialImage src={image} alt={imageAlt} priority={priority} fill />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
      <span className="absolute left-4 top-4 z-10 bg-black/70 px-2.5 py-1 type-label text-white backdrop-blur-sm sm:left-5 sm:top-5">
        {category}
      </span>
    </div>
  );
}

export function CarbonFootprintSection() {
  const t = useT();
  const { carbonFootprintTopics, footprintFacts } = useLocalizedMarketing();

  return (
    <Section id="carbon-footprint">
      <SectionNumberWrap n="03" />
      <SectionContainer>
        <FadeUp>
          <SectionIntro
            label={t("marketing.educationLabel")}
            lines={[
              { text: t("marketing.understanding"), italic: true },
              { text: t("marketing.yourCarbonFootprint") },
            ]}
          />
          <p className="section-headline-gap max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("marketing.footprintIntroBefore")}{" "}
            <ExternalResourceLink
              href="https://ghgprotocol.org/corporate-standard"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              GHG Protocol
            </ExternalResourceLink>{" "}
            {t("marketing.footprintIntroAfter")}
          </p>
        </FadeUp>

        <FadeUpStagger className="section-content-gap grid gap-6 lg:grid-cols-3 lg:gap-8">
          {carbonFootprintTopics.map((topic) => (
            <FadeUpItem key={topic.id}>
              <ScopeCard topic={topic} />
            </FadeUpItem>
          ))}
        </FadeUpStagger>

        <FadeUp delay={0.1}>
          <div className="section-content-gap relative min-h-[220px] overflow-hidden border border-border bg-neutral-900">
            <EditorialImage
              src="https://images.unsplash.com/photo-1542601906990-159416042fc3?auto=format&fit=crop&w=1600&q=80"
              alt="Forest aerial view representing natural carbon sinks and climate impact"
              fill
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
            <div className="relative grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {footprintFacts.map((fact, fi) => (
                <div key={`fact-${fi}`} className="bg-black/40 p-5 backdrop-blur-sm sm:p-6">
                  <MetricFigure size="xl" className="text-brand">
                    {fact.value}
                  </MetricFigure>
                  <p className="mt-2 text-sm font-medium text-white">{fact.label}</p>
                  <MetaLabel className="mt-2 text-white/50">{fact.sub}</MetaLabel>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </SectionContainer>
    </Section>
  );
}

export function InsightsNewsSection() {
  const t = useT();
  const { insightArticles, industryNews } = useLocalizedMarketing();
  const featured = insightArticles.find((a) => a.featured)!;
  const rest = insightArticles.filter((a) => !a.featured);

  return (
    <Section id="insights" dark className="border-white/10">
      <SectionNumberWrap n="05" align="left" className="text-white/[0.04]" />
      <SectionContainer>
        <FadeUp>
          <SectionIntro
            dark
            label={t("marketing.insightsLabel")}
            lines={[
              { text: t("marketing.briefingRoom1"), italic: true },
              { text: t("marketing.briefingRoom2") },
            ]}
          />
          <p className="section-headline-gap max-w-2xl text-sm leading-relaxed text-white/50">
            {t("marketing.insightsIntro")}
          </p>
        </FadeUp>

        <FadeUp delay={0.05}>
          <ExternalResourceLink
            href={featured.externalUrl}
            aria-label={`${featured.title} (opens in new tab)`}
            className="group section-content-gap block overflow-hidden border border-white/10 bg-[#0a0a0a]"
          >
            <div className="relative min-h-[280px] overflow-hidden lg:min-h-[360px]">
              <EditorialImage src={featured.image} alt={featured.imageAlt} priority fill />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-brand px-2.5 py-1 type-label text-black">{featured.category}</span>
                  <span className="type-label text-white/50">{featured.date}</span>
                  <span className="flex items-center gap-1 type-label text-white/50">
                    <Clock className="h-3 w-3" />
                    {featured.readTime}
                  </span>
                </div>
                <h3 className="mt-5 max-w-3xl font-serif text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  {featured.title}
                </h3>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">{featured.excerpt}</p>
                <span className="type-label mt-6 inline-flex items-center gap-2 text-brand transition-colors group-hover:text-white">
                  {t("marketing.readSourceArticle")}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>
            </div>
          </ExternalResourceLink>
        </FadeUp>

        <FadeUpStagger className="section-content-gap grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <FadeUpItem key={article.slug}>
              <ExternalResourceLink
                href={article.externalUrl}
                aria-label={`${article.title} (opens in new tab)`}
                className="group flex h-full flex-col overflow-hidden border border-white/10 bg-[#0a0a0a] transition-colors hover:border-white/20"
              >
                <ArticleBanner image={article.image} imageAlt={article.imageAlt} category={article.category} />
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-center gap-2 type-label text-white/40">
                    <span>{article.date}</span>
                    <span>·</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h4 className="mt-3 font-serif text-lg font-bold leading-snug text-white group-hover:text-brand">
                    {article.title}
                  </h4>
                  <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-white/55 sm:text-sm">
                    {article.excerpt}
                  </p>
                  <span className="type-label mt-4 inline-flex items-center gap-1 text-white/40 group-hover:text-brand">
                    {t("marketing.readSource")}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
              </ExternalResourceLink>
            </FadeUpItem>
          ))}
        </FadeUpStagger>

        <FadeUp delay={0.15}>
          <div className="section-content-gap">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Newspaper className="h-5 w-5 text-brand" />
                <MetaLabel className="text-white/40">{t("marketing.industryPulse")}</MetaLabel>
              </div>
              <MetaLabel className="text-white/25">{t("marketing.updatedWeekly")}</MetaLabel>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {industryNews.map((item, ni) => (
                <ExternalResourceLink
                  key={`news-${ni}`}
                  href={item.externalUrl}
                  aria-label={`${item.headline} (opens in new tab)`}
                  className="group block overflow-hidden border border-white/10 bg-[#0a0a0a] transition-colors hover:border-white/20"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-neutral-900">
                    <EditorialImage src={item.image} alt={item.imageAlt} fill />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-4">
                      <span className="bg-brand px-2 py-0.5 type-label text-black">{item.source}</span>
                      <span className="type-label text-white/60">{item.date}</span>
                    </div>
                  </div>
                  <div className="p-5 sm:p-6">
                    <h4 className="font-serif text-base font-bold leading-snug text-white group-hover:text-brand sm:text-lg">
                      {item.headline}
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-white/50 sm:text-sm">{item.summary}</p>
                    <span className="type-label mt-4 inline-flex items-center gap-1 text-white/35 group-hover:text-brand">
                      {t("marketing.openSource")}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                </ExternalResourceLink>
              ))}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <EditorialCta href="/whats-new" className="border-white/30 text-white hover:bg-white hover:text-black">
              {t("marketing.viewAllInsights")}
            </EditorialCta>
            <Link href="#contact" className="type-label text-white/40 transition-colors hover:text-white">
              {t("marketing.subscribeBriefing")}
            </Link>
          </div>
          <p className="type-label mt-6 text-white/25">
            {t("marketing.photoCredit")}{" "}
            <ExternalResourceLink
              href="https://unsplash.com/license"
              className="underline-offset-2 hover:text-white/50 hover:underline"
            >
              Unsplash
            </ExternalResourceLink>{" "}
            {t("marketing.photoLicense")}
          </p>
        </FadeUp>
      </SectionContainer>
    </Section>
  );
}
