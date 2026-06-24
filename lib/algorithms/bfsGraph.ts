// lib/algorithms/bfsGraph.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
  VariableFrame,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

interface AdjEdge {
  to: string;
  edgeId: string;
}

// Fixed 7-node graph with hand-tuned coords so the picture looks tidy.
const GRAPH_NODES = [
  { id: "A", label: "A", x: 0.5, y: 0.08 },
  { id: "B", label: "B", x: 0.18, y: 0.34 },
  { id: "C", label: "C", x: 0.82, y: 0.34 },
  { id: "D", label: "D", x: 0.32, y: 0.7 },
  { id: "E", label: "E", x: 0.68, y: 0.7 },
  { id: "F", label: "F", x: 0.08, y: 0.78 },
  { id: "G", label: "G", x: 0.92, y: 0.78 },
];

const GRAPH_EDGES: { from: string; to: string }[] = [
  { from: "A", to: "B" },
  { from: "A", to: "C" },
  { from: "B", to: "D" },
  { from: "B", to: "F" },
  { from: "C", to: "E" },
  { from: "C", to: "G" },
  { from: "D", to: "E" },
];

export const bfsGraph: AlgorithmDefinition = {
  id: "bfs-graph",
  name: "BFS on Graph",
  category: "Graphs",
  structure: "graph",
  summary:
    "Breadth-first search from a source. Frontier nodes indigo, the node currently being expanded amber, finished emerald.",
  pseudocode: [
    { line: 1, text: "queue ← [start]" },
    { line: 2, text: "visited ← { start }" },
    { line: 3, text: "while queue not empty:" },
    { line: 4, text: "  u ← queue.dequeue()" },
    { line: 5, text: "  for v in neighbors(u):" },
    { line: 6, text: "    if v not in visited:" },
    { line: 7, text: "      visited.add(v)" },
    { line: 8, text: "      queue.enqueue(v)" },
  ],
  configFields: [
    {
      key: "start",
      label: "Start node",
      kind: "select",
      default: "A",
      options: GRAPH_NODES.map((n) => ({ value: n.id, label: n.label })),
    },
  ],
  run(config) {
    const startId = String(config.start || "A");

    const nodes: GraphNodeSnapshot[] = GRAPH_NODES.map((n) => ({
      id: n.id,
      label: n.label,
      x: n.x,
      y: n.y,
    }));
    const edges: GraphEdgeSnapshot[] = GRAPH_EDGES.map((e, i) => ({
      id: `e${i}`,
      fromId: e.from,
      toId: e.to,
      directed: true,
    }));

    const adj = new Map<string, AdjEdge[]>();
    for (const n of GRAPH_NODES) adj.set(n.id, []);
    for (let i = 0; i < GRAPH_EDGES.length; i++) {
      const e = GRAPH_EDGES[i];
      adj.get(e.from)!.push({ to: e.to, edgeId: `e${i}` });
    }

    const rec = createRecorder({
      index: 0,
      title: "Graph + start node",
      description: `start = ${startId}`,
      currentLine: 1,
      graphNodes: nodes,
      graphEdges: edges,
      graphHighlights: { [startId]: "pointer" },
      variables: [
        { name: "queue", value: `[${startId}]`, kind: "pointer" },
        { name: "start", value: startId, kind: "pointer" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const visited = new Set<string>([startId]);
    const queue: string[] = [startId];
    const seenOrder: string[] = [];

    const snap = (
      highlights: Record<string, "compare" | "mutate" | "sorted" | "pointer" | "visited">,
      edgeHi: Record<string, "compare" | "mutate" | "sorted" | "pointer" | "visited">,
      title: string,
      line: number,
      vars: VariableFrame[],
      desc?: string,
    ) => {
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        graphNodes: nodes,
        graphEdges: edges,
        graphHighlights: {
          // emerald for done, indigo for frontier.
          ...Object.fromEntries(seenOrder.map((s) => [s, "sorted" as const])),
          ...highlights,
        },
        variables: [
          ...vars,
          ...(edgeHi && Object.keys(edgeHi).length > 0
            ? [{ name: "edges", value: Object.keys(edgeHi).join(","), kind: "pointer" as const }]
            : []),
        ],
        comparisons: visited.size,
        swaps: 0,
        writes: 0,
      });
      // Edge highlights aren't a separate field in HistoryStep; the renderer
      // reads graphHighlights too, but to keep things simple we re-push edges
      // highlighted via variables only. (See renderer for detail.)
      void edgeHi;
    };

    while (queue.length) {
      const u = queue.shift()!;
      snap(
        { [u]: "compare" },
        {},
        `dequeue u = ${u}`,
        4,
        [
          { name: "u", value: u, kind: "pointer", highlight: true },
          { name: "queue", value: `[${queue.join(", ")}]`, kind: "pointer" },
        ],
      );
      seenOrder.push(u);
      const neighbors = adj.get(u) ?? [];
      for (const { to: v, edgeId } of neighbors) {
        snap(
          { [u]: "compare", [v]: "compare" },
          { [edgeId]: "compare" },
          `examine edge ${u}→${v}`,
          5,
          [
            { name: "u", value: u, kind: "pointer" },
            { name: "v", value: v, kind: "number" },
            { name: "visited?", value: visited.has(v) ? "yes" : "no", kind: "state" },
          ],
        );
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
          snap(
            { [u]: "compare", [v]: "mutate" },
            { [edgeId]: "mutate" },
            `enqueue v = ${v}`,
            8,
            [
              { name: "v", value: v, kind: "pointer", highlight: true },
              { name: "queue", value: `[${queue.join(", ")}]`, kind: "pointer" },
            ],
          );
        }
      }
      snap(
        { [u]: "sorted" },
        {},
        `finished expanding ${u}`,
        4,
        [
          { name: "done", value: seenOrder.join(","), kind: "state" },
          { name: "queue", value: `[${queue.join(", ")}]`, kind: "pointer" },
        ],
      );
    }

    pushStep(rec, {
      title: "BFS complete ✓",
      description: `order: ${seenOrder.join(" → ")}`,
      currentLine: 8,
      graphNodes: nodes,
      graphEdges: edges,
      graphHighlights: Object.fromEntries(
        nodes.map((n) => [n.id, "sorted" as const]),
      ),
      variables: [
        { name: "order", value: seenOrder.join(" → "), kind: "state", highlight: true },
        { name: "visited", value: visited.size, kind: "number" },
      ],
      comparisons: visited.size,
      swaps: 0,
      writes: 0,
    });

    return rec.steps;
  },
};