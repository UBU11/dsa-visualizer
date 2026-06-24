// lib/algorithms/bubbleSort.ts
// Each cell keeps its id=value so Framer Motion can FLIP-animate swaps.

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { cellId, createRecorder, pushStep } from "@/lib/engine/runner";

export const bubbleSort: AlgorithmDefinition = {
  id: "bubble-sort",
  name: "Bubble Sort",
  category: "Sorting",
  structure: "array",
  summary:
    "Repeatedly walk the array, swapping adjacent pairs that are out of order. Largest unsorted element bubbles to the end each pass.",
  pseudocode: [
    { line: 1, text: "for i from 0 to n-1:" },
    { line: 2, text: "  swapped ← false" },
    { line: 3, text: "  for j from 0 to n-i-2:" },
    { line: 4, text: "    if a[j] > a[j+1]:" },
    { line: 5, text: "      swap a[j], a[j+1]" },
    { line: 6, text: "      swapped ← true" },
    { line: 7, text: "  if not swapped: break" },
  ],
  configFields: [
    {
      key: "size",
      label: "Array size",
      kind: "number",
      min: 4,
      max: 24,
      step: 1,
      default: 10,
    },
    {
      key: "seed",
      label: "Random seed",
      kind: "number",
      min: 1,
      max: 9999,
      step: 1,
      default: 42,
    },
  ],
  run(config) {
    const size = Number(config.size) || 10;
    const seed = Number(config.seed) || 42;

    // Tiny LCG so the same seed always produces the same array.
    let s = seed;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const values: number[] = Array.from(
      { length: size },
      () => 5 + Math.floor(rand() * 90),
    );

    const initialCells = values.map((v, i) => ({
      id: cellId(i, v),
      value: v,
    }));

    const initialHighlights: Record<string, never> = {};
    const rec = createRecorder({
      index: 0,
      title: "Initial array",
      description: `n = ${size}, seed = ${seed}`,
      currentLine: 1,
      arrayCells: initialCells,
      arrayHighlights: initialHighlights,
      variables: [
        { name: "n", value: size, kind: "number" },
        { name: "i", value: 0, kind: "number" },
        { name: "j", value: 0, kind: "number" },
        { name: "swapped", value: false, kind: "state" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const arr = [...values];
    const sortedTail = new Set<number>();
    let totalSwaps = 0;
    let totalCompares = 0;

    for (let i = 0; i < arr.length - 1; i++) {
      let swapped = false;
      for (let j = 0; j < arr.length - i - 1; j++) {
        totalCompares++;
        const cells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
        const highlights: Record<string, "compare" | "mutate" | "sorted"> = {
          [cellId(j, arr[j])]: "compare",
          [cellId(j + 1, arr[j + 1])]: "compare",
        };
        for (const k of sortedTail) highlights[cellId(k, arr[k])] = "sorted";

        pushStep(rec, {
          title: `compare a[${j}]=${arr[j]} and a[${j + 1}]=${arr[j + 1]}`,
          description: "Pass " + (i + 1) + ", inner j=" + j,
          currentLine: 4,
          arrayCells: cells,
          arrayHighlights: highlights,
          variables: [
            { name: "i", value: i, kind: "number" },
            { name: "j", value: j, kind: "number" },
            { name: "swapped", value: swapped, kind: "state" },
            { name: "a[j]", value: arr[j], kind: "number" },
            { name: "a[j+1]", value: arr[j + 1], kind: "number" },
          ],
          comparisons: totalCompares,
          swaps: totalSwaps,
        });

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          totalSwaps++;
          swapped = true;
          const cells2 = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
          const swapHi: Record<string, "compare" | "mutate" | "sorted"> = {
            [cellId(j, arr[j])]: "mutate",
            [cellId(j + 1, arr[j + 1])]: "mutate",
          };
          for (const k of sortedTail) swapHi[cellId(k, arr[k])] = "sorted";
          pushStep(rec, {
            title: `swap a[${j}] ↔ a[${j + 1}]`,
            description: "values out of order",
            currentLine: 5,
            arrayCells: cells2,
            arrayHighlights: swapHi,
            variables: [
              { name: "i", value: i, kind: "number" },
              { name: "j", value: j, kind: "number" },
              { name: "swapped", value: swapped, kind: "state" },
            ],
            comparisons: totalCompares,
            swaps: totalSwaps,
          });
        }
      }
      sortedTail.add(arr.length - 1 - i);
      if (!swapped) {
        for (let k = 0; k < arr.length; k++) sortedTail.add(k);
        break;
      }
    }

    // Final fully-sorted frame.
    const finalCells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
    const finalHi: Record<string, "sorted"> = {};
    finalCells.forEach((c) => (finalHi[c.id] = "sorted"));
    pushStep(rec, {
      title: "Sorted ✓",
      description: `Bubble sort complete in ${totalCompares} compares, ${totalSwaps} swaps`,
      currentLine: 7,
      arrayCells: finalCells,
      arrayHighlights: finalHi,
      variables: [
        { name: "compares", value: totalCompares, kind: "number" },
        { name: "swaps", value: totalSwaps, kind: "number" },
      ],
      comparisons: totalCompares,
      swaps: totalSwaps,
    });

    return rec.steps;
  },
};