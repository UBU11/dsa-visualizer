// lib/algorithms/distanceVector.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
  VariableFrame,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

const NODES = [
  { id: "A", label: "Router A", x: 0.1, y: 0.5 },
  { id: "B", label: "Router B", x: 0.35, y: 0.2 },
  { id: "C", label: "Router C", x: 0.35, y: 0.8 },
  { id: "D", label: "Router D", x: 0.65, y: 0.2 },
  { id: "E", label: "Router E", x: 0.65, y: 0.8 },
  { id: "F", label: "Router F", x: 0.9, y: 0.5 },
];

const EDGES = [
  { from: "A", to: "B", w: 2 },
  { from: "A", to: "C", w: 4 },
  { from: "B", to: "C", w: 1 },
  { from: "B", to: "D", w: 5 },
  { from: "C", to: "E", w: 3 },
  { from: "D", to: "E", w: 1 },
  { from: "D", to: "F", w: 2 },
  { from: "E", to: "F", w: 4 },
];

// Helper to represent routing table entry: [dest] = { cost, nextHop }
type RoutingTable = Record<string, { cost: number; nextHop: string | null }>;

export const distanceVector: AlgorithmDefinition = {
  id: "distance-vector",
  name: "Distance Vector Routing",
  category: "Graphs",
  structure: "graph",
  summary:
    "Simulates RIP routing table updates in a network. Routers exchange vectors with neighbors to discover optimal paths.",
  pseudocode: [
    { line: 1, text: "for each router u: init routing table with direct links" },
    { line: 2, text: "repeat until tables converge:" },
    { line: 3, text: "  for each router u:" },
    { line: 4, text: "    send routing vector to all neighbors" },
    { line: 5, text: "    for each neighbor v of u:" },
    { line: 6, text: "      for each destination d in v's table:" },
    { line: 7, text: "        if c(u,v) + d(v,d) < d(u,d): update table" },
  ],
  configFields: [
    {
      key: "inspectNode",
      label: "Inspect Router Table",
      kind: "select",
      default: "A",
      options: NODES.map((n) => ({ value: n.id, label: n.label })),
    },
    {
      key: "targetDest",
      label: "Show Path to Target",
      kind: "select",
      default: "F",
      options: NODES.map((n) => ({ value: n.id, label: n.label })),
    },
  ],
  run(cfg) {
    const inspectId = String(cfg.inspectNode || "A");
    const targetDest = String(cfg.targetDest || "F");

    const nodes: GraphNodeSnapshot[] = NODES.map((n) => ({
      id: n.id,
      label: n.id, // Keep label short for inside the circle
      x: n.x,
      y: n.y,
    }));

    // Distance Vector uses undirected links, so we create bidirectional edges
    const edges: GraphEdgeSnapshot[] = EDGES.map((e, i) => ({
      id: `e${i}`,
      fromId: e.from,
      toId: e.to,
      directed: false,
      weight: e.w,
    }));

    // Find direct cost between u and v
    const getLinkCost = (u: string, v: string): number => {
      const edge = EDGES.find(
        (e) => (e.from === u && e.to === v) || (e.from === v && e.to === u),
      );
      return edge ? edge.w : Infinity;
    };

    // Find direct neighbors of u
    const getNeighbors = (u: string): string[] => {
      const res: string[] = [];
      for (const e of EDGES) {
        if (e.from === u) res.push(e.to);
        if (e.to === u) res.push(e.from);
      }
      return res;
    };

    // Initialize routing tables
    const tables: Record<string, RoutingTable> = {};
    for (const n of NODES) {
      tables[n.id] = {};
      for (const dest of NODES) {
        if (dest.id === n.id) {
          tables[n.id][dest.id] = { cost: 0, nextHop: n.id };
        } else {
          const cost = getLinkCost(n.id, dest.id);
          tables[n.id][dest.id] = {
            cost,
            nextHop: cost === Infinity ? null : dest.id,
          };
        }
      }
    }

    // Generate node sub-labels showing the cost to targetDest
    const getNodesWithSubLabels = () =>
      nodes.map((n) => {
        const entry = tables[n.id][targetDest];
        const costStr = entry.cost === Infinity ? "∞" : String(entry.cost);
        const viaStr = entry.nextHop && entry.cost !== 0 ? ` via ${entry.nextHop}` : "";
        return {
          ...n,
          subLabel: `to ${targetDest}: ${costStr}${viaStr}`,
        };
      });

    // Generate variables panel listing table entries for the inspected node
    const getVariablesForInspectNode = (highlightDest?: string) => {
      const inspectTable = tables[inspectId];
      const list: VariableFrame[] = [
        { name: "🔍 Inspected Router", value: `Router ${inspectId}`, kind: "state", highlight: true },
        { name: "🎯 Show Path Target", value: `Router ${targetDest}`, kind: "state" },
      ];

      // Format table headers
      list.push({
        name: "Dest | Cost | Next Hop",
        value: "----------------",
        kind: "state",
      });

      // Add routing table rows as variables
      for (const n of NODES) {
        const entry = inspectTable[n.id];
        const costStr = entry.cost === Infinity ? "∞" : String(entry.cost);
        const nextStr = entry.nextHop ?? "-";
        list.push({
          name: `Path to ${n.id}`,
          value: `Cost: ${costStr} (Next: ${nextStr})`,
          kind: "number",
          highlight: n.id === highlightDest,
        });
      }

      return list;
    };

    const rec = createRecorder({
      index: 0,
      title: "Initialize Routing Tables",
      description: `Each router initializes its routing table with direct link costs. Inspecting Router ${inspectId}.`,
      currentLine: 1,
      graphNodes: getNodesWithSubLabels(),
      graphEdges: edges,
      graphHighlights: { [inspectId]: "pointer" },
      variables: getVariablesForInspectNode(),
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
        graphNodes: getNodesWithSubLabels(),
        graphEdges: edges,
        graphHighlights: hi,
        variables: vars,
        comparisons: rec.comparisons,
        swaps: 0,
        writes: rec.writes,
      });
    };

    let round = 1;
    let converged = false;

    // Standard Distance Vector convergence loop
    while (!converged && round < 10) {
      converged = true;
      snap(
        {},
        `Round ${round}: Exchange Tables`,
        2,
        getVariablesForInspectNode(),
        `Round ${round} of routing table exchange. Nodes broadcast their current distance vectors to neighbors.`,
      );

      // We clone routing tables to compute the next step synchronously
      const nextTables = JSON.parse(JSON.stringify(tables)) as Record<string, RoutingTable>;

      for (const u of NODES) {
        const uId = u.id;
        const neighbors = getNeighbors(uId);

        // Highlight active router u
        snap(
          { [uId]: "pointer" },
          `Update Table for ${uId}`,
          3,
          getVariablesForInspectNode(),
          `Inspecting incoming updates at Router ${uId} from neighbors: ${neighbors.join(", ")}`,
        );

        for (const vId of neighbors) {
          const costUV = getLinkCost(uId, vId);

          // For each neighbor, check all possible destinations
          for (const d of NODES) {
            const dId = d.id;
            if (dId === uId) continue;

            const distVD = tables[vId][dId].cost;
            const currentCost = tables[uId][dId].cost;
            const candidateCost = costUV + distVD;

            rec.comparisons++;

            if (candidateCost < currentCost) {
              nextTables[uId][dId] = {
                cost: candidateCost,
                nextHop: vId,
              };
              converged = false;
              rec.writes++;

              // Visual update step if we modify the table of the router we are inspecting!
              if (uId === inspectId) {
                // Update table values temporarily to show dynamic update in state
                tables[uId][dId] = { cost: candidateCost, nextHop: vId };
                snap(
                  { [uId]: "mutate", [vId]: "compare", [dId]: "compare" },
                  `Update path to ${dId} via ${vId}`,
                  7,
                  getVariablesForInspectNode(dId),
                  `Path to ${dId} via neighbor ${vId} is shorter: c(${uId},${vId}) + d(${vId},${dId}) = ${costUV} + ${
                    distVD === Infinity ? "∞" : distVD
                  } = ${candidateCost} < ${currentCost === Infinity ? "∞" : currentCost}`,
                );
              }
            }
          }
        }
      }

      // Apply all updates for this round
      for (const uId in nextTables) {
        tables[uId] = nextTables[uId];
      }

      round++;
    }

    // Done step
    pushStep(rec, {
      title: "DV Protocol Converged ✓",
      description: `All routing tables have converged after ${round - 1} rounds. No further changes occurred.`,
      currentLine: 2,
      graphNodes: getNodesWithSubLabels(),
      graphEdges: edges,
      graphHighlights: Object.fromEntries(nodes.map((n) => [n.id, "sorted" as const])),
      variables: getVariablesForInspectNode(),
      comparisons: rec.comparisons,
      swaps: 0,
      writes: rec.writes,
    });

    return rec.steps;
  },
};
