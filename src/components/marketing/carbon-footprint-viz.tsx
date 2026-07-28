"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type NodeKind = "input" | "process" | "agent" | "output";

type GraphNode = {
  id: string;
  col: 0 | 1 | 2 | 3;
  row: number;
  kind: NodeKind;
  code: string;
  title: string;
  metric: string;
  detail?: string;
  alert?: boolean;
};

type GraphEdge = { from: string; to: string };

const LAYERS = ["INGEST", "PARSE", "INFER", "ACT"] as const;
const COL_X = [12.5, 37.5, 62.5, 87.5] as const;

const COLUMNS: { col: 0 | 1 | 2 | 3; nodeIds: string[] }[] = [
  { col: 0, nodeIds: ["erp", "utility", "travel", "supplier"] },
  { col: 1, nodeIds: ["ef", "scope", "norm"] },
  { col: 2, nodeIds: ["anomaly", "gnn", "csrd"] },
  { col: 3, nodeIds: ["footprint", "reduce", "lineage"] },
];

const NODE_DATA: Record<
  string,
  Omit<GraphNode, "col" | "row"> & { col: 0 | 1 | 2 | 3; row: number }
> = {
  erp: { id: "erp", col: 0, row: 0, kind: "input", code: "N01", title: "ERP export", metric: "12.4k rows" },
  utility: { id: "utility", col: 0, row: 1, kind: "input", code: "N02", title: "Utility bills", metric: "847 inv" },
  travel: { id: "travel", col: 0, row: 2, kind: "input", code: "N03", title: "Travel ledger", metric: "2.1k trips" },
  supplier: { id: "supplier", col: 0, row: 3, kind: "input", code: "N04", title: "Supplier CSV", metric: "156 vendors" },

  ef: { id: "ef", col: 1, row: 0, kind: "process", code: "H01", title: "EF matcher", metric: "500k+ DB" },
  scope: { id: "scope", col: 1, row: 1, kind: "process", code: "H02", title: "Scope classifier", metric: "99.2%" },
  norm: { id: "norm", col: 1, row: 2, kind: "process", code: "H03", title: "Unit normalizer", metric: "tCO₂e" },

  anomaly: { id: "anomaly", col: 2, row: 0, kind: "agent", code: "A01", title: "Anomaly net", metric: "3 flags", alert: true },
  gnn: { id: "gnn", col: 2, row: 1, kind: "agent", code: "A02", title: "Supply GNN", metric: "Tier 2" },
  csrd: { id: "csrd", col: 2, row: 2, kind: "agent", code: "A03", title: "CSRD engine", metric: "E1–E5" },

  footprint: { id: "footprint", col: 3, row: 0, kind: "output", code: "O01", title: "Live footprint", metric: "40.5k" },
  reduce: { id: "reduce", col: 3, row: 1, kind: "output", code: "O02", title: "Abatement AI", metric: "−23.8%" },
  lineage: { id: "lineage", col: 3, row: 2, kind: "output", code: "O03", title: "Audit trail", metric: "100%" },
};

const EDGES: GraphEdge[] = [
  { from: "erp", to: "ef" },
  { from: "erp", to: "scope" },
  { from: "utility", to: "ef" },
  { from: "utility", to: "norm" },
  { from: "travel", to: "scope" },
  { from: "travel", to: "norm" },
  { from: "supplier", to: "scope" },
  { from: "supplier", to: "gnn" },
  { from: "ef", to: "anomaly" },
  { from: "ef", to: "gnn" },
  { from: "scope", to: "anomaly" },
  { from: "scope", to: "csrd" },
  { from: "norm", to: "gnn" },
  { from: "norm", to: "csrd" },
  { from: "anomaly", to: "footprint" },
  { from: "anomaly", to: "reduce" },
  { from: "gnn", to: "footprint" },
  { from: "gnn", to: "lineage" },
  { from: "csrd", to: "footprint" },
  { from: "csrd", to: "lineage" },
  { from: "csrd", to: "reduce" },
];

/** Evenly space nodes vertically within the graph area */
function nodePosition(node: GraphNode, colCount: number): { x: number; y: number } {
  const x = COL_X[node.col];
  const top = 6;
  const bottom = 94;
  const range = bottom - top;
  const y = colCount === 1 ? 50 : top + (node.row / (colCount - 1)) * range;
  return { x, y };
}

function buildNodes(): GraphNode[] {
  return COLUMNS.flatMap(({ col, nodeIds }) =>
    nodeIds.map((id) => {
      const data = NODE_DATA[id];
      return { ...data, col, row: data.row };
    })
  );
}

const NODES = buildNodes();
const NODE_MAP = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, GraphNode>;
const COL_ROW_COUNT = Object.fromEntries(COLUMNS.map((c) => [c.col, c.nodeIds.length])) as Record<number, number>;

const KIND_STYLES: Record<NodeKind, { ring: string; bg: string; dot: string }> = {
  input: { ring: "border-slate-200", bg: "bg-white", dot: "bg-slate-400" },
  process: { ring: "border-brand/30", bg: "bg-brand-light/50", dot: "bg-brand" },
  agent: { ring: "border-violet-200", bg: "bg-violet-50/80", dot: "bg-violet-500" },
  output: { ring: "border-emerald-200", bg: "bg-emerald-50/80", dot: "bg-emerald-500" },
};

function edgePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function GraphNodeCard({
  node,
  active,
  dimmed,
  onHover,
}: {
  node: GraphNode;
  active: boolean;
  dimmed: boolean;
  onHover: (id: string | null) => void;
}) {
  const s = KIND_STYLES[node.kind];

  return (
    <button
      type="button"
      className={cn(
        "w-full max-w-[108px] shrink-0 rounded border text-left shadow-sm transition-all duration-200",
        s.ring,
        s.bg,
        active && "z-20 scale-[1.02] border-brand/50 shadow-md ring-1 ring-brand/20",
        dimmed && "opacity-30",
        !active && !dimmed && "opacity-100 hover:shadow-md"
      )}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
    >
      <div className="flex items-center gap-1 border-b border-black/[0.04] px-2 py-1">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} />
        <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">{node.code}</span>
        {node.alert && <span className="ml-auto text-[8px] font-bold text-amber-600">!</span>}
      </div>
      <div className="px-2 py-1.5">
        <p className="text-[10px] font-semibold leading-tight text-foreground">{node.title}</p>
        <p className="mt-0.5 font-mono text-[10px] font-bold tabular-nums text-brand-dark">{node.metric}</p>
      </div>
    </button>
  );
}

/** Neural emissions intelligence graph */
export function EmissionsNetworkViz() {
  const reduced = useReducedMotion();
  const [hoverId, setHoverId] = useState<string | null>(null);

  const connected = useMemo(() => {
    if (!hoverId) return new Set<string>();
    const set = new Set<string>([hoverId]);
    EDGES.forEach((e) => {
      if (e.from === hoverId) set.add(e.to);
      if (e.to === hoverId) set.add(e.from);
    });
    return set;
  }, [hoverId]);

  const activeEdgeIndices = useMemo(() => {
    if (!hoverId) return new Set<number>();
    return new Set(
      EDGES.map((e, i) => (e.from === hoverId || e.to === hoverId ? i : -1)).filter((i) => i >= 0)
    );
  }, [hoverId]);

  const activeNode = hoverId ? NODE_MAP[hoverId] : null;

  return (
    <div className="relative z-10 w-full pr-4 sm:pr-8 lg:pr-14 xl:pr-16">
      <div className="relative w-full overflow-hidden rounded-md border border-border bg-white shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-3 py-2 sm:px-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Inference engine</p>
            <p className="font-mono text-[10px] font-semibold text-brand-dark">v2.4 · live</p>
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">847 calc/s</span>
          </div>
        </div>

        {/* Graph canvas */}
        <div className="relative min-h-[400px] w-full sm:min-h-[440px] lg:min-h-[480px]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(130,209,83,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(130,209,83,0.025)_1px,transparent_1px)] bg-[size:20px_20px]" />

          {/* Layer labels */}
          <div className="pointer-events-none absolute inset-x-0 top-2 z-10 grid grid-cols-4 px-2">
            {LAYERS.map((label) => (
              <span
                key={label}
                className="text-center font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground/55 sm:text-[9px]"
              >
                {label}
              </span>
            ))}
          </div>

          {/* Column dividers + edges */}
          <div className="absolute inset-x-0 bottom-2 top-9">
            <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-r border-dashed border-border/35 last:border-r-0" />
              ))}
            </div>

            <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
              {EDGES.map((edge, i) => {
                const from = NODE_MAP[edge.from];
                const to = NODE_MAP[edge.to];
                if (!from || !to) return null;

                const p1 = nodePosition(from, COL_ROW_COUNT[from.col]);
                const p2 = nodePosition(to, COL_ROW_COUNT[to.col]);
                const d = edgePath(p1.x, p1.y, p2.x, p2.y);
                const isActive = hoverId === null || activeEdgeIndices.has(i);
                const isHighlighted = hoverId !== null && activeEdgeIndices.has(i);

                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <path
                      d={d}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth={isHighlighted ? 0.5 : 0.3}
                      opacity={isActive ? (isHighlighted ? 1 : 0.5) : 0.1}
                    />
                    {isHighlighted && !reduced && (
                      <motion.path
                        d={d}
                        fill="none"
                        stroke="hsl(98 70% 45%)"
                        strokeWidth={0.4}
                        strokeDasharray="2 4"
                        animate={{ strokeDashoffset: [0, -12] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                        opacity={0.85}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Node columns — flex grid, evenly spaced */}
            <div className="relative grid h-full grid-cols-4 gap-0 px-1 pb-1 pt-1 sm:px-2">
              {COLUMNS.map(({ col, nodeIds }) => (
                <div
                  key={col}
                  className="flex h-full flex-col items-center justify-between gap-2 py-2 sm:gap-3 sm:py-3"
                >
                  {nodeIds.map((id) => {
                    const node = NODE_MAP[id];
                    if (!node) return null;
                    return (
                      <GraphNodeCard
                        key={id}
                        node={node}
                        active={hoverId === id}
                        dimmed={hoverId !== null && !connected.has(id)}
                        onHover={setHoverId}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {(["input", "process", "agent", "output"] as NodeKind[]).map((k) => (
              <div key={k} className="flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", KIND_STYLES[k].dot)} />
                <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">{k}</span>
              </div>
            ))}
          </div>
          <p className="min-h-[14px] truncate font-mono text-[8px] text-muted-foreground sm:max-w-[50%] sm:text-right">
            {activeNode ? (
              <>
                <span className="font-semibold text-foreground">{activeNode.code}</span> · {activeNode.title} →{" "}
                <span className="text-brand-dark">{activeNode.metric}</span>
              </>
            ) : (
              <span className="uppercase tracking-[0.15em] opacity-60">Fig. 01 — Emissions neural mesh</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
