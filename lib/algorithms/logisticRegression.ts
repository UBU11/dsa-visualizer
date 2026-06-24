// lib/algorithms/logisticRegression.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
  VariableFrame,
  SemanticToken,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export const logisticRegression: AlgorithmDefinition = {
  id: "logistic-regression",
  name: "Logistic Regression (Decision Boundary)",
  category: "Machine Learning",
  structure: "graph",
  summary:
    "Fits a binary classifier boundary line (wx + b = 0). Watch the vertical classification boundary slide dynamically to separate classes.",
  pseudocode: [
    { line: 1, text: "Initialize parameters: weight w = 0.5, bias b = -0.5" },
    { line: 2, text: "For each epoch 1 to N:" },
    { line: 3, text: "  Compute predictions: z = w * x + b, p = sigmoid(z)" },
    { line: 4, text: "  Compute Loss = Binary Cross Entropy (BCE)" },
    { line: 5, text: "  Compute gradients: ∂L/∂w and ∂L/∂b" },
    { line: 6, text: "  Update: w ← w - lr * ∂L/∂w, b ← b - lr * ∂L/∂b" },
  ],
  configFields: [
    {
      key: "epochs",
      label: "Epochs",
      kind: "number",
      min: 5,
      max: 30,
      default: 15,
    },
    {
      key: "lr",
      label: "Learning Rate",
      kind: "number",
      min: 0.1,
      max: 1.5,
      default: 0.6,
    },
  ],
  run(cfg) {
    const epochs = Number(cfg.epochs || 15);
    const lr = Number(cfg.lr || 0.6);

    // Fixed dataset for binary classification: Class 0 at X < 0, Class 1 at X > 0
    const X = [-2.0, -1.0, 1.0, 2.0];
    const Y = [0, 0, 1, 1]; // Labels
    const N = X.length;

    let w = 0.5;
    let b = -0.5; // start with slight offset for visual separation

    // Coordinate conversion mapping:
    // X [-3, 3] -> x_screen [0.1, 0.9]
    // Class 0 placed at y=0.7, Class 1 placed at y=0.3
    const getXScreen = (val: number) => {
      const clampedX = Math.max(-3, Math.min(3, val));
      return 0.1 + 0.8 * ((clampedX + 3) / 6);
    };

    const getGraphNodes = (wVal: number, bVal: number): GraphNodeSnapshot[] => {
      // 1. Data classification points
      const list: GraphNodeSnapshot[] = X.map((xVal, idx) => ({
        id: `P${idx}`,
        label: `P${idx}`,
        x: getXScreen(xVal),
        y: Y[idx] === 1 ? 0.3 : 0.7,
        subLabel: `x = ${xVal.toFixed(1)} | p = ${sigmoid(wVal * xVal + bVal).toFixed(2)}`,
      }));

      // 2. Decision boundary helper nodes at top and bottom
      // Boundary occurs where w*x + b = 0 => x = -b/w
      let bndX = wVal !== 0 ? -bVal / wVal : 0;
      const screenX = getXScreen(bndX);

      list.push({
        id: "B_top",
        label: "B_top",
        x: screenX,
        y: 0.1,
        subLabel: `x = ${bndX.toFixed(2)}`,
      });

      list.push({
        id: "B_bottom",
        label: "B_bottom",
        x: screenX,
        y: 0.9,
        subLabel: "Boundary",
      });

      return list;
    };

    const getGraphEdges = (): GraphEdgeSnapshot[] => [
      // Draw vertical decision boundary line
      {
        id: "e_bnd",
        fromId: "B_top",
        toId: "B_bottom",
        directed: false,
        weight: "Boundary Line (p = 0.5)",
      },
    ];

    const getGraphHighlights = (
      hiActive?: Record<string, SemanticToken>,
    ): Record<string, SemanticToken> => {
      const h: Record<string, SemanticToken> = {};
      X.forEach((_, idx) => {
        // Class 0 -> mutate (rose), Class 1 -> sorted (emerald)
        h[`P${idx}`] = Y[idx] === 1 ? "sorted" : "mutate";
      });
      h.B_top = "pointer";
      h.B_bottom = "pointer";
      h.e_bnd = "pointer"; // Indigo boundary line
      if (hiActive) {
        Object.assign(h, hiActive);
      }
      return h;
    };

    const makeVars = (
      epoch: number,
      wVal: number,
      bVal: number,
      avgLoss: number,
      dw: number = 0,
      db: number = 0,
    ): VariableFrame[] => [
      { name: "Epoch", value: `${epoch}/${epochs}`, kind: "state", highlight: true },
      { name: "Learning Rate (lr)", value: lr.toFixed(2), kind: "number" },
      { name: "Weight (w)", value: wVal.toFixed(3), kind: "pointer" },
      { name: "Bias (b)", value: bVal.toFixed(3), kind: "pointer" },
      { name: "Avg BCE Loss", value: avgLoss.toFixed(4), kind: "number", highlight: true },
      ...(epoch > 0
        ? ([
            { name: "Gradient ∂L/∂w", value: dw.toFixed(3), kind: "number" },
            { name: "Gradient ∂L/∂b", value: db.toFixed(3), kind: "number" },
          ] as VariableFrame[])
        : []),
    ];

    // Compute initial loss
    let initialSumLoss = 0;
    const eps = 1e-15;
    for (let i = 0; i < N; i++) {
      const p = sigmoid(w * X[i] + b);
      initialSumLoss += -(Y[i] * Math.log(p + eps) + (1 - Y[i]) * Math.log(1 - p + eps));
    }
    let initialLossVal = initialSumLoss / N;

    const rec = createRecorder({
      index: 0,
      title: "Initialize Model Parameters",
      description: `Model set to p = sigmoid(${w.toFixed(1)}x + ${b.toFixed(1)}). Initial Cross Entropy Loss: ${initialLossVal.toFixed(4)}.`,
      currentLine: 1,
      graphNodes: getGraphNodes(w, b),
      graphEdges: getGraphEdges(),
      graphHighlights: getGraphHighlights(),
      variables: makeVars(0, w, b, initialLossVal),
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const snap = (
      wVal: number,
      bVal: number,
      hi: Record<string, SemanticToken>,
      title: string,
      line: number,
      desc: string,
      epoch: number,
      avgLoss: number,
      dw: number = 0,
      db: number = 0,
    ) => {
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        graphNodes: getGraphNodes(wVal, bVal),
        graphEdges: getGraphEdges(),
        graphHighlights: getGraphHighlights(hi),
        variables: makeVars(epoch, wVal, bVal, avgLoss, dw, db),
        comparisons: rec.comparisons,
        swaps: 0,
        writes: rec.writes,
      });
    };

    // Optimization Loop
    for (let ep = 1; ep <= epochs; ep++) {
      let totalLoss = 0;
      for (let i = 0; i < N; i++) {
        const z = w * X[i] + b;
        const p = sigmoid(z);
        totalLoss += -(Y[i] * Math.log(p + eps) + (1 - Y[i]) * Math.log(1 - p + eps));
      }
      const lossVal = totalLoss / N;

      snap(
        w,
        b,
        { B_top: "compare", B_bottom: "compare", e_bnd: "compare" },
        `Epoch ${ep}: Feedforward`,
        3,
        `Evaluate points against boundary. Red are Class 0 (target 0), Green are Class 1 (target 1). Loss = ${lossVal.toFixed(4)}.`,
        ep,
        lossVal,
      );

      // Compute Gradients
      let dw = 0;
      let db = 0;
      for (let i = 0; i < N; i++) {
        const p = sigmoid(w * X[i] + b);
        const diff = p - Y[i];
        dw += diff * X[i];
        db += diff;
        rec.comparisons++;
      }
      dw = dw / N;
      db = db / N;

      snap(
        w,
        b,
        { P0: "compare", P1: "compare", P2: "compare", P3: "compare" },
        `Epoch ${ep}: Compute Gradients`,
        5,
        `Compute slope gradient (∂L/∂w = ${dw.toFixed(3)}) and bias gradient (∂L/∂b = ${db.toFixed(3)}).`,
        ep,
        lossVal,
        dw,
        db,
      );

      // Update parameters
      w = w - lr * dw;
      b = b - lr * db;
      rec.writes += 2;

      snap(
        w,
        b,
        { B_top: "mutate", B_bottom: "mutate", e_bnd: "mutate" },
        `Epoch ${ep}: Shift Boundary`,
        6,
        `Update parameters: w ← ${w.toFixed(3)}, b ← ${b.toFixed(3)}. Watch the boundary line slide horizontally.`,
        ep,
        lossVal,
        dw,
        db,
      );
    }

    // Done Step
    let finalSumLoss = 0;
    for (let i = 0; i < N; i++) {
      const p = sigmoid(w * X[i] + b);
      finalSumLoss += -(Y[i] * Math.log(p + eps) + (1 - Y[i]) * Math.log(1 - p + eps));
    }
    const finalLossVal = finalSumLoss / N;

    pushStep(rec, {
      title: "Model Optimization Complete ✓",
      description: `Optimized boundary model separated classes with loss = ${finalLossVal.toFixed(4)}. Boundary: x = ${(-b/w).toFixed(2)}.`,
      currentLine: 6,
      graphNodes: getGraphNodes(w, b),
      graphEdges: getGraphEdges(),
      graphHighlights: getGraphHighlights({ B_top: "sorted", B_bottom: "sorted", e_bnd: "sorted" }),
      variables: makeVars(epochs, w, b, finalLossVal),
      comparisons: rec.comparisons,
      swaps: 0,
      writes: rec.writes,
    });

    return rec.steps;
  },
};
