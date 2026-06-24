// lib/algorithms/fibonacci.ts

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const fibonacci: AlgorithmDefinition = {
  id: "fib-tabulation",
  name: "Fibonacci (Tabulation)",
  category: "DP",
  structure: "dp",
  summary: "Bottom-up DP: dp[i] = dp[i-1] + dp[i-2]. Active cell amber, dependency cells highlighted.",
  pseudocode: [
    { line: 1, text: "dp[0] ← 0, dp[1] ← 1" },
    { line: 2, text: "for i from 2 to n:" },
    { line: 3, text: "  dp[i] ← dp[i-1] + dp[i-2]" },
  ],
  configFields: [
    { key: "n", label: "n", kind: "number", min: 5, max: 14, step: 1, default: 9 },
  ],
  run(cfg) {
    const n = Number(cfg.n) || 9;
    const dp: number[] = Array(n).fill(0);
    dp[0] = 0;
    dp[1] = 1;
    const rec = createRecorder({
      index: 0,
      title: `Compute Fibonacci up to n=${n}`,
      currentLine: 1,
      dpRows: 1,
      dpCols: n,
      dpCells: Array.from({ length: n }, (_, i) => ({
        row: 0,
        col: i,
        value: i < 2 ? dp[i] : "",
        isCurrent: false,
      })),
      dpRowLabels: ["F(i)"],
      dpColLabels: Array.from({ length: n }, (_, i) => String(i)),
      variables: [],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    for (let i = 2; i < n; i++) {
      const cells = Array.from({ length: n }, (_, j) => {
        const isCurrent = j === i;
        const isDep = j === i - 1 || j === i - 2;
        return {
          row: 0,
          col: j,
          value: dp[j] ?? "",
          isCurrent,
          isDependency: isDep,
          highlight: isCurrent ? ("compare" as const) : isDep ? ("pointer" as const) : undefined,
        };
      });
      pushStep(rec, {
        title: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]}`,
        currentLine: 3,
        dpRows: 1,
        dpCols: n,
        dpCells: cells,
        dpRowLabels: ["F(i)"],
        dpColLabels: Array.from({ length: n }, (_, j) => String(j)),
        variables: [
          { name: "i", value: i, kind: "number" },
          { name: "dp[i-1]", value: dp[i - 1], kind: "number" },
          { name: "dp[i-2]", value: dp[i - 2], kind: "number" },
        ],
        comparisons: i - 1,
        swaps: 0,
        writes: i - 1,
      });
      dp[i] = dp[i - 1] + dp[i - 2];
      const finalCells = Array.from({ length: n }, (_, j) => ({
        row: 0,
        col: j,
        value: dp[j],
        highlight: j <= i ? ("sorted" as const) : undefined,
      }));
      pushStep(rec, {
        title: `dp[${i}] = ${dp[i]}`,
        currentLine: 3,
        dpRows: 1,
        dpCols: n,
        dpCells: finalCells,
        dpRowLabels: ["F(i)"],
        dpColLabels: Array.from({ length: n }, (_, j) => String(j)),
        variables: [{ name: "dp[i]", value: dp[i], kind: "pointer", highlight: true }],
        comparisons: i,
        swaps: 0,
        writes: i,
      });
    }

    const allCells = Array.from({ length: n }, (_, j) => ({
      row: 0,
      col: j,
      value: dp[j],
      highlight: "sorted" as const,
    }));
    pushStep(rec, {
      title: "Done ✓",
      description: dp.join(", "),
      currentLine: 3,
      dpRows: 1,
      dpCols: n,
      dpCells: allCells,
      dpRowLabels: ["F(i)"],
      dpColLabels: Array.from({ length: n }, (_, j) => String(j)),
      variables: [
        { name: "result", value: dp[n - 1], kind: "pointer", highlight: true },
      ],
      comparisons: n - 1,
      swaps: 0,
      writes: n - 1,
    });
    return rec.steps;
  },
};