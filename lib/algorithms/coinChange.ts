// lib/algorithms/coinChange.ts

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const coinChange: AlgorithmDefinition = {
  id: "coin-change",
  name: "Coin Change (DP)",
  category: "DP",
  structure: "dp",
  summary: "Minimum coins to make amount. dp[i] = min(dp[i-c]+1) over coin denominations. Row = amount.",
  pseudocode: [
    { line: 1, text: "dp[0] ← 0, dp[i] ← ∞" },
    { line: 2, text: "for i from 1 to amount:" },
    { line: 3, text: "  for each coin c:" },
    { line: 4, text: "    if i ≥ c: dp[i] ← min(dp[i], dp[i-c]+1)" },
  ],
  configFields: [
    { key: "amount", label: "Amount", kind: "number", min: 4, max: 14, step: 1, default: 11 },
    { key: "coins", label: "Coins (CSV)", kind: "text", default: "1,3,4" },
  ],
  run(cfg) {
    const amount = Number(cfg.amount) || 11;
    const coins = String(cfg.coins || "1,3,4").split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
    const dp: number[] = Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    const rec = createRecorder({
      index: 0,
      title: "Init",
      currentLine: 1,
      dpRows: 1,
      dpCols: amount + 1,
      dpCells: Array.from({ length: amount + 1 }, (_, i) => ({
        row: 0,
        col: i,
        value: i === 0 ? 0 : "∞",
      })),
      dpRowLabels: ["dp"],
      dpColLabels: Array.from({ length: amount + 1 }, (_, i) => String(i)),
      variables: [{ name: "coins", value: `[${coins.join(", ")}]`, kind: "pointer" }],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    for (let i = 1; i <= amount; i++) {
      for (const c of coins) {
        if (i >= c) {
          const candidate = dp[i - c] + 1;
          const cells = Array.from({ length: amount + 1 }, (_, j) => {
            const isCurrent = j === i;
            const isDep = j === i - c;
            const isBetter = isDep && candidate < dp[i];
            return {
              row: 0,
              col: j,
              value: dp[j] === Infinity ? "∞" : dp[j],
              isCurrent,
              isDependency: isDep,
              highlight: isCurrent
                ? ("mutate" as const)
                : isDep
                  ? ("compare" as const)
                  : undefined,
            };
          });
          pushStep(rec, {
            title: `dp[${i}] = min(dp[${i}], dp[${i - c}]+1) = min(${dp[i] === Infinity ? "∞" : dp[i]}, ${candidate})`,
            currentLine: 4,
            dpRows: 1,
            dpCols: amount + 1,
            dpCells: cells,
            dpRowLabels: ["dp"],
            dpColLabels: Array.from({ length: amount + 1 }, (_, j) => String(j)),
            variables: [
              { name: "i", value: i, kind: "number" },
              { name: "coin c", value: c, kind: "number" },
              { name: "candidate", value: candidate, kind: "pointer" },
            ],
            comparisons: i,
            swaps: 0,
            writes: i,
          });
          if (candidate < dp[i]) {
            dp[i] = candidate;
          }
        }
      }
    }
    const allCells = Array.from({ length: amount + 1 }, (_, j) => ({
      row: 0,
      col: j,
      value: dp[j] === Infinity ? "∞" : dp[j],
      highlight: "sorted" as const,
    }));
    pushStep(rec, {
      title: "Done ✓",
      description: dp[amount] === Infinity ? "impossible" : `min coins = ${dp[amount]}`,
      currentLine: 4,
      dpRows: 1,
      dpCols: amount + 1,
      dpCells: allCells,
      dpRowLabels: ["dp"],
      dpColLabels: Array.from({ length: amount + 1 }, (_, j) => String(j)),
      variables: [{ name: "dp[amount]", value: dp[amount] === Infinity ? "∞" : dp[amount], kind: "pointer", highlight: true }],
      comparisons: amount,
      swaps: 0,
      writes: amount,
    });
    return rec.steps;
  },
};