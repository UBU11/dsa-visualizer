// lib/algorithms/quickSort.ts

import type { AlgorithmDefinition, VariableFrame } from "@/lib/engine/types";
import { cellId, createRecorder, pushStep } from "@/lib/engine/runner";

export const quickSort: AlgorithmDefinition = {
  id: "quick-sort",
  name: "Quick Sort",
  category: "Sorting",
  structure: "array",
  summary:
    "Pick a pivot, partition so smaller items are left and larger right, recurse on each side. Pivot highlighted indigo.",
  pseudocode: [
    { line: 1, text: "quicksort(a, lo, hi):" },
    { line: 2, text: "  if lo >= hi: return" },
    { line: 3, text: "  p ← partition(a, lo, hi)" },
    { line: 4, text: "  quicksort(a, lo, p-1)" },
    { line: 5, text: "  quicksort(a, p+1, hi)" },
    { line: 6, text: "partition(a, lo, hi):" },
    { line: 7, text: "  pivot ← a[hi]" },
    { line: 8, text: "  i ← lo - 1" },
    { line: 9, text: "  for j from lo to hi-1:" },
    { line: 10, text: "    if a[j] <= pivot: i++; swap a[i], a[j]" },
    { line: 11, text: "  swap a[i+1], a[hi]" },
    { line: 12, text: "  return i+1" },
  ],
  configFields: [
    {
      key: "size",
      label: "Array size",
      kind: "number",
      min: 4,
      max: 24,
      step: 1,
      default: 12,
    },
    {
      key: "seed",
      label: "Random seed",
      kind: "number",
      min: 1,
      max: 9999,
      step: 1,
      default: 7,
    },
  ],
  run(config) {
    const size = Number(config.size) || 12;
    const seed = Number(config.seed) || 7;
    let s = seed;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const values: number[] = Array.from(
      { length: size },
      () => 5 + Math.floor(rand() * 90),
    );

    const initialCells = values.map((v, i) => ({ id: cellId(i, v), value: v }));
    const rec = createRecorder({
      index: 0,
      title: "Initial array",
      description: `n = ${size}`,
      currentLine: 1,
      arrayCells: initialCells,
      arrayHighlights: {},
      variables: [
        { name: "lo", value: 0, kind: "number" },
        { name: "hi", value: size - 1, kind: "number" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const arr = [...values];
    let totalCmp = 0;
    let totalSwp = 0;
    const sorted = new Set<number>();

    const snapshot = (
      highlights: Record<string, "compare" | "mutate" | "sorted" | "pointer">,
      title: string,
      line: number,
      variables: VariableFrame[],
      description?: string,
    ) => {
      const cells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
      const merged: Record<string, "compare" | "mutate" | "sorted" | "pointer"> = {
        ...highlights,
      };
      for (const k of sorted) merged[cellId(k, arr[k])] = "sorted";
      pushStep(rec, {
        title,
        description,
        currentLine: line,
        arrayCells: cells,
        arrayHighlights: merged,
        variables,
        comparisons: totalCmp,
        swaps: totalSwp,
      });
    };

    const partition = (lo: number, hi: number): number => {
      const pivotVal = arr[hi];
      snapshot(
        { [cellId(hi, pivotVal)]: "pointer" },
        `pivot = a[${hi}] = ${pivotVal}`,
        7,
        [
          { name: "lo", value: lo, kind: "number" },
          { name: "hi", value: hi, kind: "number" },
          { name: "pivot", value: pivotVal, kind: "pointer", highlight: true },
        ],
      );
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        totalCmp++;
        snapshot(
          {
            [cellId(hi, pivotVal)]: "pointer",
            [cellId(j, arr[j])]: "compare",
          },
          `compare a[${j}]=${arr[j]} with pivot ${pivotVal}`,
          10,
          [
            { name: "lo", value: lo, kind: "number" },
            { name: "hi", value: hi, kind: "number" },
            { name: "j", value: j, kind: "number" },
            { name: "i", value: i, kind: "number" },
            { name: "pivot", value: pivotVal, kind: "pointer" },
          ],
        );
        if (arr[j] <= pivotVal) {
          i++;
          if (i !== j) {
            [arr[i], arr[j]] = [arr[j], arr[i]];
            totalSwp++;
            snapshot(
              {
                [cellId(hi, pivotVal)]: "pointer",
                [cellId(i, arr[i])]: "mutate",
                [cellId(j, arr[j])]: "mutate",
              },
              `swap a[${i}] ↔ a[${j}]`,
              10,
              [
                { name: "i", value: i, kind: "number" },
                { name: "j", value: j, kind: "number" },
                { name: "pivot", value: pivotVal, kind: "pointer" },
              ],
              `${arr[i]} ≤ pivot, move into left partition`,
            );
          } else {
            snapshot(
              {
                [cellId(hi, pivotVal)]: "pointer",
                [cellId(j, arr[j])]: "mutate",
              },
              `a[${j}] already in left partition`,
              10,
              [
                { name: "i", value: i, kind: "number" },
                { name: "j", value: j, kind: "number" },
                { name: "pivot", value: pivotVal, kind: "pointer" },
              ],
            );
          }
        }
      }
      [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
      totalSwp++;
      sorted.add(i + 1);
      snapshot(
        {
          [cellId(i + 1, arr[i + 1])]: "sorted",
        },
        `pivot ${pivotVal} placed at index ${i + 1}`,
        11,
        [
          { name: "return", value: i + 1, kind: "number" },
          { name: "pivot", value: pivotVal, kind: "pointer" },
        ],
      );
      return i + 1;
    };

    const qs = (lo: number, hi: number) => {
      if (lo >= hi) {
        if (lo === hi) sorted.add(lo);
        snapshot(
          {},
          lo >= hi ? `base case lo=${lo}, hi=${hi}` : `lo=${lo}, hi=${hi} done`,
          2,
          [
            { name: "lo", value: lo, kind: "number" },
            { name: "hi", value: hi, kind: "number" },
          ],
        );
        return;
      }
      snapshot(
        {},
        `quicksort(a, ${lo}, ${hi})`,
        1,
        [
          { name: "lo", value: lo, kind: "number" },
          { name: "hi", value: hi, kind: "number" },
        ],
      );
      const p = partition(lo, hi);
      qs(lo, p - 1);
      qs(p + 1, hi);
    };
    qs(0, arr.length - 1);

    // Mark everything sorted.
    for (let k = 0; k < arr.length; k++) sorted.add(k);
    const finalCells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
    const finalHi: Record<string, "sorted"> = {};
    finalCells.forEach((c) => (finalHi[c.id] = "sorted"));
    pushStep(rec, {
      title: "Sorted ✓",
      description: `Quick sort complete`,
      currentLine: 5,
      arrayCells: finalCells,
      arrayHighlights: finalHi,
      variables: [
        { name: "compares", value: totalCmp, kind: "number" },
        { name: "swaps", value: totalSwp, kind: "number" },
      ],
      comparisons: totalCmp,
      swaps: totalSwp,
    });

    return rec.steps;
  },
};