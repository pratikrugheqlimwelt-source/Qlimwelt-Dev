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

/** Wide enough for side labels; short enough for hero side column. */
const VB_W = 900;
const VB_H = 340;

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

/** Column geometry — labels and nodes never share the same x-band. */
const COL = {
  leftLabelX: 132,
  inX: 210,
  hidX: 450,
  outX: 690,
  rightLabelX: 768,
  bandW: 52,
  top: 44,
  bottom: VB_H - 20,
} as const;

function stackY(count: number, index: number, top: number, bottom: number) {
  if (count === 1) return (top + bottom) / 2;
  return top + ((bottom - top) * index) / (count - 1);
}

function buildNetwork(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const sources: GraphNode[] = SOURCE_KEYS.map((key, i) => ({
    id: key,
    labelKey: key,
    kind: "source",
    x: COL.inX,
    y: stackY(SOURCE_KEYS.length, i, COL.top, COL.bottom),
    r: 10,
  }));

  const hidden: GraphNode[] = HIDDEN.map((h, i) => ({
    id: h.id,
    kind: "hidden",
    titleKey: h.titleKey,
    x: COL.hidX,
    y: stackY(HIDDEN.length, i, COL.top + 28, COL.bottom - 28),
    r: 20,
  }));

  const outputs: GraphNode[] = OUTPUT_KEYS.map((key, i) => ({
    id: key,
    labelKey: key,
    kind: "output",
    x: COL.outX,
    y: stackY(OUTPUT_KEYS.length, i, COL.top + 12, COL.bottom - 12),
    r: 10,
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
  const c1x = a.x + dx * 0.4;
  const c2x = a.x + dx * 0.6;
  return `M ${a.x + a.r} ${a.y} C ${c1x} ${a.y}, ${c2x} ${b.y}, ${b.x - b.r} ${b.y}`;
}

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

function bandX(center: number) {
  return center - COL.bandW / 2;
}

/** Compact neural-network diagram — labels never overlap synapses or nodes. */
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

  const labelOf = (n: GraphNode) =>
    n.kind === "hidden" ? t(`marketing.${n.titleKey}`) : t(`marketing.${n.labelKey}`);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% 42%, rgba(130,209,83,0.05), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative flex items-baseline justify-between gap-3 px-4 pt-3 sm:px-5 sm:pt-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {t("marketing.heroVizLabel")}
        </p>
        <p className="shrink-0 text-[10px] font-medium text-slate-400">
          {t("marketing.heroVizCoreTitle")}
        </p>
      </div>

      <div className="relative w-full px-2 pb-2 sm:px-3 sm:pb-3">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className={cn(
            "mx-auto block h-auto w-full",
            compact ? "max-h-[300px] sm:max-h-[320px]" : "max-h-[380px]"
          )}
          role="img"
          aria-label={t("marketing.heroVizLabel")}
        >
          <defs>
            <linearGradient id={`${uid}-syn`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d4d4d8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#86efac" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d4d4d8" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id={`${uid}-hot`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#82D153" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3d8b2e" stopOpacity="0.95" />
            </linearGradient>
            <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="b" />
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

          {/* Layer titles — centered on node columns only */}
          <text
            x={COL.inX}
            y={18}
            textAnchor="middle"
            fill="#94a3b8"
            style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em" }}
          >
            {t("marketing.heroGraphLegendSource").toUpperCase()}
          </text>
          <text
            x={COL.hidX}
            y={18}
            textAnchor="middle"
            fill="#3d8b2e"
            style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em" }}
          >
            QAI
          </text>
          <text
            x={COL.outX}
            y={18}
            textAnchor="middle"
            fill="#94a3b8"
            style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em" }}
          >
            {t("marketing.heroGraphLegendOutput").toUpperCase()}
          </text>

          {/* Soft column bands behind nodes only */}
          <rect
            x={bandX(COL.inX)}
            y={26}
            width={COL.bandW}
            height={VB_H - 36}
            rx={14}
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          <rect
            x={bandX(COL.hidX)}
            y={26}
            width={COL.bandW}
            height={VB_H - 36}
            rx={14}
            fill="#f4fbf0"
            stroke="#82D153"
            strokeOpacity="0.28"
            strokeWidth="1.15"
          />
          <rect
            x={bandX(COL.outX)}
            y={26}
            width={COL.bandW}
            height={VB_H - 36}
            rx={14}
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* 1) Synapses under everything */}
          <g>
            {edges.map((e) => {
              const a = byId.get(e.from)!;
              const b = byId.get(e.to)!;
              const hot = pathway?.edges.has(e.id) ?? false;
              const dim = pathway != null && !hot;
              const d = synapsePath(a, b);

              return (
                <g
                  key={e.id}
                  style={{
                    opacity: dim ? 0.07 : hot ? 1 : 0.42,
                    transition: "opacity 160ms ease",
                  }}
                >
                  <path
                    d={d}
                    fill="none"
                    stroke={hot ? `url(#${uid}-hot)` : `url(#${uid}-syn)`}
                    strokeWidth={hot ? 1.7 : 0.9}
                  />
                  {hot && !reduced && (
                    <circle r="2" fill="#82D153" filter={`url(#${uid}-glow)`}>
                      <animateMotion dur="1.35s" repeatCount="indefinite" path={d} />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* 2) Neuron circles */}
          <g>
            {nodes.map((n, i) => {
              const lit = pathway == null || pathway.nodes.has(n.id);
              const hot = hoverId === n.id;
              const isHidden = n.kind === "hidden";
              const label = labelOf(n);

              return (
                <motion.g
                  key={n.id}
                  initial={reduced ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: lit ? 1 : 0.22, scale: hot ? 1.05 : 1 }}
                  transition={{ duration: 0.18, delay: i * 0.012, ease: EASE_OUT }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px`, cursor: "pointer" }}
                  onMouseEnter={() => onEnter(n.id)}
                  onMouseLeave={onLeave}
                  onFocus={() => onEnter(n.id)}
                  onBlur={onLeave}
                  tabIndex={0}
                  role="button"
                  aria-label={label}
                >
                  {/* Invisible hit area so labels stay clickable too */}
                  {!isHidden && (
                    <rect
                      x={n.kind === "source" ? COL.leftLabelX - 120 : n.x - n.r}
                      y={n.y - 12}
                      width={n.kind === "source" ? n.x - (COL.leftLabelX - 120) + n.r : COL.rightLabelX - n.x + 120}
                      height={24}
                      fill="transparent"
                    />
                  )}

                  {hot && !reduced && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.r + 6}
                      fill="none"
                      stroke="#82D153"
                      strokeWidth="1"
                      opacity="0.35"
                    />
                  )}

                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={hot ? n.r + 1.25 : n.r}
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
                    strokeWidth={hot || isHidden ? 1.85 : 1.25}
                    filter={hot ? `url(#${uid}-glow)` : undefined}
                  />
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isHidden ? 0 : 2.6}
                    fill={hot ? "#82D153" : n.kind === "output" ? "#4ade80" : "#94a3b8"}
                  />

                  {/* QAI labels live INSIDE the hub nodes — no below-node collision */}
                  {isHidden && (
                    <text
                      x={n.x}
                      y={n.y + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.02em" }}
                    >
                      {label}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </g>

          {/* 3) Side labels drawn last so they never sit under edges */}
          <g style={{ pointerEvents: "none" }}>
            {nodes
              .filter((n) => n.kind !== "hidden")
              .map((n) => {
                const lit = pathway == null || pathway.nodes.has(n.id);
                const hot = hoverId === n.id;
                const label = labelOf(n);
                const isSource = n.kind === "source";

                return (
                  <text
                    key={`label-${n.id}`}
                    x={isSource ? COL.leftLabelX : COL.rightLabelX}
                    y={n.y}
                    textAnchor={isSource ? "end" : "start"}
                    dominantBaseline="central"
                    fill={
                      !lit
                        ? "#94a3b8"
                        : hot
                          ? "#0f172a"
                          : isSource
                            ? "#334155"
                            : "#166534"
                    }
                    style={{
                      fontSize: 11,
                      fontWeight: hot ? 700 : 600,
                      opacity: lit ? 1 : 0.35,
                    }}
                  >
                    {label}
                  </text>
                );
              })}
          </g>
        </svg>
      </div>
    </div>
  );
}
