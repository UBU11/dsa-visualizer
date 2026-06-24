// lib/algorithms/dnnSimulation.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
  VariableFrame,
  SemanticToken,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

// Helper for activation function operations
const actFn = (val: number, type: string): number => {
  if (type === "sigmoid") {
    return 1 / (1 + Math.exp(-val));
  }
  if (type === "tanh") {
    return Math.tanh(val);
  }
  // relu
  return Math.max(0, val);
};

const actFormula = (val: number, type: string): string => {
  if (type === "sigmoid") {
    return `σ(${val.toFixed(2)}) = ${(1 / (1 + Math.exp(-val))).toFixed(2)}`;
  }
  if (type === "tanh") {
    return `tanh(${val.toFixed(2)}) = ${Math.tanh(val).toFixed(2)}`;
  }
  // relu
  return `max(0, ${val.toFixed(2)}) = ${Math.max(0, val).toFixed(2)}`;
};

export const dnnSimulation: AlgorithmDefinition = {
  id: "dnn-simulation",
  name: "Deep Neural Network Feedforward",
  category: "Machine Learning",
  structure: "graph",
  summary:
    "Simulates a feedforward pass through a multi-layer Deep Neural Network. Watch inputs flow through weight multiplications, biases, and activation functions.",
  pseudocode: [
    { line: 1, text: "Set input activations: a^(0) = [x_0, x_1]" },
    { line: 2, text: "For each layer l = 1, 2 (Hidden Layers):" },
    { line: 3, text: "  For each node j in layer l:" },
    { line: 4, text: "    z_j^(l) = Σ_i (w_ji^(l) * a_i^(l-1)) + b_j^(l)" },
    { line: 5, text: "    a_j^(l) = g(z_j^(l))  // Apply ReLU / Sigmoid / Tanh" },
    { line: 6, text: "Compute output layer prediction:" },
    { line: 7, text: "  z^(3) = Σ_i (w_i^(3) * a_i^(2)) + b^(3)" },
    { line: 8, text: "  y_hat = σ(z^(3))      // Apply Sigmoid output" },
  ],
  configFields: [
    {
      key: "x0",
      label: "Input x0",
      kind: "number",
      min: -1.0,
      max: 1.0,
      step: 0.1,
      default: 0.8,
      help: "Value of the first input node",
    },
    {
      key: "x1",
      label: "Input x1",
      kind: "number",
      min: -1.0,
      max: 1.0,
      step: 0.1,
      default: -0.5,
      help: "Value of the second input node",
    },
    {
      key: "activation",
      label: "Activation Function",
      kind: "select",
      default: "relu",
      options: [
        { value: "relu", label: "ReLU" },
        { value: "sigmoid", label: "Sigmoid" },
        { value: "tanh", label: "Tanh" },
      ],
      help: "Activation function applied at hidden layers.",
    },
  ],
  run(cfg) {
    const x0 = Number(cfg.x0 ?? 0.8);
    const x1 = Number(cfg.x1 ?? -0.5);
    const activation = String(cfg.activation ?? "relu");

    // Static weights & biases
    const W1 = [
      [0.5, -0.2], // H1_0
      [0.1, 0.8],  // H1_1
      [-0.4, 0.3], // H1_2
    ];
    const b1 = [0.1, -0.2, 0.0];

    const W2 = [
      [0.3, 0.6, -0.1], // H2_0
      [-0.5, 0.2, 0.4], // H2_1
      [0.7, -0.3, 0.5], // H2_2
    ];
    const b2 = [-0.1, 0.1, -0.2];

    const W3 = [
      [0.4, -0.6, 0.8], // Y (output)
    ];
    const b3 = [0.2];

    // Compute mathematical values
    // Layer 1
    const z1 = [
      W1[0][0] * x0 + W1[0][1] * x1 + b1[0],
      W1[1][0] * x0 + W1[1][1] * x1 + b1[1],
      W1[2][0] * x0 + W1[2][1] * x1 + b1[2],
    ];
    const a1 = [
      actFn(z1[0], activation),
      actFn(z1[1], activation),
      actFn(z1[2], activation),
    ];

    // Layer 2
    const z2 = [
      W2[0][0] * a1[0] + W2[0][1] * a1[1] + W2[0][2] * a1[2] + b2[0],
      W2[1][0] * a1[0] + W2[1][1] * a1[1] + W2[1][2] * a1[2] + b2[1],
      W2[2][0] * a1[0] + W2[2][1] * a1[1] + W2[2][2] * a1[2] + b2[2],
    ];
    const a2 = [
      actFn(z2[0], activation),
      actFn(z2[1], activation),
      actFn(z2[2], activation),
    ];

    // Output Layer
    const z3 = W3[0][0] * a2[0] + W3[0][1] * a2[1] + W3[0][2] * a2[2] + b3[0];
    const yHat = 1 / (1 + Math.exp(-z3)); // Output uses sigmoid

    // Node Positions
    const getNodes = (
      h1Sub: string[] = ["-", "-", "-"],
      h2Sub: string[] = ["-", "-", "-"],
      ySub = "-"
    ): GraphNodeSnapshot[] => [
      // Inputs
      { id: "X0", label: "X0", x: 0.15, y: 0.35, subLabel: `x0 = ${x0.toFixed(2)}` },
      { id: "X1", label: "X1", x: 0.15, y: 0.65, subLabel: `x1 = ${x1.toFixed(2)}` },

      // Hidden 1
      { id: "H1_0", label: "H1_0", x: 0.38, y: 0.25, subLabel: h1Sub[0] },
      { id: "H1_1", label: "H1_1", x: 0.38, y: 0.50, subLabel: h1Sub[1] },
      { id: "H1_2", label: "H1_2", x: 0.38, y: 0.75, subLabel: h1Sub[2] },

      // Hidden 2
      { id: "H2_0", label: "H2_0", x: 0.62, y: 0.25, subLabel: h2Sub[0] },
      { id: "H2_1", label: "H2_1", x: 0.62, y: 0.50, subLabel: h2Sub[1] },
      { id: "H2_2", label: "H2_2", x: 0.62, y: 0.75, subLabel: h2Sub[2] },

      // Output
      { id: "Y", label: "Y", x: 0.85, y: 0.50, subLabel: ySub },
    ];

    // Static Edges list
    const getEdges = (): GraphEdgeSnapshot[] => [
      // Input to Hidden 1
      { id: "e_x0_h10", fromId: "X0", toId: "H1_0", directed: true, weight: W1[0][0].toFixed(1) },
      { id: "e_x1_h10", fromId: "X1", toId: "H1_0", directed: true, weight: W1[0][1].toFixed(1) },
      { id: "e_x0_h11", fromId: "X0", toId: "H1_1", directed: true, weight: W1[1][0].toFixed(1) },
      { id: "e_x1_h11", fromId: "X1", toId: "H1_1", directed: true, weight: W1[1][1].toFixed(1) },
      { id: "e_x0_h12", fromId: "X0", toId: "H1_2", directed: true, weight: W1[2][0].toFixed(1) },
      { id: "e_x1_h12", fromId: "X1", toId: "H1_2", directed: true, weight: W1[2][1].toFixed(1) },

      // Hidden 1 to Hidden 2
      { id: "e_h10_h20", fromId: "H1_0", toId: "H2_0", directed: true, weight: W2[0][0].toFixed(1) },
      { id: "e_h11_h20", fromId: "H1_1", toId: "H2_0", directed: true, weight: W2[0][1].toFixed(1) },
      { id: "e_h12_h20", fromId: "H1_2", toId: "H2_0", directed: true, weight: W2[0][2].toFixed(1) },
      { id: "e_h10_h21", fromId: "H1_0", toId: "H2_1", directed: true, weight: W2[1][0].toFixed(1) },
      { id: "e_h11_h21", fromId: "H1_1", toId: "H2_1", directed: true, weight: W2[1][1].toFixed(1) },
      { id: "e_h12_h21", fromId: "H1_2", toId: "H2_1", directed: true, weight: W2[1][2].toFixed(1) },
      { id: "e_h10_h22", fromId: "H1_0", toId: "H2_2", directed: true, weight: W2[2][0].toFixed(1) },
      { id: "e_h11_h22", fromId: "H1_1", toId: "H2_2", directed: true, weight: W2[2][1].toFixed(1) },
      { id: "e_h12_h22", fromId: "H1_2", toId: "H2_2", directed: true, weight: W2[2][2].toFixed(1) },

      // Hidden 2 to Output
      { id: "e_h20_y", fromId: "H2_0", toId: "Y", directed: true, weight: W3[0][0].toFixed(1) },
      { id: "e_h21_y", fromId: "H2_1", toId: "Y", directed: true, weight: W3[0][1].toFixed(1) },
      { id: "e_h22_y", fromId: "H2_2", toId: "Y", directed: true, weight: W3[0][2].toFixed(1) },
    ];

    const makeVars = (
      stateName: string,
      extra: VariableFrame[] = []
    ): VariableFrame[] => {
      const base: VariableFrame[] = [
        { name: "Input Vector [x0, x1]", value: `[${x0.toFixed(2)}, ${x1.toFixed(2)}]`, kind: "string" },
        { name: "Activation function g(x)", value: activation.toUpperCase(), kind: "string" },
        { name: "Action State", value: stateName, kind: "state", highlight: true },
      ];
      return [...base, ...extra];
    };

    // Initialize Step
    const rec = createRecorder({
      index: 0,
      title: "Initialize Neural Network Architecture",
      description: `Feedforward pass in progress. Network configured: 2 inputs, 2 hidden layers with 3 nodes each, 1 output. Activation: ${activation.toUpperCase()}.`,
      currentLine: 1,
      graphNodes: getNodes(),
      graphEdges: getEdges(),
      graphHighlights: {},
      variables: makeVars("Architecture Initialized"),
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const snap = (
      hi: Record<string, SemanticToken>,
      title: string,
      line: number,
      actionText: string,
      desc: string,
      h1Labels: string[],
      h2Labels: string[],
      yLabel: string,
      extraVars: VariableFrame[] = []
    ) => {
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        graphNodes: getNodes(h1Labels, h2Labels, yLabel),
        graphEdges: getEdges(),
        graphHighlights: hi,
        variables: makeVars(actionText, extraVars),
        comparisons: rec.comparisons,
        swaps: 0,
        writes: rec.writes,
      });
    };

    // STEP 1: Activate inputs
    snap(
      { X0: "pointer", X1: "pointer" },
      "Load Inputs into Input Layer",
      1,
      "Loaded input values",
      `The network takes the external input vector a^(0) = [${x0.toFixed(2)}, ${x1.toFixed(2)}] and stores it in the input neurons X0 and X1.`,
      ["-", "-", "-"],
      ["-", "-", "-"],
      "-",
      [
        { name: "a^(0)_0 (X0)", value: x0.toFixed(2), kind: "number" },
        { name: "a^(0)_1 (X1)", value: x1.toFixed(2), kind: "number" },
      ]
    );

    // Dynamic Tracking for labels
    const currentH1 = ["-", "-", "-"];
    const currentH2 = ["-", "-", "-"];
    let currentY = "-";

    // STEP 2: Compute Hidden Layer 1 node by node
    // Node H1_0
    rec.comparisons += 2; // two multiplications
    snap(
      { X0: "compare", X1: "compare", e_x0_h10: "compare", e_x1_h10: "compare", H1_0: "mutate" },
      "H1_0 Logit Computation",
      4,
      "Computing z_0^(1)",
      `Weighted logit for node H1_0: z_0^(1) = w_00*x0 + w_01*x1 + b_0 = (${W1[0][0].toFixed(1)} * ${x0.toFixed(2)}) + (${W1[0][1].toFixed(1)} * ${x1.toFixed(2)}) + (${b1[0].toFixed(1)}) = ${z1[0].toFixed(3)}.`,
      [`z = ${z1[0].toFixed(2)}`, "-", "-"],
      ["-", "-", "-"],
      "-",
      [
        { name: "w1_0 (weights)", value: `[${W1[0].join(", ")}]`, kind: "pointer" },
        { name: "b1_0 (bias)", value: b1[0].toFixed(2), kind: "number" },
        { name: "z_0^(1)", value: z1[0].toFixed(3), kind: "number", highlight: true },
      ]
    );

    currentH1[0] = `a = ${a1[0].toFixed(2)}`;
    rec.writes++;
    snap(
      { H1_0: "pointer" },
      "H1_0 Activation Function",
      5,
      "Applying g(z) to H1_0",
      `Apply activation function ${activation.toUpperCase()} to z_0^(1): a_0^(1) = ${actFormula(z1[0], activation)}.`,
      [currentH1[0], "-", "-"],
      ["-", "-", "-"],
      "-",
      [
        { name: "z_0^(1)", value: z1[0].toFixed(3), kind: "number" },
        { name: "a_0^(1) (Activation)", value: a1[0].toFixed(3), kind: "number", highlight: true },
      ]
    );

    // Node H1_1
    rec.comparisons += 2;
    snap(
      { X0: "compare", X1: "compare", e_x0_h11: "compare", e_x1_h11: "compare", H1_1: "mutate" },
      "H1_1 Logit Computation",
      4,
      "Computing z_1^(1)",
      `Weighted logit for node H1_1: z_1^(1) = w_10*x0 + w_11*x1 + b_1 = (${W1[1][0].toFixed(1)} * ${x0.toFixed(2)}) + (${W1[1][1].toFixed(1)} * ${x1.toFixed(2)}) + (${b1[1].toFixed(1)}) = ${z1[1].toFixed(3)}.`,
      [currentH1[0], `z = ${z1[1].toFixed(2)}`, "-"],
      ["-", "-", "-"],
      "-",
      [
        { name: "w1_1 (weights)", value: `[${W1[1].join(", ")}]`, kind: "pointer" },
        { name: "b1_1 (bias)", value: b1[1].toFixed(2), kind: "number" },
        { name: "z_1^(1)", value: z1[1].toFixed(3), kind: "number", highlight: true },
      ]
    );

    currentH1[1] = `a = ${a1[1].toFixed(2)}`;
    rec.writes++;
    snap(
      { H1_0: "visited", H1_1: "pointer" },
      "H1_1 Activation Function",
      5,
      "Applying g(z) to H1_1",
      `Apply activation function ${activation.toUpperCase()} to z_1^(1): a_1^(1) = ${actFormula(z1[1], activation)}.`,
      [currentH1[0], currentH1[1], "-"],
      ["-", "-", "-"],
      "-",
      [
        { name: "z_1^(1)", value: z1[1].toFixed(3), kind: "number" },
        { name: "a_1^(1) (Activation)", value: a1[1].toFixed(3), kind: "number", highlight: true },
      ]
    );

    // Node H1_2
    rec.comparisons += 2;
    snap(
      { X0: "compare", X1: "compare", e_x0_h12: "compare", e_x1_h12: "compare", H1_2: "mutate" },
      "H1_2 Logit Computation",
      4,
      "Computing z_2^(1)",
      `Weighted logit for node H1_2: z_2^(1) = w_20*x0 + w_21*x1 + b_2 = (${W1[2][0].toFixed(1)} * ${x0.toFixed(2)}) + (${W1[2][1].toFixed(1)} * ${x1.toFixed(2)}) + (${b1[2].toFixed(1)}) = ${z1[2].toFixed(3)}.`,
      [currentH1[0], currentH1[1], `z = ${z1[2].toFixed(2)}`],
      ["-", "-", "-"],
      "-",
      [
        { name: "w1_2 (weights)", value: `[${W1[2].join(", ")}]`, kind: "pointer" },
        { name: "b1_2 (bias)", value: b1[2].toFixed(2), kind: "number" },
        { name: "z_2^(1)", value: z1[2].toFixed(3), kind: "number", highlight: true },
      ]
    );

    currentH1[2] = `a = ${a1[2].toFixed(2)}`;
    rec.writes++;
    snap(
      { H1_0: "visited", H1_1: "visited", H1_2: "pointer" },
      "H1_2 Activation Function",
      5,
      "Applying g(z) to H1_2",
      `Apply activation function ${activation.toUpperCase()} to z_2^(1): a_2^(1) = ${actFormula(z1[2], activation)}.`,
      [currentH1[0], currentH1[1], currentH1[2]],
      ["-", "-", "-"],
      "-",
      [
        { name: "z_2^(1)", value: z1[2].toFixed(3), kind: "number" },
        { name: "a_2^(1) (Activation)", value: a1[2].toFixed(3), kind: "number", highlight: true },
      ]
    );

    // STEP 3: Compute Hidden Layer 2 node by node
    // Node H2_0
    rec.comparisons += 3;
    snap(
      { H1_0: "compare", H1_1: "compare", H1_2: "compare", e_h10_h20: "compare", e_h11_h20: "compare", e_h12_h20: "compare", H2_0: "mutate" },
      "H2_0 Logit Computation",
      4,
      "Computing z_0^(2)",
      `Weighted logit for node H2_0: z_0^(2) = w_00*a1_0 + w_01*a1_1 + w_02*a1_2 + b_0 = (${W2[0][0].toFixed(1)} * ${a1[0].toFixed(2)}) + (${W2[0][1].toFixed(1)} * ${a1[1].toFixed(2)}) + (${W2[0][2].toFixed(1)} * ${a1[2].toFixed(2)}) + (${b2[0].toFixed(1)}) = ${z2[0].toFixed(3)}.`,
      [...currentH1],
      [`z = ${z2[0].toFixed(2)}`, "-", "-"],
      "-",
      [
        { name: "w2_0 (weights)", value: `[${W2[0].join(", ")}]`, kind: "pointer" },
        { name: "b2_0 (bias)", value: b2[0].toFixed(2), kind: "number" },
        { name: "z_0^(2)", value: z2[0].toFixed(3), kind: "number", highlight: true },
      ]
    );

    currentH2[0] = `a = ${a2[0].toFixed(2)}`;
    rec.writes++;
    snap(
      { H2_0: "pointer" },
      "H2_0 Activation Function",
      5,
      "Applying g(z) to H2_0",
      `Apply activation function ${activation.toUpperCase()} to z_0^(2): a_0^(2) = ${actFormula(z2[0], activation)}.`,
      [...currentH1],
      [currentH2[0], "-", "-"],
      "-",
      [
        { name: "z_0^(2)", value: z2[0].toFixed(3), kind: "number" },
        { name: "a_0^(2) (Activation)", value: a2[0].toFixed(3), kind: "number", highlight: true },
      ]
    );

    // Node H2_1
    rec.comparisons += 3;
    snap(
      { H1_0: "compare", H1_1: "compare", H1_2: "compare", e_h10_h21: "compare", e_h11_h21: "compare", e_h12_h21: "compare", H2_1: "mutate" },
      "H2_1 Logit Computation",
      4,
      "Computing z_1^(2)",
      `Weighted logit for node H2_1: z_1^(2) = w_10*a1_0 + w_11*a1_1 + w_12*a1_2 + b_1 = (${W2[1][0].toFixed(1)} * ${a1[0].toFixed(2)}) + (${W2[1][1].toFixed(1)} * ${a1[1].toFixed(2)}) + (${W2[1][2].toFixed(1)} * ${a1[2].toFixed(2)}) + (${b2[1].toFixed(1)}) = ${z2[1].toFixed(3)}.`,
      [...currentH1],
      [currentH2[0], `z = ${z2[1].toFixed(2)}`, "-"],
      "-",
      [
        { name: "w2_1 (weights)", value: `[${W2[1].join(", ")}]`, kind: "pointer" },
        { name: "b2_1 (bias)", value: b2[1].toFixed(2), kind: "number" },
        { name: "z_1^(2)", value: z2[1].toFixed(3), kind: "number", highlight: true },
      ]
    );

    currentH2[1] = `a = ${a2[1].toFixed(2)}`;
    rec.writes++;
    snap(
      { H2_0: "visited", H2_1: "pointer" },
      "H2_1 Activation Function",
      5,
      "Applying g(z) to H2_1",
      `Apply activation function ${activation.toUpperCase()} to z_1^(2): a_1^(2) = ${actFormula(z2[1], activation)}.`,
      [...currentH1],
      [currentH2[0], currentH2[1], "-"],
      "-",
      [
        { name: "z_1^(2)", value: z2[1].toFixed(3), kind: "number" },
        { name: "a_1^(2) (Activation)", value: a2[1].toFixed(3), kind: "number", highlight: true },
      ]
    );

    // Node H2_2
    rec.comparisons += 3;
    snap(
      { H1_0: "compare", H1_1: "compare", H1_2: "compare", e_h10_h22: "compare", e_h11_h22: "compare", e_h12_h22: "compare", H2_2: "mutate" },
      "H2_2 Logit Computation",
      4,
      "Computing z_2^(2)",
      `Weighted logit for node H2_2: z_2^(2) = w_20*a1_0 + w_21*a1_1 + w_22*a1_2 + b_2 = (${W2[2][0].toFixed(1)} * ${a1[0].toFixed(2)}) + (${W2[2][1].toFixed(1)} * ${a1[1].toFixed(2)}) + (${W2[2][2].toFixed(1)} * ${a1[2].toFixed(2)}) + (${b2[2].toFixed(1)}) = ${z2[2].toFixed(3)}.`,
      [...currentH1],
      [currentH2[0], currentH2[1], `z = ${z2[2].toFixed(2)}`],
      "-",
      [
        { name: "w2_2 (weights)", value: `[${W2[2].join(", ")}]`, kind: "pointer" },
        { name: "b2_2 (bias)", value: b2[2].toFixed(2), kind: "number" },
        { name: "z_2^(2)", value: z2[2].toFixed(3), kind: "number", highlight: true },
      ]
    );

    currentH2[2] = `a = ${a2[2].toFixed(2)}`;
    rec.writes++;
    snap(
      { H2_0: "visited", H2_1: "visited", H2_2: "pointer" },
      "H2_2 Activation Function",
      5,
      "Applying g(z) to H2_2",
      `Apply activation function ${activation.toUpperCase()} to z_2^(2): a_2^(2) = ${actFormula(z2[2], activation)}.`,
      [...currentH1],
      [currentH2[0], currentH2[1], currentH2[2]],
      "-",
      [
        { name: "z_2^(2)", value: z2[2].toFixed(3), kind: "number" },
        { name: "a_2^(2) (Activation)", value: a2[2].toFixed(3), kind: "number", highlight: true },
      ]
    );

    // STEP 4: Compute Output Logit z^(3)
    rec.comparisons += 3;
    snap(
      { H2_0: "compare", H2_1: "compare", H2_2: "compare", e_h20_y: "compare", e_h21_y: "compare", e_h22_y: "compare", Y: "mutate" },
      "Compute Output Logit z^(3)",
      7,
      "Computing output logit z^(3)",
      `Weighted logit for output neuron Y: z^(3) = w_0*a2_0 + w_1*a2_1 + w_2*a2_2 + b^(3) = (${W3[0][0].toFixed(1)} * ${a2[0].toFixed(2)}) + (${W3[0][1].toFixed(1)} * ${a2[1].toFixed(2)}) + (${W3[0][2].toFixed(1)} * ${a2[2].toFixed(2)}) + (${b3[0].toFixed(1)}) = ${z3.toFixed(3)}.`,
      [...currentH1],
      [...currentH2],
      `z = ${z3.toFixed(2)}`,
      [
        { name: "w3 (weights)", value: `[${W3[0].join(", ")}]`, kind: "pointer" },
        { name: "b3 (bias)", value: b3[0].toFixed(2), kind: "number" },
        { name: "z^(3)", value: z3.toFixed(3), kind: "number", highlight: true },
      ]
    );

    // STEP 5: Apply Output Activation (Sigmoid)
    currentY = `y_hat = ${yHat.toFixed(4)}`;
    rec.writes++;
    snap(
      { Y: "sorted" },
      "Output Activation: Sigmoid Normalization",
      8,
      "Applying Sigmoid output activation",
      `Apply Sigmoid function to project the output to a classification probability range [0, 1]: y_hat = σ(z^(3)) = 1 / (1 + e^(-${z3.toFixed(2)})) = ${yHat.toFixed(4)}.`,
      [...currentH1],
      [...currentH2],
      currentY,
      [
        { name: "z^(3) (output logit)", value: z3.toFixed(3), kind: "number" },
        { name: "y_hat (Prediction)", value: yHat.toFixed(4), kind: "number", highlight: true },
      ]
    );

    // STEP 6: Feedforward Complete
    pushStep(rec, {
      title: "Forward Propagation Complete ✓",
      description: `Feedforward pass finalized. Input x = [${x0.toFixed(2)}, ${x1.toFixed(2)}] successfully mapped to output probability y_hat = ${yHat.toFixed(4)}.`,
      currentLine: 8,
      graphNodes: getNodes([...currentH1], [...currentH2], currentY),
      graphEdges: getEdges(),
      graphHighlights: {
        X0: "sorted",
        X1: "sorted",
        H1_0: "sorted",
        H1_1: "sorted",
        H1_2: "sorted",
        H2_0: "sorted",
        H2_1: "sorted",
        H2_2: "sorted",
        Y: "sorted",
      },
      variables: makeVars("Complete", [
        { name: "a^(0) (Input)", value: `[${x0.toFixed(2)}, ${x1.toFixed(2)}]`, kind: "string" },
        { name: "a^(1) (Hidden 1)", value: `[${a1.map((val) => val.toFixed(2)).join(", ")}]`, kind: "string" },
        { name: "a^(2) (Hidden 2)", value: `[${a2.map((val) => val.toFixed(2)).join(", ")}]`, kind: "string" },
        { name: "y_hat (Output)", value: yHat.toFixed(4), kind: "number", highlight: true },
      ]),
      comparisons: rec.comparisons,
      swaps: 0,
      writes: rec.writes,
    });

    return rec.steps;
  },
};
