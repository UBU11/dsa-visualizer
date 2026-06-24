// lib/algorithms/dfsGraph.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

const NODES = [
  { id: "A", label: "A", x: 0.5, y: 0.1 },
  { id: "B", label: "B", x: 0.2, y: 0.4 },
  { id: "C", label: "C", x: 0.8, y: 0.4 },
  { id: "D", label: "D", x: 0.3, y: 0.75 },
  { id: "E", label: "E", x: 0.7, y: 0.75 },
];
const EDGES: { from: string; to: string }[] = [
  { from: "A", to: "B" },
  { from: "A", to: "C" },
  { from: "B", to: "D" },
  { from: "C", to: "E" },
  { from: "D", to: "E" },
];

export const dfsGraph: AlgorithmDefinition = {
  id: "dfs-graph",
  name: "DFS on Graph",
  category: "Graphs",
  structure: "graph",
  summary: "Recursive DFS from a source. Stack visualized in inspector; nodes go pointer→compare→sorted.",
  pseudocode: [
    { line: 1, text: "dfs(u):" },
    { line: 2, text: "  visit(u)" },
    { line: 3, text: "  for v in neighbors(u):" },
    { line: 4, text: "    if v not visited: dfs(v)" },
  ],
  configFields: [
    {
      key: "start",
      label: "Start node",
      kind: "select",
      default: "A",
      options: NODES.map((n) => ({ value: n.id, label: n.label })),
    },
  ],
  run(cfg) {
    const startId = String(cfg.start || "A");
    const nodes: GraphNodeSnapshot[] = NODES.map((n) => ({ ...n }));
    const edges: GraphEdgeSnapshot[] = EDGES.map((e, i) => ({
      id: `e${i}`,
      fromId: e.from,
      toId: e.to,
      directed: true,
    }));
    const adj = new Map<string, string[]>();
    for (const n of NODES) adj.set(n.id, []);
    for (const e of EDGES) adj.get(e.from)!.push(e.to);

    const rec = createRecorder({
      index: 0,
      title: "Graph + start",
      currentLine: 1,
      graphNodes: nodes,
      graphEdges: edges,
      graphHighlights: { [startId]: "pointer" },
      variables: [
        { name: "stack", value: `[${startId}]`, kind: "pointer" },
        { name: "start", value: startId, kind: "pointer" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const visited = new Set<string>();
    const order: string[] = [];
    const stack: string[] = [startId];

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
        variables: [...vars, { name: "stack", value: `[${stack.join(", ")}]`, kind: "state" }],
        comparisons: visited.size,
        swaps: 0,
        writes: 0,
      });
    };

    while (stack.length) {
      const u = stack.pop()!;
      if (visited.has(u)) continue;
      visited.add(u);
      order.push(u);
      snap({ [u]: "compare" }, `visit ${u}`, 2, [{ name: "u", value: u, kind: "pointer", highlight: true }]);
      const neighbors = adj.get(u) ?? [];
      // Push in reverse so the first neighbor pops first.
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const v = neighbors[i];
        if (!visited.has(v)) {
          stack.push(v);
          snap({ [u]: "sorted", [v]: "pointer" }, `push ${v}`, 4, [
            { name: "u", value: u, kind: "pointer" },
            { name: "v", value: v, kind: "pointer", highlight: true },
          ]);
        }
      }
    }

    pushStep(rec, {
      title: "DFS complete ✓",
      description: `order: ${order.join(" → ")}`,
      currentLine: 4,
      graphNodes: nodes,
      graphEdges: edges,
      graphHighlights: Object.fromEntries(nodes.map((n) => [n.id, "sorted" as const])),
      variables: [{ name: "order", value: order.join(" → "), kind: "pointer", highlight: true }],
      comparisons: visited.size,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};