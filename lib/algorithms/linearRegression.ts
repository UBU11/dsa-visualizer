// lib/algorithms/linearRegression.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
  VariableFrame,
  SemanticToken,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const linearRegression: AlgorithmDefinition = {
  id: "linear-regression",
  name: "Linear Regression (Line Fitting)",
  category: "Machine Learning",
  structure: "graph",
  summary:
    "Fits a regression line y = mx + c to data points. Watch the line dynamically pivot and shift on the canvas during gradient descent.",
  pseudocode: [
    { line: 1, text: "Initialize parameters: slope m = 0, intercept c = 0" },
    { line: 2, text: "For each epoch 1 to N:" },
    { line: 3, text: "  Compute predictions: y_pred = m * x + c" },
    { line: 4, text: "  Compute Loss = Mean Squared Error (MSE)" },
    { line: 5, text: "  Compute gradients: ∂L/∂m and ∂L/∂c" },
    { line: 6, text: "  Update: m ← m - lr * ∂L/∂m, c ← c - lr * ∂L/∂c" },
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
      min: 0.01,
      max: 0.2,
      default: 0.05,
    },
  ],
  run(cfg) {
    const epochs = Number(cfg.epochs || 15);
    const lr = Number(cfg.lr || 0.05);

    // Data points (X, Y)
    const X = [1.0, 2.0, 3.0, 4.0];
    const Y = [2.0, 3.5, 4.5, 6.0];
    const N = X.length;

    let m = 0.0;
    let c = 1.0; // start with slight offset for visual contrast

    // Coordinate conversion mapping:
    // X [0, 5] -> x_screen [0.1, 0.9]
    // Y [0, 8] -> y_screen [0.9, 0.1]
    const getXScreen = (val: number) => 0.1 + 0.8 * (val / 5);
    const getYScreen = (val: number) => {
      const screen = 0.9 - 0.8 * (val / 8);
      return Math.max(0.05, Math.min(0.95, screen)); // clamp within canvas
    };

    const getGraphNodes = (mVal: number, cVal: number): GraphNodeSnapshot[] => {
      // 1. Data point nodes
      const list: GraphNodeSnapshot[] = X.map((xVal, idx) => ({
        id: `P${idx}`,
        label: `P${idx}`,
        x: getXScreen(xVal),
        y: getYScreen(Y[idx]),
        subLabel: `(${xVal}, ${Y[idx]})`,
      }));

      // 2. Line end-point nodes to represent the regression line
      // L1 represents the left-end (X = 0, Y = c)
      // L2 represents the right-end (X = 5, Y = 5m + c)
      list.push({
        id: "L1",
        label: "L1",
        x: getXScreen(0),
        y: getYScreen(cVal),
        subLabel: `y = ${cVal.toFixed(2)}`,
      });

      list.push({
        id: "L2",
        label: "L2",
        x: getXScreen(5),
        y: getYScreen(5 * mVal + cVal),
        subLabel: `y = ${(5 * mVal + cVal).toFixed(2)}`,
      });

      return list;
    };

    const getGraphEdges = (): GraphEdgeSnapshot[] => [
      // Draw a line connecting L1 and L2 to represent the regression line y = mx + c
      {
        id: "e_line",
        fromId: "L1",
        toId: "L2",
        directed: false,
        weight: `y = ${m.toFixed(2)}x + ${c.toFixed(2)}`,
      },
    ];

    const getGraphHighlights = (
      hiActive?: Record<string, SemanticToken>,
    ): Record<string, SemanticToken> => {
      const h: Record<string, SemanticToken> = {};
      X.forEach((_, idx) => {
        h[`P${idx}`] = "sorted"; // green dots
      });
      h.L1 = "pointer";
      h.L2 = "pointer";
      h.e_line = "pointer"; // indigo regression line
      if (hiActive) {
        Object.assign(h, hiActive);
      }
      return h;
    };

    const makeVars = (
      epoch: number,
      mVal: number,
      cVal: number,
      avgLoss: number,
      dm: number = 0,
      dc: number = 0,
    ): VariableFrame[] => [
      { name: "Epoch", value: `${epoch}/${epochs}`, kind: "state", highlight: true },
      { name: "Learning Rate (lr)", value: lr.toFixed(3), kind: "number" },
      { name: "Slope (m)", value: mVal.toFixed(3), kind: "pointer" },
      { name: "Intercept (c)", value: cVal.toFixed(3), kind: "pointer" },
      { name: "Avg Loss (MSE)", value: avgLoss.toFixed(4), kind: "number", highlight: true },
      ...(epoch > 0
        ? ([
            { name: "Gradient ∂L/∂m", value: dm.toFixed(3), kind: "number" },
            { name: "Gradient ∂L/∂c", value: dc.toFixed(3), kind: "number" },
          ] as VariableFrame[])
        : []),
    ];

    // Compute initial loss
    let initialSumLoss = 0;
    for (let i = 0; i < N; i++) {
      initialSumLoss += Math.pow(m * X[i] + c - Y[i], 2);
    }
    let initialMSE = initialSumLoss / N;

    const rec = createRecorder({
      index: 0,
      title: "Initialize Model Parameters",
      description: `Model initialized to line: y = ${m.toFixed(1)}x + ${c.toFixed(1)}. Initial Mean Squared Error: ${initialMSE.toFixed(4)}.`,
      currentLine: 1,
      graphNodes: getGraphNodes(m, c),
      graphEdges: getGraphEdges(),
      graphHighlights: getGraphHighlights(),
      variables: makeVars(0, m, c, initialMSE),
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const snap = (
      mVal: number,
      cVal: number,
      hi: Record<string, SemanticToken>,
      title: string,
      line: number,
      desc: string,
      epoch: number,
      avgLoss: number,
      dm: number = 0,
      dc: number = 0,
    ) => {
      // Update weight label on the edge
      const edgesList = getGraphEdges();
      edgesList[0].weight = `y = ${mVal.toFixed(2)}x + ${cVal.toFixed(2)}`;

      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        graphNodes: getGraphNodes(mVal, cVal),
        graphEdges: edgesList,
        graphHighlights: getGraphHighlights(hi),
        variables: makeVars(epoch, mVal, cVal, avgLoss, dm, dc),
        comparisons: rec.comparisons,
        swaps: 0,
        writes: rec.writes,
      });
    };

    // Optimization Loop
    for (let ep = 1; ep <= epochs; ep++) {
      let totalLoss = 0;
      for (let i = 0; i < N; i++) {
        const pred = m * X[i] + c;
        totalLoss += Math.pow(pred - Y[i], 2);
      }
      const mse = totalLoss / N;

      snap(
        m,
        c,
        { L1: "compare", L2: "compare", e_line: "compare" },
        `Epoch ${ep}: Feedforward`,
        3,
        `Calculate points error relative to current line position. Average MSE = ${mse.toFixed(4)}.`,
        ep,
        mse,
      );

      // Compute Gradients
      let dm = 0;
      let dc = 0;
      for (let i = 0; i < N; i++) {
        const diff = m * X[i] + c - Y[i];
        dm += diff * X[i];
        dc += diff;
        rec.comparisons++;
      }
      dm = (2 * dm) / N;
      dc = (2 * dc) / N;

      snap(
        m,
        c,
        { P0: "compare", P1: "compare", P2: "compare", P3: "compare" },
        `Epoch ${ep}: Compute Gradients`,
        5,
        `Compute slope gradient (∂L/∂m = ${dm.toFixed(3)}) and intercept gradient (∂L/∂c = ${dc.toFixed(3)}).`,
        ep,
        mse,
        dm,
        dc,
      );

      // Update Weights
      m = m - lr * dm;
      c = c - lr * dc;
      rec.writes += 2;

      snap(
        m,
        c,
        { L1: "mutate", L2: "mutate", e_line: "mutate" },
        `Epoch ${ep}: Adjust Line`,
        6,
        `Adjust parameters: m ← ${m.toFixed(3)}, c ← ${c.toFixed(3)}. Watch the line shift on the canvas.`,
        ep,
        mse,
        dm,
        dc,
      );
    }

    // Done Step
    let finalLoss = 0;
    for (let i = 0; i < N; i++) {
      finalLoss += Math.pow(m * X[i] + c - Y[i], 2);
    }
    const finalMSE = finalLoss / N;

    const doneEdges = getGraphEdges();
    doneEdges[0].weight = `y = ${m.toFixed(2)}x + ${c.toFixed(2)}`;

    pushStep(rec, {
      title: "Model Optimization Complete ✓",
      description: `Final optimized line model: y = ${m.toFixed(3)}x + ${c.toFixed(3)} with Mean Squared Error (MSE) = ${finalMSE.toFixed(4)}.`,
      currentLine: 6,
      graphNodes: getGraphNodes(m, c),
      graphEdges: doneEdges,
      graphHighlights: getGraphHighlights({ L1: "sorted", L2: "sorted", e_line: "sorted" }),
      variables: makeVars(epochs, m, c, finalMSE),
      comparisons: rec.comparisons,
      swaps: 0,
      writes: rec.writes,
    });

    return rec.steps;
  },
};
