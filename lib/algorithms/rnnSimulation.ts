// lib/algorithms/rnnSimulation.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
  VariableFrame,
  SemanticToken,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const rsaSimulation = null; // safe anchor

export const rnnSimulation: AlgorithmDefinition = {
  id: "rnn-simulation",
  name: "Recurrent Neural Network (RNN)",
  category: "Machine Learning",
  structure: "graph",
  summary:
    "Simulates a recurrent neural network cell unrolled over time. Watch context loop back into the hidden state via the self-loop to predict the next word.",
  pseudocode: [
    { line: 1, text: "For each input token x_t in sequence:" },
    { line: 2, text: "  Feed x_t into input layer (weight W_xh)" },
    { line: 3, text: "  Update hidden state: h_t = tanh(W_hh * h_{t-1} + W_xh * x_t + b)" },
    { line: 4, text: "  Compute output logits: y_t = W_hy * h_t + b_y" },
    { line: 5, text: "  Apply Softmax to select the highest-probability next word" },
  ],
  configFields: [
    {
      key: "sentence",
      label: "Input Sentence (max 4 words)",
      kind: "text",
      default: "Machine learning is awesome",
    },
  ],
  run(cfg) {
    const rawSent = String(cfg.sentence || "Machine learning is awesome").trim();
    const tokens = rawSent.split(/\s+/).slice(0, 4);
    const N = tokens.length;

    // Fixed mock vocabulary predictions per token in sequence
    // Predicts: Machine -> learning -> is -> awesome -> !
    const vocabularyList: Record<string, { word: string; prob: number }[]> = {
      machine: [
        { word: "learning", prob: 0.82 },
        { word: "translation", prob: 0.12 },
        { word: "vision", prob: 0.04 },
        { word: "learning-rate", prob: 0.02 },
      ],
      learning: [
        { word: "is", prob: 0.88 },
        { word: "rate", prob: 0.06 },
        { word: "models", prob: 0.04 },
        { word: "algorithms", prob: 0.02 },
      ],
      is: [
        { word: "awesome", prob: 0.79 },
        { word: "fun", prob: 0.12 },
        { word: "hard", prob: 0.06 },
        { word: "great", prob: 0.03 },
      ],
      awesome: [
        { word: "!", prob: 0.95 },
        { word: ".", prob: 0.04 },
        { word: "indeed", prob: 0.01 },
      ],
    };

    // Predefined mock hidden state vectors
    const hiddenStates = [
      "[+0.62, -0.15]",
      "[-0.24, +0.78]",
      "[+0.83, +0.12]",
      "[-0.05, -0.64]",
    ];

    const getPredictionInfo = (token: string) => {
      const key = token.toLowerCase();
      const list = vocabularyList[key] || [{ word: "...", prob: 1.0 }];
      return {
        word: list[0].word,
        prob: list[0].prob,
        dist: list,
      };
    };

    // Graph node mapping:
    // Input x_t at bottom, Hidden h_t in middle, Output y_t at top
    const getNodes = (
      inputVal: string,
      hiddenVal: string,
      outputVal: string,
      inputSub = "Input token x_t",
      hiddenSub = "Hidden state h_t",
      outputSub = "Next-word Prediction",
    ): GraphNodeSnapshot[] => [
      { id: "X_t", label: inputVal, x: 0.5, y: 0.75, subLabel: inputSub },
      { id: "H_t", label: hiddenVal, x: 0.5, y: 0.45, subLabel: hiddenSub },
      { id: "Y_t", label: outputVal, x: 0.5, y: 0.15, subLabel: outputSub },
    ];

    const getEdges = (
      e_xh_w: string | number = "W_xh",
      e_hh_w: string | number = "W_hh (recurrent)",
      e_hy_w: string | number = "W_hy",
    ): GraphEdgeSnapshot[] => [
      { id: "e_xh", fromId: "X_t", toId: "H_t", directed: true, weight: e_xh_w },
      { id: "e_hh", fromId: "H_t", toId: "H_t", directed: true, weight: e_hh_w },
      { id: "e_hy", fromId: "H_t", toId: "Y_t", directed: true, weight: e_hy_w },
    ];

    const makeVars = (
      stepTitle: string,
      t: number,
      wordDist: { word: string; prob: number }[] = [],
      hPrevVal = "None [0,0]",
    ): VariableFrame[] => {
      const list: VariableFrame[] = [
        { name: "Timestep t", value: `${t}/${N - 1}`, kind: "state", highlight: true },
        { name: "Action State", value: stepTitle, kind: "state" },
      ];

      if (t >= 0 && t < N) {
        list.push({ name: `Current word x_t`, value: tokens[t], kind: "string" });
        list.push({ name: `Prev hidden h_{t-1}`, value: hPrevVal, kind: "pointer" });
        list.push({ name: `Current hidden h_t`, value: hiddenStates[t], kind: "pointer" });
      }

      if (wordDist.length > 0) {
        list.push({ name: "Vocabulary Probabilities", value: "----------------", kind: "state" });
        wordDist.slice(0, 4).forEach((v, idx) => {
          list.push({
            name: `P("${v.word}")`,
            value: (v.prob * 100).toFixed(1) + "%",
            kind: "number",
            highlight: idx === 0,
          });
        });
      }

      return list;
    };

    const rec = createRecorder({
      index: 0,
      title: "Initialize RNN Cell Architecture",
      description: `Unrolling RNN for a sequence of ${N} tokens: [${tokens.join(", ")}]. Hidden state initialized to h_{-1} = [0,0].`,
      currentLine: 1,
      graphNodes: getNodes("x_t", "h_{-1}", "y_t", "Input", "h_{-1} = [0, 0]", "Prediction"),
      graphEdges: getEdges(),
      graphHighlights: {},
      variables: makeVars("Architecture Initialized", -1),
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const snap = (
      hi: Record<string, SemanticToken>,
      edgesList: GraphEdgeSnapshot[],
      title: string,
      line: number,
      actionText: string,
      desc: string,
      nodesList: GraphNodeSnapshot[],
      t: number,
      dist: { word: string; prob: number }[] = [],
      hPrev = "None [0,0]",
    ) => {
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        graphNodes: nodesList,
        graphEdges: edgesList,
        graphHighlights: hi,
        variables: makeVars(actionText, t, dist, hPrev),
        comparisons: rec.comparisons,
        swaps: 0,
        writes: rec.writes,
      });
    };

    // Unroll and simulate cell operations
    for (let t = 0; t < N; t++) {
      const currentToken = tokens[t];
      const hPrevVal = t === 0 ? "[0.0, 0.0]" : hiddenStates[t - 1];
      const hCurrVal = hiddenStates[t];
      const predInfo = getPredictionInfo(currentToken);

      // STEP A: Load input x_t
      snap(
        { X_t: "compare", e_xh: "compare" },
        getEdges(`x_t = "${currentToken}"`),
        `t = ${t}: Input x_t`,
        2,
        "Read Input Token",
        `Read current input token x_${t} = "${currentToken}" into input layer.`,
        getNodes(currentToken, hPrevVal, "-", `Input x_${t}`, `h_{t-1} = ${hPrevVal}`, `y_${t} (predicting...)`),
        t,
        undefined,
        hPrevVal,
      );

      // STEP B: Hidden State Update & Recurrent Self-Loop
      rec.comparisons++;
      snap(
        { X_t: "pointer", H_t: "mutate", e_xh: "pointer", e_hh: "mutate" },
        getEdges(`x_t = "${currentToken}"`, `h_{t-1} = ${hPrevVal}`),
        `t = ${t}: Update Hidden h_t`,
        3,
        "Compute Hidden Recurrence",
        `Update hidden vector: h_${t} = tanh(W_hh * h_{t-1} + W_xh * x_t + b) = ${hCurrVal}. Notice the loop edge combining historical context!`,
        getNodes(currentToken, hCurrVal, "-", `Input x_${t}`, `h_${t} = ${hCurrVal}`, `y_${t} (predicting...)`),
        t,
        undefined,
        hPrevVal,
      );

      // STEP C: Compute Output logits and next word probabilities
      snap(
        { H_t: "compare", Y_t: "compare", e_hy: "compare" },
        getEdges(undefined, undefined, "Compute logits"),
        `t = ${t}: Output Logits y_t`,
        4,
        "Compute logits",
        `Multiply hidden state h_${t} by output projection weights: y_${t} = W_hy * h_${t} + b_y. Softmax is evaluated.`,
        getNodes(currentToken, hCurrVal, "?", `Input x_${t}`, `h_${t} = ${hCurrVal}`, "Evaluating vocabulary..."),
        t,
        predInfo.dist,
        hPrevVal,
      );

      // STEP D: Softmax output prediction
      rec.writes++;
      snap(
        { H_t: "sorted", Y_t: "mutate", e_hy: "mutate" },
        getEdges(undefined, undefined, `Next: "${predInfo.word}"`),
        `t = ${t}: Predict next word`,
        5,
        `Softmax: Predict "${predInfo.word}"`,
        `Softmax selects "${predInfo.word}" with ${Math.round(predInfo.prob * 100)}% probability as the next word.`,
        getNodes(currentToken, hCurrVal, predInfo.word, `Input x_${t}`, `h_${t} = ${hCurrVal}`, `Prediction: "${predInfo.word}"`),
        t,
        predInfo.dist,
        hPrevVal,
      );
    }

    // Done Step
    pushStep(rec, {
      title: "RNN Sequence Complete ✓",
      description: `All ${N} tokens processed successfully. Final predicted sequence: [${tokens.map(
        (t) => `"${t}"→"${getPredictionInfo(t).word}"`,
      ).join(", ")}].`,
      currentLine: 5,
      graphNodes: getNodes("Done", hiddenStates[N - 1], "Complete", "Tokens Processed", "Final Hidden state", "Sequence Completed"),
      graphEdges: getEdges(),
      graphHighlights: { X_t: "sorted", H_t: "sorted", Y_t: "sorted" },
      variables: makeVars("Recurrence Complete", N - 1),
      comparisons: rec.comparisons,
      swaps: 0,
      writes: rec.writes,
    });

    return rec.steps;
  },
};
