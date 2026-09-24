import type { BomIssue, BomItem, BomTreeNode } from "./types";

export function detectCycles(items: BomItem[]): BomIssue[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const issues: BomIssue[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(id: string, stack: string[]) {
    if (visiting.has(id)) {
      const cycleStart = stack.indexOf(id);
      const path = cycleStart >= 0 ? stack.slice(cycleStart).concat(id) : stack.concat(id);
      issues.push({
        code: "CIRCULAR_BOM",
        message: `Circular BOM reference: ${path
          .map((pid) => byId.get(pid)?.partNumber ?? pid)
          .join(" → ")}`,
        itemId: id,
        partNumber: byId.get(id)?.partNumber,
      });
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    stack.push(id);
    for (const kid of items.filter((i) => i.parentItemId === id)) {
      dfs(kid.id, stack);
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }

  for (const item of items) {
    if (!visited.has(item.id)) dfs(item.id, []);
  }
  return issues;
}

export function findOrphans(items: BomItem[]): BomIssue[] {
  const ids = new Set(items.map((i) => i.id));
  const issues: BomIssue[] = [];
  for (const item of items) {
    if (item.parentItemId && !ids.has(item.parentItemId)) {
      issues.push({
        code: "ORPHAN_ITEM",
        message: `Parent ${item.parentItemId} not found for ${item.partNumber}`,
        itemId: item.id,
        partNumber: item.partNumber,
      });
    }
  }
  return issues;
}

export function buildBomTree(items: BomItem[]): BomTreeNode[] {
  const nodes = new Map<string, BomTreeNode>();
  for (const item of items) {
    nodes.set(item.id, { ...item, depth: 0, children: [] });
  }
  const roots: BomTreeNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentItemId && nodes.has(node.parentItemId)) {
      nodes.get(node.parentItemId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function sortAndDepth(list: BomTreeNode[], depth: number) {
    list.sort((a, b) => a.sequenceNo - b.sequenceNo || a.partNumber.localeCompare(b.partNumber));
    for (const n of list) {
      n.depth = depth;
      sortAndDepth(n.children, depth + 1);
    }
  }
  sortAndDepth(roots, 0);
  return roots;
}

export function flattenBomTree(roots: BomTreeNode[], expandedIds: Set<string>): BomTreeNode[] {
  const out: BomTreeNode[] = [];
  function walk(nodes: BomTreeNode[]) {
    for (const n of nodes) {
      out.push(n);
      if (n.children.length > 0 && expandedIds.has(n.id)) walk(n.children);
    }
  }
  walk(roots);
  return out;
}

export function countDescendants(node: BomTreeNode): number {
  let n = 0;
  for (const c of node.children) n += 1 + countDescendants(c);
  return n;
}
