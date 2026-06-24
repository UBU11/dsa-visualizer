// lib/algorithms/dijkstra.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

const NODES = [
  { id: "A", label: "A", x: 0.5, y: 0.1 },
  { id: "B", label: "B", x: 0.18, y: 0.45 },
  { id: "C", label: "C", x: 0.82, y: 0.45 },
  { id: "D", label: "D", x: 0.32, y: 0.85 },
  { id: "E", label: "E", x: 0.68, y: 0.85 },
];
const EDGES: { from: string; to: string; w: number }[] = [
  { from: "A", to: "B", w: 4 },
  { from: "A", to: "C", w: 2 },
  { from: "B", to: "D", w: 5 },
  { from: "C", to: "B", w: 1 },
  { from: "C", to: "E", w: 8 },
  { from: "D", to: "E", w: 2 },
];

export const dijkstra: AlgorithmDefinition = {
  id: "dijkstra",
  name: "Dijkstra Shortest Path",
  category: "Graphs",
  structure: "graph",
  summary: "Greedy shortest path from source. Visited nodes turn emerald; distance label updates live.",
  pseudocode: [
    { line: 1, text: "dist[start] ← 0, dist[others] ← ∞" },
    { line: 2, text: "while unvisited:" },
    { line: 3, text: "  u ← unvisited with min dist" },
    { line: 4, text: "  for each neighbor v of u:" },
    { line: 5, text: "    if dist[u]+w(u,v) < dist[v]: update" },
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
    const adj = new Map<string, { to: string; w: number }[]>();
    for (const n of NODES) adj.set(n.id, []);
    for (const e of EDGES) adj.get(e.from)!.push({ to: e.to, w: e.w });

    const dist: Record<string, number> = {};
    for (const n of NODES) dist[n.id] = Infinity;
    dist[startId] = 0;

    const rec = createRecorder({
      index: 0,
      title: "Init distances",
      currentLine: 1,
      graphNodes: nodes,
      graphEdges: edges,
      graphHighlights: { [startId]: "pointer" },
      variables: NODES.map((n) => ({
        name: `dist[${n.id}]`,
        value: dist[n.id] === Infinity ? "∞" : dist[n.id],
        kind: "number" as const,
        highlight: n.id === startId,
      })),
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const visited = new Set<string>();
    const order: string[] = [];

    const snap = (
      hi: Record<string, "compare" | "pointer" | "sorted" | "visited" | "mutate">,
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
        comparisons: visited.size,
        swaps: 0,
        writes: 0,
      });
    };

    while (visited.size < NODES.length) {
      // pick unvisited with min dist
      let u: string | null = null;
      for (const n of NODES) {
        if (visited.has(n.id)) continue;
        if (u === null || dist[n.id] < dist[u]) u = n.id;
      }
      if (u === null || dist[u] === Infinity) break;
      snap({ [u]: "compare" }, `pick ${u} (dist=${dist[u]})`, 3, [
        { name: "u", value: u, kind: "pointer", highlight: true },
        { name: "dist[u]", value: dist[u], kind: "number" },
      ]);
      visited.add(u);
      order.push(u);
      const neighbors = adj.get(u) ?? [];
      for (const { to: v, w } of neighbors) {
        if (visited.has(v)) continue;
        const cand = dist[u] + w;
        snap(
          { [u]: "sorted", [v]: "compare" },
          `relax ${u}→${v}: ${dist[u]}+${w}=${cand} vs ${dist[v] === Infinity ? "∞" : dist[v]}`,
          5,
          [
            { name: "u", value: u, kind: "pointer" },
            { name: "v", value: v, kind: "pointer", highlight: true },
            { name: "candidate", value: cand, kind: "number" },
          ],
        );
        if (cand < dist[v]) {
          dist[v] = cand;
          snap(
            { [v]: "mutate" },
            `update dist[${v}] = ${cand}`,
            5,
            [
              { name: "dist[v]", value: cand, kind: "pointer", highlight: true },
              { name: "prev", value: dist[v], kind: "number" },
            ],
          );
        }
      }
    }

    pushStep(rec, {
      title: "Done ✓",
      description: Object.entries(dist)
        .map(([k, v]) => `${k}=${v === Infinity ? "∞" : v}`)
        .join(", "),
      currentLine: 5,
      graphNodes: nodes,
      graphEdges: edges,
      graphHighlights: Object.fromEntries(nodes.map((n) => [n.id, "sorted" as const])),
      variables: NODES.map((n) => ({
        name: `dist[${n.id}]`,
        value: dist[n.id] === Infinity ? "∞" : dist[n.id],
        kind: "number" as const,
      })),
      comparisons: visited.size,
      swaps: 0,
      writes: visited.size,
    });
    return rec.steps;
  },
};