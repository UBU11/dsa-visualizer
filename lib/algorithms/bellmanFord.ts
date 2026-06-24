// lib/algorithms/bellmanFord.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
  VariableFrame,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

// Fixed graph layout representing a small network with positive and negative weights.
const NODES = [
  { id: "A", label: "A", x: 0.15, y: 0.5 },
  { id: "B", label: "B", x: 0.5, y: 0.15 },
  { id: "C", label: "C", x: 0.5, y: 0.85 },
  { id: "D", label: "D", x: 0.85, y: 0.5 },
];

const EDGES: { from: string; to: string; w: number }[] = [
  { from: "A", to: "B", w: 4 },
  { from: "A", to: "C", w: 3 },
  { from: "B", to: "C", w: -2 }, // negative edge B -> C
  { from: "C", to: "D", w: 3 },
  { from: "B", to: "D", w: 2 },
];

export const bellmanFord: AlgorithmDefinition = {
  id: "bellman-ford",
  name: "Bellman-Ford Algorithm",
  category: "Graphs",
  structure: "graph",
  summary:
    "Computes shortest paths from a single source node. Supports negative edge weights and can detect negative cycles.",
  pseudocode: [
    { line: 1, text: "dist[start] ← 0, dist[others] ← ∞" },
    { line: 2, text: "repeat V-1 times:" },
    { line: 3, text: "  for each edge (u, v) with weight w:" },
    { line: 4, text: "    if dist[u] + w < dist[v]:" },
    { line: 5, text: "      dist[v] ← dist[u] + w" },
    { line: 6, text: "check for negative cycles (V-th iteration)" },
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
      weight: e.w,
    }));

    const dist: Record<string, number> = {};
    for (const n of NODES) dist[n.id] = Infinity;
    dist[startId] = 0;

    const getNodesWithDist = () =>
      nodes.map((n) => ({
        ...n,
        subLabel: `d = ${dist[n.id] === Infinity ? "∞" : dist[n.id]}`,
      }));

    const rec = createRecorder({
      index: 0,
      title: "Init distances",
      description: `Set dist[${startId}] = 0 and all other nodes to ∞.`,
      currentLine: 1,
      graphNodes: getNodesWithDist(),
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

    const snap = (
      hi: Record<string, "compare" | "pointer" | "sorted" | "visited" | "mutate">,
      title: string,
      line: number,
      vars: VariableFrame[],
      desc?: string,
    ) => {
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        graphNodes: getNodesWithDist(),
        graphEdges: edges,
        graphHighlights: hi,
        variables: vars,
        comparisons: rec.comparisons,
        swaps: 0,
        writes: rec.writes,
      });
    };

    const V = NODES.length;
    let anyUpdate = false;

    // Run V-1 iterations of edge relaxation
    for (let i = 1; i <= V - 1; i++) {
      snap(
        {},
        `Iteration ${i} of ${V - 1}`,
        2,
        [
          { name: "iteration", value: `${i}/${V - 1}`, kind: "state", highlight: true },
          ...NODES.map((n) => ({
            name: `dist[${n.id}]`,
            value: dist[n.id] === Infinity ? "∞" : dist[n.id],
            kind: "number" as const,
          })),
        ],
        `Starting relaxation pass ${i}`,
      );

      anyUpdate = false;
      for (let j = 0; j < EDGES.length; j++) {
        const edge = EDGES[j];
        const u = edge.from;
        const v = edge.to;
        const w = edge.w;
        const edgeId = `e${j}`;

        rec.comparisons++;

        // Visual step: examine edge
        snap(
          { [u]: "compare", [v]: "compare" },
          `Relax edge ${u}→${v} (w=${w})`,
          4,
          [
            { name: "iteration", value: `${i}/${V - 1}`, kind: "state" },
            { name: "edge", value: `${u}→${v}`, kind: "pointer", highlight: true },
            { name: "dist[u]", value: dist[u] === Infinity ? "∞" : dist[u], kind: "number" },
            { name: "dist[v]", value: dist[v] === Infinity ? "∞" : dist[v], kind: "number" },
            {
              name: "new_cost",
              value: dist[u] === Infinity ? "∞" : dist[u] + w,
              kind: "number",
            },
          ],
          `Checking if path to ${v} through ${u} is shorter: ${
            dist[u] === Infinity ? "∞" : `${dist[u]} + (${w})`
          } < ${dist[v] === Infinity ? "∞" : dist[v]}`,
        );

        if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
          const oldVal = dist[v];
          dist[v] = dist[u] + w;
          anyUpdate = true;
          rec.writes++;

          // Visual step: update distance
          snap(
            { [u]: "sorted", [v]: "mutate" },
            `Update dist[${v}] = ${dist[v]}`,
            5,
            [
              { name: "iteration", value: `${i}/${V - 1}`, kind: "state" },
              { name: "edge", value: `${u}→${v}`, kind: "pointer" },
              { name: "old dist[v]", value: oldVal === Infinity ? "∞" : oldVal, kind: "number" },
              { name: "new dist[v]", value: dist[v], kind: "number", highlight: true },
            ],
            `Found shorter path to ${v}! Updated distance value.`,
          );
        }
      }

      if (!anyUpdate) {
        snap(
          {},
          `Early termination - No updates`,
          2,
          NODES.map((n) => ({
            name: `dist[${n.id}]`,
            value: dist[n.id] === Infinity ? "∞" : dist[n.id],
            kind: "number" as const,
          })),
          "No node distances were updated in this iteration, so shortest paths are finalized early.",
        );
        break;
      }
    }

    // V-th iteration to check for negative cycles
    snap(
      {},
      "Check for Negative Cycles",
      6,
      NODES.map((n) => ({
        name: `dist[${n.id}]`,
        value: dist[n.id] === Infinity ? "∞" : dist[n.id],
        kind: "number" as const,
      })),
      "Running one more iteration to see if any distance can still be decreased. If it can, a negative cycle exists.",
    );

    let hasNegativeCycle = false;
    for (let j = 0; j < EDGES.length; j++) {
      const edge = EDGES[j];
      const u = edge.from;
      const v = edge.to;
      const w = edge.w;

      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        hasNegativeCycle = true;
        snap(
          { [u]: "compare", [v]: "mutate" },
          "Negative Cycle Detected!",
          6,
          [
            { name: "negative_cycle", value: "TRUE", kind: "state", highlight: true },
            { name: "culprit_edge", value: `${u}→${v}`, kind: "pointer" },
          ],
          `Edge ${u}→${v} can still be relaxed: ${dist[u]} + ${w} = ${dist[u] + w} < ${dist[v]}. A negative cycle exists!`,
        );
        break;
      }
    }

    if (!hasNegativeCycle) {
      pushStep(rec, {
        title: "Finished ✓",
        description: `Successfully computed shortest paths. No negative cycles found.`,
        currentLine: 6,
        graphNodes: getNodesWithDist(),
        graphEdges: edges,
        graphHighlights: Object.fromEntries(nodes.map((n) => [n.id, "sorted" as const])),
        variables: NODES.map((n) => ({
          name: `dist[${n.id}]`,
          value: dist[n.id] === Infinity ? "∞" : dist[n.id],
          kind: "number" as const,
        })),
        comparisons: rec.comparisons,
        swaps: 0,
        writes: rec.writes,
      });
    }

    return rec.steps;
  },
};
