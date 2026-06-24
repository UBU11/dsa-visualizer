// lib/algorithms/knapsack.ts

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const knapsack: AlgorithmDefinition = {
  id: "knapsack-01",
  name: "0/1 Knapsack",
  category: "DP",
  structure: "dp",
  summary: "dp[i][w] = max(dp[i-1][w], dp[i-1][w-w_i]+v_i). Items along rows, capacity along columns.",
  pseudocode: [
    { line: 1, text: "for i from 1 to n:" },
    { line: 2, text: "  for w from 0 to W:" },
    { line: 3, text: "    if w_i ≤ w: dp[i][w] ← max(dp[i-1][w], dp[i-1][w-w_i]+v_i)" },
    { line: 4, text: "    else: dp[i][w] ← dp[i-1][w]" },
  ],
  configFields: [
    { key: "items", label: "Items (CSV w:v)", kind: "text", default: "2:3,3:4,4:5,5:6" },
    { key: "W", label: "Capacity", kind: "number", min: 4, max: 12, step: 1, default: 8 },
  ],
  run(cfg) {
    const items = String(cfg.items || "2:3,3:4,4:5,5:6")
      .split(",")
      .map((s) => s.trim().split(":").map(Number))
      .filter((p) => p.length === 2 && !p.some(Number.isNaN))
      .map(([w, v]) => ({ w, v }));
    const W = Number(cfg.W) || 8;
    const n = items.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
    const rec = createRecorder({
      index: 0,
      title: "Init dp table",
      currentLine: 1,
      dpRows: n + 1,
      dpCols: W + 1,
      dpCells: Array.from({ length: (n + 1) * (W + 1) }, (_, idx) => ({
        row: Math.floor(idx / (W + 1)),
        col: idx % (W + 1),
        value: 0,
      })),
      dpRowLabels: items.map((it, i) => `i=${i + 1}(w${it.w},v${it.v})`),
      dpColLabels: Array.from({ length: W + 1 }, (_, i) => String(i)),
      variables: [{ name: "W", value: W, kind: "number" }],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= W; w++) {
        const cells = Array.from({ length: (n + 1) * (W + 1) }, (_, idx) => {
          const r = Math.floor(idx / (W + 1));
          const c = idx % (W + 1);
          const isCurrent = r === i && c === w;
          const isDep = r === i - 1 && (c === w || c === w - items[i - 1].w);
          return {
            row: r,
            col: c,
            value: dp[r][c],
            isCurrent,
            isDependency: isDep,
            highlight: isCurrent
              ? ("compare" as const)
              : isDep
                ? ("pointer" as const)
                : undefined,
          };
        });
        pushStep(rec, {
          title: `dp[${i}][${w}] = max(dp[${i - 1}][${w}], dp[${i - 1}][${w - items[i - 1].w}]+${items[i - 1].v})`,
          currentLine: 3,
          dpRows: n + 1,
          dpCols: W + 1,
          dpCells: cells,
          dpRowLabels: items.map((it, k) => `i=${k + 1}(w${it.w},v${it.v})`),
          dpColLabels: Array.from({ length: W + 1 }, (_, j) => String(j)),
          variables: [
            { name: "i", value: i, kind: "number" },
            { name: "w", value: w, kind: "number" },
            { name: "item w_i", value: items[i - 1].w, kind: "number" },
          ],
          comparisons: i * (W + 1),
          swaps: 0,
          writes: i * (W + 1),
        });
        if (items[i - 1].w <= w) {
          dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - items[i - 1].w] + items[i - 1].v);
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }
    const allCells = Array.from({ length: (n + 1) * (W + 1) }, (_, idx) => {
      const r = Math.floor(idx / (W + 1));
      const c = idx % (W + 1);
      return {
        row: r,
        col: c,
        value: dp[r][c],
        highlight: "sorted" as const,
      };
    });
    pushStep(rec, {
      title: `Done ✓  max value = ${dp[n][W]}`,
      currentLine: 3,
      dpRows: n + 1,
      dpCols: W + 1,
      dpCells: allCells,
      dpRowLabels: items.map((it, k) => `i=${k + 1}(w${it.w},v${it.v})`),
      dpColLabels: Array.from({ length: W + 1 }, (_, j) => String(j)),
      variables: [{ name: "dp[n][W]", value: dp[n][W], kind: "pointer", highlight: true }],
      comparisons: n * (W + 1),
      swaps: 0,
      writes: n * (W + 1),
    });
    return rec.steps;
  },
};