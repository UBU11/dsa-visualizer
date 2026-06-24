// lib/algorithms/selfAttention.ts

import type {
  AlgorithmDefinition,
  DPCell,
  HistoryStep,
  VariableFrame,
  SemanticToken,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

const getQ = (token: string): [number, number] => {
  const t = token.toLowerCase();
  if (t === "the") return [1, 0];
  if (t === "cat") return [0, 1];
  if (t === "sat") return [1, 1];
  const val = (token.charCodeAt(0) || 0) % 3;
  if (val === 0) return [1, 0];
  if (val === 1) return [0, 1];
  return [1, 1];
};

const getK = (token: string): [number, number] => {
  const t = token.toLowerCase();
  if (t === "the") return [1, 0];
  if (t === "cat") return [0, 1];
  if (t === "sat") return [1, 1];
  const val = (token.charCodeAt(token.length - 1) || 0) % 3;
  if (val === 0) return [1, 0];
  if (val === 1) return [0, 1];
  return [1, 1];
};

const getV = (token: string): [number, number] => {
  const t = token.toLowerCase();
  if (t === "the") return [10, 20];
  if (t === "cat") return [30, 40];
  if (t === "sat") return [50, 60];
  const val = ((token.charCodeAt(0) || 0) % 5) * 10 + 10;
  return [val, val + 10];
};

export const selfAttention: AlgorithmDefinition = {
  id: "self-attention",
  name: "Transformer Self-Attention",
  category: "Machine Learning",
  structure: "dp",
  summary:
    "Simulates a single Self-Attention head in a Transformer model. Displays Query-Key dot products, scaling, Softmax, and Value weighted sum.",
  pseudocode: [
    { line: 1, text: "Project input embeddings to Q (Query), K (Key), and V (Value)" },
    { line: 2, text: "Compute raw attention scores: S_ij = Q_i · K_j" },
    { line: 3, text: "Scale scores: S'_ij = S_ij / √d_k  (d_k = 2)" },
    { line: 4, text: "Apply Softmax row-wise to get attention weights W_ij" },
    { line: 5, text: "Compute Output: O_i = Σ_j (W_ij * V_j)" },
  ],
  configFields: [
    {
      key: "token0",
      label: "Token 0",
      kind: "text",
      default: "The",
    },
    {
      key: "token1",
      label: "Token 1",
      kind: "text",
      default: "cat",
    },
    {
      key: "token2",
      label: "Token 2",
      kind: "text",
      default: "sat",
    },
  ],
  run(cfg) {
    const t0 = String(cfg.token0 || "The").trim();
    const t1 = String(cfg.token1 || "cat").trim();
    const t2 = String(cfg.token2 || "sat").trim();
    const tokens = [t0, t1, t2];

    const q = tokens.map(getQ);
    const k = tokens.map(getK);
    const v = tokens.map(getV);

    const getCells = (
      matrix: (number | string)[][],
      highlights?: Record<string, SemanticToken>,
      deps?: { r: number; c: number }[],
      currentPos?: { r: number; c: number },
    ): DPCell[] => {
      const list: DPCell[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const key = `${r},${c}`;
          const hl = highlights?.[key];
          const isCurrent = currentPos?.r === r && currentPos?.c === c;
          list.push({
            row: r,
            col: c,
            value: typeof matrix[r][c] === "number" ? (matrix[r][c] as number).toFixed(2) : String(matrix[r][c]),
            highlight: hl,
            isCurrent,
            isDependency: deps?.some((d) => d.r === r && d.c === c) ?? false,
          });
        }
      }
      return list;
    };

    const makeVars = (actionText: string, extra: VariableFrame[] = []): VariableFrame[] => {
      const base: VariableFrame[] = [
        { name: "Tokens", value: tokens.join(" "), kind: "string" },
        { name: "d_k (Query/Key dim)", value: 2, kind: "number" },
        { name: "Action State", value: actionText, kind: "state", highlight: true },
      ];
      // Format Q, K, V vectors as variables
      for (let i = 0; i < 3; i++) {
        base.push({ name: `Q[${tokens[i]}]`, value: `[${q[i].join(", ")}]`, kind: "pointer" });
        base.push({ name: `K[${tokens[i]}]`, value: `[${k[i].join(", ")}]`, kind: "pointer" });
        base.push({ name: `V[${tokens[i]}]`, value: `[${v[i].join(", ")}]`, kind: "pointer" });
      }
      return [...base, ...extra];
    };

    // 3x3 attention matrices
    const scores = Array(3).fill(0).map(() => Array(3).fill(0));

    const rec = createRecorder({
      index: 0,
      title: "Initialize Q, K, V Matrices",
      description: "Map input tokens to Query (Q), Key (K), and Value (V) projections.",
      currentLine: 1,
      dpRows: 3,
      dpCols: 3,
      dpCells: getCells(scores),
      dpRowLabels: tokens,
      dpColLabels: tokens,
      variables: makeVars("Initialized Projections"),
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const snap = (
      matrix: (number | string)[][],
      hi: Record<string, SemanticToken>,
      title: string,
      line: number,
      actionText: string,
      desc: string,
      deps?: { r: number; c: number }[],
      curr?: { r: number; c: number },
      extraVars: VariableFrame[] = [],
    ) => {
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        dpRows: 3,
        dpCols: 3,
        dpCells: getCells(matrix, hi, deps, curr),
        dpRowLabels: tokens,
        dpColLabels: tokens,
        variables: makeVars(actionText, extraVars),
        comparisons: rec.comparisons,
        swaps: 0,
        writes: rec.writes,
      });
    };

    // --- STEP 2: Compute Raw Attention Scores S_ij = Q_i · K_j ---
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const qi = q[r];
        const kj = k[c];
        const dot = qi[0] * kj[0] + qi[1] * kj[1];
        scores[r][c] = dot;
        rec.comparisons++;

        snap(
          scores,
          { [`${r},${c}`]: "compare" },
          `Score S[${r}, ${c}]`,
          2,
          `Compute S[${tokens[r]} · ${tokens[c]}]`,
          `Dot product: Q_${tokens[r]} · K_${tokens[c]} = [${qi.join(", ")}] · [${kj.join(", ")}] = ${dot}`,
          undefined,
          { r, c },
        );

        snap(
          scores,
          { [`${r},${c}`]: "mutate" },
          `Store S[${r}, ${c}] = ${dot}`,
          2,
          `Stored Raw Score`,
          `Recorded raw attention score ${dot} in state.`,
          undefined,
          { r, c },
        );
      }
    }

    // --- STEP 3: Scale Scores S'_ij = S_ij / √d_k (d_k = 2) ---
    const scaleFactor = Math.sqrt(2);
    const scaled = Array(3).fill(0).map(() => Array(3).fill(0));

    snap(
      scores,
      {},
      "Scale Attention Scores",
      3,
      "Dividing by √d_k (√2 ≈ 1.41)",
      "Dividing attention scores by √d_k prevents dot-products from growing extremely large in high dimensions, keeping gradients stable.",
    );

    for (let r = 0; r < 3; r++) {
      const hi: Record<string, SemanticToken> = {};
      for (let c = 0; c < 3; c++) {
        scaled[r][c] = scores[r][c] / scaleFactor;
        hi[`${r},${c}`] = "mutate";
        rec.writes++;
      }
      snap(
        scaled,
        hi,
        `Scale Row: ${tokens[r]}`,
        3,
        `Scaling Row ${r}`,
        `Scaled attention scores for token "${tokens[r]}" by dividing by 1.414.`,
      );
    }

    // --- STEP 4: Softmax ---
    const weights = Array(3).fill(0).map(() => Array(3).fill(0));

    for (let r = 0; r < 3; r++) {
      const exp = [Math.exp(scaled[r][0]), Math.exp(scaled[r][1]), Math.exp(scaled[r][2])];
      const sum = exp[0] + exp[1] + exp[2];

      const hi: Record<string, SemanticToken> = {};
      for (let c = 0; c < 3; c++) hi[`${r},${c}`] = "compare";

      snap(
        scaled,
        hi,
        `Softmax Row: ${tokens[r]}`,
        4,
        `Computing Softmax Row ${r}`,
        `Exponentiating row scores: [e^${scaled[r][0].toFixed(2)}, e^${scaled[r][1].toFixed(2)}, e^${scaled[r][2].toFixed(
          2,
        )}] = [${exp[0].toFixed(2)}, ${exp[1].toFixed(2)}, ${exp[2].toFixed(2)}]. Sum = ${sum.toFixed(2)}`,
      );

      for (let c = 0; c < 3; c++) {
        weights[r][c] = exp[c] / sum;
        hi[`${r},${c}`] = "mutate";
        rec.writes++;
      }

      snap(
        weights,
        hi,
        `Attention Weights: ${tokens[r]}`,
        4,
        `Softmax Normalization Row ${r}`,
        `Normalized scores sum to 1.00: [${weights[r][0].toFixed(2)}, ${weights[r][1].toFixed(
          2,
        )}, ${weights[r][2].toFixed(2)}]`,
      );
    }

    // --- STEP 5: Compute Output O_i = Σ_j (W_ij * V_j) ---
    const output: [number, number][] = [];

    for (let r = 0; r < 3; r++) {
      // Highlight the row weights and show dependencies on columns (the values)
      const hi: Record<string, SemanticToken> = {};
      for (let c = 0; c < 3; c++) hi[`${r},${c}`] = "pointer";

      // Calculate output vector
      const o0 = weights[r][0] * v[0][0] + weights[r][1] * v[1][0] + weights[r][2] * v[2][0];
      const o1 = weights[r][0] * v[0][1] + weights[r][1] * v[1][1] + weights[r][2] * v[2][1];
      output.push([o0, o1]);
      rec.writes++;

      // We mark cells in column 0, 1, 2 as dependencies for this row calculation to draw arrows!
      const deps = [
        { r: r, c: 0 },
        { r: r, c: 1 },
        { r: r, c: 2 },
      ];

      snap(
        weights,
        hi,
        `Output Vector for "${tokens[r]}"`,
        5,
        `Computing Output O_${r}`,
        `Output O_${r} is the weighted sum of Value vectors: W[0]*V[0] + W[1]*V[1] + W[2]*V[2].
         Result vector: [${o0.toFixed(2)}, ${o1.toFixed(2)}]`,
        deps,
        undefined,
        [{ name: `Output O[${tokens[r]}]`, value: `[${o0.toFixed(2)}, ${o1.toFixed(2)}]`, kind: "state", highlight: true }],
      );
    }

    // Final converged step
    const finalHl: Record<string, SemanticToken> = {};
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) finalHl[`${r},${c}`] = "sorted";
    }

    const finalOutputs: VariableFrame[] = output.map((o, idx) => ({
      name: `Output O[${tokens[idx]}]`,
      value: `[${o[0].toFixed(2)}, ${o[1].toFixed(2)}]`,
      kind: "state",
      highlight: true,
    }));

    pushStep(rec, {
      title: "Self-Attention Complete ✓",
      description: "Calculated contextual representations for all tokens. Each output vector integrates context from neighbors based on attention weights.",
      currentLine: 5,
      dpRows: 3,
      dpCols: 3,
      dpCells: getCells(weights, finalHl),
      dpRowLabels: tokens,
      dpColLabels: tokens,
      variables: makeVars("Contextualization Complete", finalOutputs),
      comparisons: rec.comparisons,
      swaps: 0,
      writes: rec.writes,
    });

    return rec.steps;
  },
};
