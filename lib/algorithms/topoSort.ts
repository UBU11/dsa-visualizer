// lib/algorithms/topoSort.ts — Kahn's algorithm

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

const NODES = [
  { id: "A", label: "A", x: 0.15, y: 0.15 },
  { id: "B", label: "B", x: 0.5, y: 0.15 },
  { id: "C", label: "C", x: 0.85, y: 0.15 },
  { id: "D", label: "D", x: 0.32, y: 0.55 },
  { id: "E", label: "E", x: 0.68, y: 0.55 },
  { id: "F", label: "F", x: 0.5, y: 0.85 },
];
const EDGES: { from: string; to: string }[] = [
  { from: "A", to: "D" },
  { from: "B", to: "D" },
  { from: "B", to: "E" },
  { from: "C", to: "E" },
  { from: "D", to: "F" },
  { from: "E", to: "F" },
];

export const topoSort: AlgorithmDefinition = {
  id: "topo-sort",
  name: "Topological Sort (Kahn)",
  category: "Graphs",
  structure: "graph",
  summary: "Repeatedly pick a node with indegree 0, append to output, and reduce neighbors' indegree.",
  pseudocode: [
    { line: 1, text: "compute indegree of every node" },
    { line: 2, text: "queue ← nodes with indegree 0" },
    { line: 3, text: "while queue not empty:" },
    { line: 4, text: "  u ← queue.dequeue()" },
    { line: 5, text: "  output.append(u)" },
    { line: 6, text: "  for v in neighbors(u): indegree[v]--; if 0: enqueue" },
  ],
  configFields: [],
  run() {
    const nodes: GraphNodeSnapshot[] = NODES.map((n) => ({ ...n }));
    const edges: GraphEdgeSnapshot[] = EDGES.map((e, i) => ({
      id: `e${i}`,
      fromId: e.from,
      toId: e.to,
      directed: true,
    }));
    const adj = new Map<string, string[]>();
    for (const n of NODES) adj.set(n.id, []);
    const indeg: Record<string, number> = {};
    for (const n of NODES) indeg[n.id] = 0;
    for (const e of EDGES) {
      adj.get(e.from)!.push(e.to);
      indeg[e.to]++;
    }
    const queue: string[] = [];
    for (const n of NODES) if (indeg[n.id] === 0) queue.push(n.id);

    const rec = createRecorder({
      index: 0,
      title: "Init indegrees",
      currentLine: 1,
      graphNodes: nodes,
      graphEdges: edges,
      graphHighlights: {},
      variables: [
        ...NODES.map((n) => ({
          name: `indeg[${n.id}]`,
          value: indeg[n.id],
          kind: "number" as const,
        })),
        { name: "queue", value: `[${queue.join(", ")}]`, kind: "pointer" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const order: string[] = [];
    const snap = (
      hi: Record<string, "compare" | "pointer" | "sorted" | "visited">,
      title: string,
      line: number,
      vars: { name: string; value: number | string; kind?: "number" | "pointer" | "state"; highlight?: boolean }[],
    ) => {
      pushStep(rec, {
        title,
        currentLine: line,
        graphNodes: nodes,
        graphEdges: edges,
        graphHighlights: { ...Object.fromEntries(order.map((o) => [o, "sorted" as const])), ...hi },
        variables: vars,
        comparisons: order.length,
        swaps: 0,
        writes: 0,
      });
    };

    while (queue.length) {
      const u = queue.shift()!;
      snap({ [u]: "compare" }, `dequeue ${u}`, 4, [{ name: "u", value: u, kind: "pointer", highlight: true }]);
      order.push(u);
      for (const v of adj.get(u) ?? []) {
        indeg[v]--;
        snap({ [u]: "sorted", [v]: "compare" }, `decrement indeg[${v}] → ${indeg[v]}`, 6, [
          { name: "v", value: v, kind: "pointer", highlight: true },
          { name: "indeg[v]", value: indeg[v], kind: "number" },
        ]);
        if (indeg[v] === 0) {
          queue.push(v);
          snap({ [v]: "pointer" }, `enqueue ${v}`, 6, [
            { name: "queue", value: `[${queue.join(", ")}]`, kind: "pointer", highlight: true },
            { name: "v", value: v, kind: "pointer" },
          ]);
        }
      }
    }

    pushStep(rec, {
      title: "Done ✓",
      description: order.join(" → "),
      currentLine: 6,
      graphNodes: nodes,
      graphEdges: edges,
      graphHighlights: Object.fromEntries(nodes.map((n) => [n.id, "sorted" as const])),
      variables: [
        { name: "topo order", value: order.join(" → "), kind: "pointer", highlight: true },
      ],
      comparisons: order.length,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};