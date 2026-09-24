"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildBomTree, flattenBomTree } from "@/lib/bom/graph";
import type { BomItem, BomTreeNode } from "@/lib/bom/types";

const ROW_HEIGHT = 40;

type Props = {
  items: BomItem[];
  selectedId: string | null;
  onSelect: (item: BomItem) => void;
};

export function BomTree({ items, selectedId, onSelect }: Props) {
  const roots = useMemo(() => buildBomTree(items), [items]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(roots.map((r) => r.id)));
  const [scrollTop, setScrollTop] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(480);

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const r of roots) next.add(r.id);
      return next;
    });
  }, [roots]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight || 480));
    ro.observe(el);
    setViewportHeight(el.clientHeight || 480);
    return () => ro.disconnect();
  }, []);

  const flat = useMemo(() => flattenBomTree(roots, expanded), [roots, expanded]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
  const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + 10;
  const slice = flat.slice(start, start + visibleCount);
  const offsetY = start * ROW_HEIGHT;

  return (
    <div
      ref={viewportRef}
      className="h-[min(70vh,640px)] overflow-auto rounded-xl border border-border bg-background"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: flat.length * ROW_HEIGHT, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {slice.map((node) => (
            <BomRow
              key={node.id}
              node={node}
              selected={selectedId === node.id}
              expanded={expanded.has(node.id)}
              onToggle={() => toggle(node.id)}
              onSelect={() => onSelect(node)}
            />
          ))}
        </div>
      </div>
      {flat.length === 0 && (
        <p className="p-6 text-sm text-muted-foreground">
          No BOM items yet. Add a line or import a CSV / Excel file.
        </p>
      )}
    </div>
  );
}

function BomRow({
  node,
  selected,
  expanded,
  onToggle,
  onSelect,
}: {
  node: BomTreeNode;
  selected: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const hasChildren = node.children.length > 0;
  return (
    <div
      role="treeitem"
      aria-selected={selected}
      aria-expanded={hasChildren ? expanded : undefined}
      style={{ height: ROW_HEIGHT, paddingLeft: 12 + node.depth * 18 }}
      className={cn(
        "flex cursor-pointer items-center gap-2 border-b border-border/60 pr-3 text-sm hover:bg-muted/40",
        selected && "bg-[#82D153]/10"
      )}
      onClick={onSelect}
    >
      <button
        type="button"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground"
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) onToggle();
        }}
        aria-label={expanded ? "Collapse" : "Expand"}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        ) : (
          <span className="h-4 w-4" />
        )}
      </button>
      <span className="w-28 shrink-0 truncate font-mono text-xs text-muted-foreground">{node.partNumber}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{node.description || node.partNumber}</span>
      <span className="w-24 shrink-0 text-right tabular-nums text-muted-foreground">
        {node.quantity} {node.unit}
      </span>
      <span className="hidden w-20 shrink-0 text-right text-xs uppercase text-muted-foreground sm:block">
        {node.itemType}
      </span>
    </div>
  );
}
