// lib/algorithms/treeInorder.ts
// Build a fixed BST, then in-order traverse it. Visited nodes turn emerald in order.

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

interface N { id: string; v: number; l: N | null; r: N | null; }

function layout(root: N | null): { nodes: { id: string; value: number; x: number; y: number; parentId: string | null }[]; edges: { id: string; fromId: string; toId: string }[] } {
  const nodes: { id: string; value: number; x: number; y: number; parentId: string | null }[] = [];
  const edges: { id: string; fromId: string; toId: string }[] = [];
  if (!root) return { nodes, edges };
  const idx = new Map<string, number>();
  let i = 0;
  const ino = (n: N | null) => {
    if (!n) return;
    ino(n.l);
    idx.set(n.id, i++);
    ino(n.r);
  };
  ino(root);
  const dep = new Map<string, number>();
  const d = (n: N | null, k: number) => {
    if (!n) return;
    dep.set(n.id, k);
    d(n.l, k + 1);
    d(n.r, k + 1);
  };
  d(root, 0);
  const per = new Map<number, number>();
  for (const v of dep.values()) per.set(v, (per.get(v) ?? 0) + 1);
  const slot = new Map<string, number>();
  const seen = new Map<number, number>();
  const walk = (n: N | null) => {
    if (!n) return;
    const row = per.get(dep.get(n.id)!);
    const col = seen.get(dep.get(n.id)!) ?? 0;
    slot.set(n.id, col);
    seen.set(dep.get(n.id)!, col + 1);
    walk(n.l);
    walk(n.r);
  };
  walk(root);
  const maxD = Math.max(...Array.from(dep.values()));
  const b = (n: N | null, p: string | null) => {
    if (!n) return;
    const d0 = dep.get(n.id)!;
    const row = per.get(d0)!;
    const col = slot.get(n.id)!;
    nodes.push({ id: n.id, value: n.v, x: (col + 0.5) / row, y: maxD === 0 ? 0.5 : 0.08 + (d0 / maxD) * 0.78, parentId: p });
    if (p) edges.push({ id: `e-${p}-${n.id}`, fromId: p, toId: n.id });
    b(n.l, n.id);
    b(n.r, n.id);
  };
  b(root, null);
  return { nodes, edges };
}

export const treeInorder: AlgorithmDefinition = {
  id: "tree-inorder",
  name: "Tree Inorder Traversal",
  category: "Trees",
  structure: "tree",
  summary: "Build a fixed BST, then walk in-order (left, root, right). Each visit turns the node emerald.",
  pseudocode: [
    { line: 1, text: "inorder(node):" },
    { line: 2, text: "  if node == null: return" },
    { line: 3, text: "  inorder(node.left)" },
    { line: 4, text: "  visit(node)" },
    { line: 5, text: "  inorder(node.right)" },
  ],
  configFields: [
    { key: "keys", label: "Keys (CSV)", kind: "text", default: "50,30,70,20,40,60,80,10,35,65" },
  ],
  run(cfg) {
    const raw = String(cfg.keys || "50,30,70,20,40,60,80,10,35,65")
      .split(",")
      .map((k) => parseInt(k.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    const counter = { n: 0 };
    const mk = (v: number): N => ({ id: `n${counter.n++}-${v}`, v, l: null, r: null });
    const insert = (root: N | null, v: number): N => {
      if (!root) return mk(v);
      if (v < root.v) root.l = insert(root.l, v);
      else if (v > root.v) root.r = insert(root.r, v);
      return root;
    };
    let root: N | null = null;
    for (const k of raw) root = insert(root, k);
    const init = layout(root);
    const rec = createRecorder({
      index: 0,
      title: "Tree built",
      currentLine: 1,
      treeNodes: init.nodes,
      treeEdges: init.edges,
      treeHighlights: {},
      variables: [],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    const visited = new Set<string>();
    const order: number[] = [];

    const visit = (n: N) => {
      const lt = layout(root);
      const hi: Record<string, "compare" | "pointer" | "sorted"> = {
        [n.id]: "pointer",
      };
      for (const v of visited) hi[v] = "sorted";
      pushStep(rec, {
        title: `visit ${n.v}`,
        currentLine: 4,
        treeNodes: lt.nodes,
        treeEdges: lt.edges,
        treeHighlights: hi,
        variables: [{ name: "node", value: n.v, kind: "pointer", highlight: true }],
        comparisons: visited.size,
        swaps: 0,
        writes: 0,
      });
      visited.add(n.id);
      order.push(n.v);
      const lt2 = layout(root);
      const hi2: Record<string, "sorted"> = {};
      for (const v of visited) hi2[v] = "sorted";
      pushStep(rec, {
        title: `visited ${n.v} → output`,
        currentLine: 4,
        treeNodes: lt2.nodes,
        treeEdges: lt2.edges,
        treeHighlights: hi2,
        variables: [{ name: "output", value: order.join(", "), kind: "pointer", highlight: true }],
        comparisons: visited.size,
        swaps: 0,
        writes: 0,
      });
    };

    const ino = (n: N | null) => {
      if (!n) return;
      ino(n.l);
      visit(n);
      ino(n.r);
    };
    ino(root);

    const lt = layout(root);
    pushStep(rec, {
      title: "Traversal complete ✓",
      description: order.join(" → "),
      currentLine: 5,
      treeNodes: lt.nodes,
      treeEdges: lt.edges,
      treeHighlights: Object.fromEntries(lt.nodes.map((n) => [n.id, "sorted" as const])),
      variables: [{ name: "order", value: order.join(" → "), kind: "pointer", highlight: true }],
      comparisons: visited.size,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};