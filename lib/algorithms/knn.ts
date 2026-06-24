// lib/algorithms/knn.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
  VariableFrame,
  SemanticToken,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

const TRAIN_POINTS = [
  { id: "A1", label: "A1", x: 0.2, y: 0.25, cls: "A" },
  { id: "A2", label: "A2", x: 0.35, y: 0.15, cls: "A" },
  { id: "A3", label: "A3", x: 0.15, y: 0.45, cls: "A" },
  { id: "B1", label: "B1", x: 0.8, y: 0.75, cls: "B" },
  { id: "B2", label: "B2", x: 0.65, y: 0.85, cls: "B" },
  { id: "B3", label: "B3", x: 0.85, y: 0.55, cls: "B" },
];

const QUERY = { id: "Q", label: "Query", x: 0.45, y: 0.55 };

export const knn: AlgorithmDefinition = {
  id: "knn",
  name: "k-Nearest Neighbors (k-NN)",
  category: "Machine Learning",
  structure: "graph",
  summary:
    "Classifies a query point based on the majority vote of its k closest neighbors in a 2D space. Displays distance calculations and neighbor votes.",
  pseudocode: [
    { line: 1, text: "For each training point P:" },
    { line: 2, text: "  Compute Euclidean distance: d = √((x_q - x_p)^2 + (y_q - y_p)^2)" },
    { line: 3, text: "Sort training points by distance ascending" },
    { line: 4, text: "Select the k nearest points (k = 3)" },
    { line: 5, text: "Count votes for each class among the k neighbors" },
    { line: 6, text: "Assign the majority class to the Query point" },
  ],
  configFields: [
    {
      key: "k",
      label: "Number of Neighbors (k)",
      kind: "number",
      min: 1,
      max: 5,
      default: 3,
    },
  ],
  run(cfg) {
    const k = Number(cfg.k || 3);

    // Map classes to semantic tokens: Class A -> mutate (rose), Class B -> sorted (emerald)
    const getClassToken = (cls: string): SemanticToken => {
      return cls === "A" ? "mutate" : "sorted";
    };

    const getInitialNodes = (): GraphNodeSnapshot[] => [
      ...TRAIN_POINTS.map((p) => ({
        id: p.id,
        label: p.label,
        x: p.x,
        y: p.y,
        subLabel: `Class ${p.cls}`,
      })),
      {
        id: QUERY.id,
        label: QUERY.label,
        x: QUERY.x,
        y: QUERY.y,
        subLabel: "Unclassified",
      },
    ];

    const getInitialHighlights = (): Record<string, SemanticToken> => {
      const h: Record<string, SemanticToken> = {};
      TRAIN_POINTS.forEach((p) => {
        h[p.id] = getClassToken(p.cls);
      });
      h[QUERY.id] = "pointer"; // Indigo for query
      return h;
    };

    const rec = createRecorder({
      index: 0,
      title: "Plot 2D Points",
      description: "Dataset loaded: 3 points of Class A (Rose), 3 points of Class B (Emerald). Query point plotted at (0.45, 0.55).",
      currentLine: 1,
      graphNodes: getInitialNodes(),
      graphEdges: [],
      graphHighlights: getInitialHighlights(),
      variables: [
        { name: "k (neighbors)", value: k, kind: "number" },
        { name: "Query Coordinate", value: `(${QUERY.x}, ${QUERY.y})`, kind: "state" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const calculated: { id: string; dist: number; cls: string }[] = [];

    const snap = (
      hi: Record<string, SemanticToken>,
      edges: GraphEdgeSnapshot[],
      title: string,
      line: number,
      desc: string,
      querySub: string,
      extraVars: VariableFrame[] = [],
    ) => {
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        graphNodes: [
          ...TRAIN_POINTS.map((p) => ({
            id: p.id,
            label: p.label,
            x: p.x,
            y: p.y,
            subLabel: `Class ${p.cls}`,
          })),
          {
            id: QUERY.id,
            label: QUERY.label,
            x: QUERY.x,
            y: QUERY.y,
            subLabel: querySub,
          },
        ],
        graphEdges: edges,
        graphHighlights: hi,
        variables: [
          { name: "k (neighbors)", value: k, kind: "number" },
          ...extraVars,
        ],
        comparisons: rec.comparisons,
        swaps: 0,
        writes: rec.writes,
      });
    };

    // Step 2: Compute Euclidean distances one by one
    const edges: GraphEdgeSnapshot[] = [];
    for (let i = 0; i < TRAIN_POINTS.length; i++) {
      const p = TRAIN_POINTS[i];
      const dx = QUERY.x - p.x;
      const dy = QUERY.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      calculated.push({ id: p.id, dist, cls: p.cls });

      rec.comparisons++;

      // Create a directed edge from Query to P representing the distance calculation
      const edgeId = `e_q_${p.id}`;
      edges.push({
        id: edgeId,
        fromId: QUERY.id,
        toId: p.id,
        directed: true,
        weight: dist.toFixed(3),
      });

      const stepHighlights = { ...getInitialHighlights() };
      stepHighlights[p.id] = "compare"; // highlight active training point
      stepHighlights[edgeId] = "compare"; // highlight active distance edge

      const currentDistList = calculated.map((c) => `${c.id}: ${c.dist.toFixed(3)}`).join(", ");

      snap(
        stepHighlights,
        [...edges],
        `Distance to ${p.id}`,
        2,
        `Euclidean Distance from Query to Point ${p.id}: √(${dx.toFixed(2)}^2 + ${dy.toFixed(2)}^2) = ${dist.toFixed(3)}.`,
        "Calculating distances...",
        [
          { name: `dist(Q, ${p.id})`, value: dist.toFixed(3), kind: "number", highlight: true },
          { name: "Computed Distances", value: currentDistList, kind: "string" },
        ],
      );
    }

    // Step 3: Sort training points by distance
    calculated.sort((a, b) => a.dist - b.dist);
    const sortedList = calculated.map((c) => `${c.id}(${c.dist.toFixed(2)})`).join(" → ");

    snap(
      getInitialHighlights(),
      [...edges],
      "Sort Points by Distance",
      3,
      `Sort the dataset in ascending order of distance: ${sortedList}`,
      "Points sorted",
      [{ name: "Sorted Points", value: sortedList, kind: "string", highlight: true }],
    );

    // Step 4: Select k nearest neighbors
    const nearest = calculated.slice(0, k);
    const nearestIds = nearest.map((c) => c.id);
    const stepHighlightsK = { ...getInitialHighlights() };

    // Highlight nearest neighbors and their edges in emerald (sorted) or a distinct color
    const nearestEdges = edges.map((e) => {
      if (nearestIds.includes(e.toId)) {
        stepHighlightsK[e.toId] = "pointer";
        stepHighlightsK[e.id] = "pointer";
        return e;
      }
      return { ...e, weight: undefined }; // remove weight text for other lines to keep it clean
    });

    snap(
      stepHighlightsK,
      nearestEdges,
      `Select k = ${k} Nearest Neighbors`,
      4,
      `Identify the ${k} closest training points: ${nearestIds.join(", ")}.`,
      "Analyzing neighbors...",
      [
        { name: `Nearest ${k} neighbors`, value: nearestIds.join(", "), kind: "pointer", highlight: true },
        { name: "Distances", value: nearest.map((n) => `${n.id}: ${n.dist.toFixed(2)}`).join(", "), kind: "string" },
      ],
    );

    // Step 5: Count votes
    let votesA = 0;
    let votesB = 0;
    nearest.forEach((n) => {
      if (n.cls === "A") votesA++;
      else votesB++;
    });

    const winnerCls = votesA > votesB ? "A" : "B";

    snap(
      stepHighlightsK,
      nearestEdges,
      "Conduct Class Voting",
      5,
      `Count class frequencies among neighbors. Class A (Rose): ${votesA} votes. Class B (Emerald): ${votesB} votes.`,
      `Voting: A=${votesA}, B=${votesB}`,
      [
        { name: "Votes Class A", value: votesA, kind: "number", highlight: winnerCls === "A" },
        { name: "Votes Class B", value: votesB, kind: "number", highlight: winnerCls === "B" },
      ],
    );

    // Step 6: Assign majority class
    const finalHighlights = { ...getInitialHighlights() };
    finalHighlights[QUERY.id] = getClassToken(winnerCls); // Query point turns winner's color!
    rec.writes++;

    pushStep(rec, {
      title: `Classified as Class ${winnerCls} ✓`,
      description: `Query classified as Class ${winnerCls} by majority vote (${
        winnerCls === "A" ? votesA : votesB
      }/${k}).`,
      currentLine: 6,
      graphNodes: [
        ...TRAIN_POINTS.map((p) => ({
          id: p.id,
          label: p.label,
          x: p.x,
          y: p.y,
          subLabel: `Class ${p.cls}`,
        })),
        {
          id: QUERY.id,
          label: QUERY.label,
          x: QUERY.x,
          y: QUERY.y,
          subLabel: `Class ${winnerCls} (Winner)`,
        },
      ],
      graphEdges: nearestEdges.filter((e) => nearestIds.includes(e.toId)), // keep only the nearest lines for a clean final picture!
      graphHighlights: finalHighlights,
      variables: [
        { name: "k (neighbors)", value: k, kind: "number" },
        { name: "Winner Class", value: `Class ${winnerCls}`, kind: "state", highlight: true },
        { name: "Votes", value: `A: ${votesA}, B: ${votesB}`, kind: "state" },
      ],
      comparisons: rec.comparisons,
      swaps: 0,
      writes: rec.writes,
    });

    return rec.steps;
  },
};
