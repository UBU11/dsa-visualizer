// lib/algorithms/nQueens.ts

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const nQueens: AlgorithmDefinition = {
  id: "n-queens",
  name: "N-Queens",
  category: "Backtracking",
  structure: "backtrack",
  summary: "Backtracking placement: try a queen in each column of the current row, recurse; on conflict, rose-fade and backtrack.",
  pseudocode: [
    { line: 1, text: "place(row):" },
    { line: 2, text: "  if row == n: solution++" },
    { line: 3, text: "  for col in 0..n-1:" },
    { line: 4, text: "    if safe(row, col):" },
    { line: 5, text: "      board[row][col] ← Q" },
    { line: 6, text: "      place(row+1)" },
    { line: 7, text: "      board[row][col] ← ." },
  ],
  configFields: [
    { key: "n", label: "N", kind: "number", min: 4, max: 6, step: 1, default: 4 },
  ],
  run(cfg) {
    const n = Number(cfg.n) || 4;
    const board: string[][] = Array.from({ length: n }, () => Array(n).fill("·"));
    const initialCells = Array.from({ length: n * n }, (_, idx) => ({
      row: Math.floor(idx / n),
      col: idx % n,
      value: "·",
    }));
    const rec = createRecorder({
      index: 0,
      title: "Empty board",
      currentLine: 1,
      gridRows: n,
      gridCols: n,
      gridCells: initialCells,
      variables: [{ name: "solutions", value: 0, kind: "number" }],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    let solutions = 0;

    const snap = (
      highlight: Record<string, "compare" | "pointer" | "sorted" | "mutate">,
      title: string,
      line: number,
      vars: { name: string; value: number | string; kind?: "number" | "pointer" | "state"; highlight?: boolean }[],
    ) => {
      const cells = Array.from({ length: n * n }, (_, idx) => {
        const r = Math.floor(idx / n);
        const c = idx % n;
        const key = `${r},${c}`;
        return {
          row: r,
          col: c,
          value: board[r][c],
          highlight: highlight[key],
        };
      });
      pushStep(rec, {
        title,
        currentLine: line,
        gridRows: n,
        gridCols: n,
        gridCells: cells,
        variables: vars,
        comparisons: solutions,
        swaps: 0,
        writes: 0,
      });
    };

    const safe = (r: number, c: number): boolean => {
      for (let i = 0; i < r; i++) {
        if (board[i][c] === "Q") return false;
        if (c - (r - i) >= 0 && board[i][c - (r - i)] === "Q") return false;
        if (c + (r - i) < n && board[i][c + (r - i)] === "Q") return false;
      }
      return true;
    };

    const place = (row: number) => {
      if (row === n) {
        solutions++;
        snap(
          Object.fromEntries(
            Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => [`${r},${c}`, "sorted" as const])).flat(),
          ),
          `Solution #${solutions}`,
          2,
          [{ name: "solutions", value: solutions, kind: "number", highlight: true }],
        );
        return;
      }
      for (let col = 0; col < n; col++) {
        const key = `${row},${col}`;
        snap({ [key]: "compare" }, `try (${row}, ${col})`, 3, [
          { name: "row", value: row, kind: "number" },
          { name: "col", value: col, kind: "number" },
        ]);
        if (safe(row, col)) {
          board[row][col] = "Q";
          snap({ [key]: "mutate" }, `place Q at (${row}, ${col})`, 5, [
            { name: "placed at", value: `${row},${col}`, kind: "pointer", highlight: true },
          ]);
          place(row + 1);
          board[row][col] = "·";
          snap({ [key]: "mutate" }, `backtrack from (${row}, ${col})`, 7, [
            { name: "row", value: row, kind: "number" },
            { name: "col", value: col, kind: "number" },
          ]);
        } else {
          snap({ [key]: "mutate" }, `conflict at (${row}, ${col}) — skip`, 4, [
            { name: "row", value: row, kind: "number" },
            { name: "col", value: col, kind: "number" },
          ]);
        }
      }
    };
    place(0);

    snap(
      Object.fromEntries(
        Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => [`${r},${c}`, "sorted" as const])).flat(),
      ),
      `Found ${solutions} solution${solutions === 1 ? "" : "s"}`,
      7,
      [{ name: "solutions", value: solutions, kind: "number", highlight: true }],
    );
    return rec.steps;
  },
};