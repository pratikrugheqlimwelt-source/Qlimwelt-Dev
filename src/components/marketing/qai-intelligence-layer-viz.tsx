"use client";

import { useMemo, useId, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

type NodeKind = "source" | "hidden" | "output";

type GraphNode = {
  id: string;
  labelKey?: string;
  titleKey?: string;
  kind: NodeKind;
  x: number;
  y: number;
  r: number;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
};

const VB_W = 880;
const VB_H = 360;

const SOURCE_KEYS = [
  "heroSourceErp",
  "heroSourceAccounting",
  "heroSourceProcurement",
  "heroSourceSuppliers",
  "heroSourceEnergy",
  "heroSourceIot",
  "heroSourceLogistics",
] as const;

const OUTPUT_KEYS = [
  "heroOutInsights",
  "heroOutRecommendations",
  "heroOutCompliance",
  "heroOutForecasts",
  "heroOutAutomation",
] as const;

const HIDDEN = [
  { id: "h-connect", titleKey: "heroGraphNeuronConnect" },
  { id: "h-reason", titleKey: "heroGraphNeuronReason" },
  { id: "h-decide", titleKey: "heroGraphNeuronDecide" },
] as const;

function stackY(count: number, index: number, top: number, bottom: number) {
  if (count === 1) return (top + bottom) / 2;
  return top + ((bottom - top) * index) / (count - 1);
}

function buildNetwork(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const top = 42;
  const bottom = VB_H - 28;
  const xIn = 230;
  const xHid = 440;
  const xOut = 650;

  const sources: GraphNode[] = SOURCE_KEYS.map((key, i) => ({
    id: key,
    labelKey: key,
    kind: "source",
    x: xIn,
    y: stackY(SOURCE_KEYS.length, i, top, bottom),
    r: 11,
  }));

  const hidden: GraphNode[] = HIDDEN.map((h, i) => ({
    id: h.id,
    kind: "hidden",
    titleKey: h.titleKey,
    x: xHid,
    y: stackY(HIDDEN.length, i, top + 36, bottom - 36),
    r: 17,
  }));

  const outputs: GraphNode[] = OUTPUT_KEYS.map((key, i) => ({
    id: key,
    labelKey: key,
    kind: "output",
    x: xOut,
    y: stackY(OUTPUT_KEYS.length, i, top + 16, bottom - 16),
    r: 11,
  }));

  const nodes = [...sources, ...hidden, ...outputs];
  const edges: GraphEdge[] = [];

  for (const s of sources) {
    for (const h of hidden) {
      edges.push({ id: `${s.id}->${h.id}`, from: s.id, to: h.id });
    }
  }
  for (const h of hidden) {
    for (const o of outputs) {
      edges.push({ id: `${h.id}->${o.id}`, from: h.id, to: o.id });
    }
  }

  return { nodes, edges };
}

function synapsePath(a: GraphNode, b: GraphNode) {
  const dx = b.x - a.x;
  const c1x = a.x + dx * 0.42;
  const c2x = a.x + dx * 0.58;
  return `M ${a.x + a.r} ${a.y} C ${c1x} ${a.y}, ${c2x} ${b.y}, ${b.x - b.r} ${b.y}`;
}

/** Highlight full forward/backward pathway for a hovered neuron. */
function pathwayOf(nodeId: string, edges: GraphEdge[], byId: Map<string, GraphNode>) {
  const node = byId.get(nodeId);
  if (!node) return { nodes: new Set<string>(), edges: new Set<string>() };

  const litNodes = new Set<string>([nodeId]);
  const litEdges = new Set<string>();

  if (node.kind === "source") {
    for (const e of edges) {
      if (e.from === nodeId) {
        litEdges.add(e.id);
        litNodes.add(e.to);
        for (const e2 of edges) {
          if (e2.from === e.to) {
            litEdges.add(e2.id);
            litNodes.add(e2.to);
          }
        }
      }
    }
  } else if (node.kind === "hidden") {
    for (const e of edges) {
      if (e.from === nodeId || e.to === nodeId) {
        litEdges.add(e.id);
        litNodes.add(e.from);
        litNodes.add(e.to);
      }
    }
  } else {
    for (const e of edges) {
      if (e.to === nodeId) {
        litEdges.add(e.id);
        litNodes.add(e.from);
        for (const e2 of edges) {
          if (e2.to === e.from) {
            litEdges.add(e2.id);
            litNodes.add(e2.from);
          }
        }
      }
    }
  }

  return { nodes: litNodes, edges: litEdges };
}

/** Neural-network diagram with live hover pathway highlighting. */
export function QaiIntelligenceLayerViz({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const t = useT();
  const reduced = useReducedMotion();
  const uid = useId();
  const { nodes, edges } = useMemo(() => buildNetwork(), []);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const [hoverId, setHoverId] = useState<string | null>(null);

  const pathway = useMemo(
    () => (hoverId ? pathwayOf(hoverId, edges, byId) : null),
    [hoverId, edges, byId]
  );

  const onEnter = useCallback((id: string) => setHoverId(id), []);
  const onLeave = useCallback(() => setHoverId(null), []);

  const LABEL_LEFT_X = 186;
  const LABEL_RIGHT_X = 694;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white",
        compact && "max-h-[min(420px,70vh)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(130,209,83,0.05), transparent 70%)",
        }}
        aria-hidden
      />

      <div className={cn("relative px-4 pt-3 sm:px-5", compact ? "sm:pt-3.5" : "sm:pt-5")}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {t("marketing.heroVizLabel")}
        </p>
        {!compact && (
          <p className="mt-1 text-sm text-slate-500">{t("marketing.heroGraphHint")}</p>
        )}
      </div>

      <div className="relative w-full px-1 pb-2 sm:px-2 sm:pb-2.5">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className={cn(
            "mx-auto h-auto w-full",
            compact ? "max-h-[340px] min-h-[240px] lg:max-h-[360px]" : "min-h-[280px] sm:min-h-[340px]"
          )}
          role="img"
          aria-label={t("marketing.heroVizLabel")}
        >
          <defs>
            <linearGradient id={`${uid}-syn`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d4d4d8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#86efac" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#d4d4d8" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id={`${uid}-hot`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#82D153" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3d8b2e" stopOpacity="0.95" />
            </linearGradient>
            <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id={`${uid}-hid`} cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>

          <text
            x={230}
            y={22}
            textAnchor="middle"
            fill="#94a3b8"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em" }}
          >
            {t("marketing.heroGraphLegendSource").toUpperCase()}
          </text>
          <text
            x={440}
            y={22}
            textAnchor="middle"
            fill="#3d8b2e"
            style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em" }}
          >
            QAI
          </text>
          <text
            x={650}
            y={22}
            textAnchor="middle"
            fill="#94a3b8"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em" }}
          >
            {t("marketing.heroGraphLegendOutput").toUpperCase()}
          </text>

          <rect x={200} y={30} width={60} height={VB_H - 48} rx={16} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
          <rect x={410} y={30} width={60} height={VB_H - 48} rx={16} fill="#f4fbf0" stroke="#82D153" strokeOpacity="0.3" strokeWidth="1.25" />
          <rect x={620} y={30} width={60} height={VB_H - 48} rx={16} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

          {/* Synapses */}
          <g>
            {edges.map((e) => {
              const a = byId.get(e.from)!;
              const b = byId.get(e.to)!;
              const hot = pathway?.edges.has(e.id) ?? false;
              const dim = pathway != null && !hot;
              const d = synapsePath(a, b);

              return (
                <g key={e.id} style={{ opacity: dim ? 0.08 : hot ? 1 : 0.5, transition: "opacity 180ms ease" }}>
                  <path
                    d={d}
                    fill="none"
                    stroke={hot ? `url(#${uid}-hot)` : `url(#${uid}-syn)`}
                    strokeWidth={hot ? 1.8 : 0.95}
                    style={{ transition: "stroke-width 180ms ease" }}
                  />
                  {hot && !reduced && (
                    <circle r="2.2" fill="#82D153" filter={`url(#${uid}-glow)`}>
                      <animateMotion dur="1.35s" repeatCount="indefinite" path={d} />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* Neurons + labels */}
          <g>
            {nodes.map((n, i) => {
              const isHidden = n.kind === "hidden";
              const label =
                n.kind === "hidden"
                  ? t(`marketing.${n.titleKey}`)
                  : t(`marketing.${n.labelKey}`);
              const lit = pathway == null || pathway.nodes.has(n.id);
              const hot = hoverId === n.id;

              return (
                <motion.g
                  key={n.id}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{
                    opacity: lit ? 1 : 0.2,
                    scale: hot ? 1.06 : 1,
                  }}
                  transition={{ duration: 0.2, delay: i * 0.015, ease: EASE_OUT }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px`, cursor: "pointer" }}
                  onMouseEnter={() => onEnter(n.id)}
                  onMouseLeave={onLeave}
                  onFocus={() => onEnter(n.id)}
                  onBlur={onLeave}
                  tabIndex={0}
                  role="button"
                  aria-label={label}
                >
                  {hot && !reduced && (
                    <motion.circle
                      cx={n.x}
                      cy={n.y}
                      r={n.r + 7}
                      fill="none"
                      stroke="#82D153"
                      strokeWidth="1"
                      initial={{ opacity: 0.2 }}
                      animate={{ opacity: [0.2, 0.55, 0.2] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  )}

                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={hot ? n.r + 1.5 : n.r}
                    fill={
                      isHidden
                        ? `url(#${uid}-hid)`
                        : n.kind === "output"
                          ? "#ecf9e4"
                          : "#ffffff"
                    }
                    stroke={
                      hot || isHidden
                        ? "#82D153"
                        : n.kind === "output"
                          ? "#86efac"
                          : "#cbd5e1"
                    }
                    strokeWidth={hot || isHidden ? 2 : 1.35}
                    filter={hot ? `url(#${uid}-glow)` : undefined}
                  />
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isHidden ? 3.5 : 2.8}
                    fill={hot || isHidden ? "#82D153" : n.kind === "output" ? "#4ade80" : "#94a3b8"}
                  />

                  {isHidden ? (
                    <text
                      x={n.x}
                      y={n.y + n.r + 10}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      fill={hot ? "#0f172a" : "#334155"}
                      style={{ fontSize: 10, fontWeight: 700 }}
                    >
                      {label}
                    </text>
                  ) : n.kind === "source" ? (
                    <text
                      x={LABEL_LEFT_X}
                      y={n.y}
                      textAnchor="end"
                      dominantBaseline="central"
                      fill={hot ? "#0f172a" : "#334155"}
                      style={{ fontSize: 11, fontWeight: hot ? 700 : 600 }}
                    >
                      {label}
                    </text>
                  ) : (
                    <text
                      x={LABEL_RIGHT_X}
                      y={n.y}
                      textAnchor="start"
                      dominantBaseline="central"
                      fill={hot ? "#14532d" : "#166534"}
                      style={{ fontSize: 11, fontWeight: hot ? 700 : 600 }}
                    >
                      {label}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </g>

          <text
            x={440}
            y={VB_H - 8}
            textAnchor="middle"
            fill="#64748b"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            {t("marketing.heroVizCoreTitle")}
          </text>
        </svg>
      </div>
    </div>
  );
}
