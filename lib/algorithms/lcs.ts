// lib/algorithms/lcs.ts

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const lcs: AlgorithmDefinition = {
  id: "lcs",
  name: "Longest Common Subsequence",
  category: "DP",
  structure: "dp",
  summary: "Standard 2D DP for LCS length. Matches bump diagonally, mismatches take max of left/top.",
  pseudocode: [
    { line: 1, text: "for i from 1 to n:" },
    { line: 2, text: "  for j from 1 to m:" },
    { line: 3, text: "    if A[i]==B[j]: dp[i][j] ← dp[i-1][j-1]+1" },
    { line: 4, text: "    else: dp[i][j] ← max(dp[i-1][j], dp[i][j-1])" },
  ],
  configFields: [
    { key: "A", label: "String A", kind: "text", default: "ABCBDAB" },
    { key: "B", label: "String B", kind: "text", default: "BDCABA" },
  ],
  run(cfg) {
    const A = String(cfg.A || "ABCBDAB");
    const B = String(cfg.B || "BDCABA");
    const n = A.length;
    const m = B.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    const initCells: { row: number; col: number; value: number | string }[] = [];
    for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) initCells.push({ row: i, col: j, value: 0 });
    const rec = createRecorder({
      index: 0,
      title: "Init",
      currentLine: 1,
      dpRows: n + 1,
      dpCols: m + 1,
      dpCells: initCells,
      dpRowLabels: ["∅", ...A.split("")],
      dpColLabels: ["∅", ...B.split("")],
      variables: [
        { name: "A", value: A, kind: "pointer" },
        { name: "B", value: B, kind: "pointer" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const match = A[i - 1] === B[j - 1];
        const cells = Array.from({ length: (n + 1) * (m + 1) }, (_, idx) => {
          const r = Math.floor(idx / (m + 1));
          const c = idx % (m + 1);
          const isCurrent = r === i && c === j;
          const isDep = (r === i - 1 && c === j - 1) || (r === i - 1 && c === j) || (r === i && c === j - 1);
          return {
            row: r,
            col: c,
            value: dp[r][c],
            isCurrent,
            isDependency: isDep,
            highlight: isCurrent
              ? (match ? "mutate" as const : "compare" as const)
              : isDep
                ? "pointer" as const
                : undefined,
          };
        });
        pushStep(rec, {
          title: match
            ? `match "${A[i - 1]}" — dp[${i}][${j}] = dp[${i - 1}][${j - 1}]+1`
            : `mismatch "${A[i - 1]}" vs "${B[j - 1]}" — dp[${i}][${j}] = max(left, top)`,
          currentLine: 3,
          dpRows: n + 1,
          dpCols: m + 1,
          dpCells: cells,
          dpRowLabels: ["∅", ...A.split("")],
          dpColLabels: ["∅", ...B.split("")],
          variables: [
            { name: "i", value: i, kind: "number" },
            { name: "j", value: j, kind: "number" },
            { name: "A[i-1]", value: A[i - 1], kind: "pointer" },
            { name: "B[j-1]", value: B[j - 1], kind: "pointer" },
          ],
          comparisons: i * j,
          swaps: 0,
          writes: i * j,
        });
        if (match) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    const allCells = Array.from({ length: (n + 1) * (m + 1) }, (_, idx) => {
      const r = Math.floor(idx / (m + 1));
      const c = idx % (m + 1);
      return { row: r, col: c, value: dp[r][c], highlight: "sorted" as const };
    });
    pushStep(rec, {
      title: `Done ✓  LCS length = ${dp[n][m]}`,
      currentLine: 4,
      dpRows: n + 1,
      dpCols: m + 1,
      dpCells: allCells,
      dpRowLabels: ["∅", ...A.split("")],
      dpColLabels: ["∅", ...B.split("")],
      variables: [{ name: "LCS length", value: dp[n][m], kind: "pointer", highlight: true }],
      comparisons: n * m,
      swaps: 0,
      writes: n * m,
    });
    return rec.steps;
  },
};