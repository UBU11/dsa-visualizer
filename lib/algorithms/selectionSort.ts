// lib/algorithms/selectionSort.ts
import type { AlgorithmDefinition } from "@/lib/engine/types";
import { cellId, createRecorder, pushStep } from "@/lib/engine/runner";

function makeArr(seed: number, size: number) {
  let s = seed;
  const r = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: size }, () => 5 + Math.floor(r() * 90));
}

export const selectionSort: AlgorithmDefinition = {
  id: "selection-sort",
  name: "Selection Sort",
  category: "Sorting",
  structure: "array",
  summary: "Each pass: scan the unsorted suffix for the minimum, swap it to the front. Sorted prefix grows one index per pass.",
  pseudocode: [
    { line: 1, text: "for i from 0 to n-1:" },
    { line: 2, text: "  minIdx ← i" },
    { line: 3, text: "  for j from i+1 to n-1:" },
    { line: 4, text: "    if a[j] < a[minIdx]: minIdx ← j" },
    { line: 5, text: "  swap a[i], a[minIdx]" },
  ],
  configFields: [
    { key: "size", label: "Array size", kind: "number", min: 4, max: 20, step: 1, default: 10 },
    { key: "seed", label: "Random seed", kind: "number", min: 1, max: 9999, step: 1, default: 11 },
  ],
  run(cfg) {
    const size = Number(cfg.size) || 10;
    const seed = Number(cfg.seed) || 11;
    const values = makeArr(seed, size);
    const init = values.map((v, i) => ({ id: cellId(i, v), value: v }));
    const rec = createRecorder({
      index: 0,
      title: "Initial array",
      description: `n=${size}`,
      currentLine: 1,
      arrayCells: init,
      arrayHighlights: {},
      variables: [{ name: "n", value: size, kind: "number" }],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    const arr = [...values];
    let cmp = 0;
    let swp = 0;
    const sorted = new Set<number>();
    for (let i = 0; i < arr.length; i++) {
      let minIdx = i;
      for (let j = i + 1; j < arr.length; j++) {
        cmp++;
        const cells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
              const hi: Record<string, "compare" | "sorted" | "pointer"> = {
          [cellId(i, arr[i])]: "compare",
          [cellId(j, arr[j])]: "compare",
          [cellId(minIdx, arr[minIdx])]: "pointer",
        };
        for (const k of sorted) hi[cellId(k, arr[k])] = "sorted";
        pushStep(rec, {
          title: `compare a[${j}]=${arr[j]} vs current min a[${minIdx}]=${arr[minIdx]}`,
          currentLine: 4,
          arrayCells: cells,
          arrayHighlights: hi,
          variables: [
            { name: "i", value: i, kind: "number" },
            { name: "j", value: j, kind: "number" },
            { name: "minIdx", value: minIdx, kind: "pointer", highlight: minIdx === j },
            { name: "a[j]", value: arr[j], kind: "number" },
          ],
          comparisons: cmp,
          swaps: swp,
        });
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        swp++;
      }
      sorted.add(i);
      const cells2 = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
      const hi2: Record<string, "mutate" | "sorted"> = {
        [cellId(i, arr[i])]: "sorted",
      };
      for (const k of sorted) if (k !== i) hi2[cellId(k, arr[k])] = "sorted";
      pushStep(rec, {
        title: `swap a[${i}] ↔ a[${minIdx}]`,
        description: `placed min ${arr[i]} at index ${i}`,
        currentLine: 5,
        arrayCells: cells2,
        arrayHighlights: hi2,
        variables: [
          { name: "i", value: i, kind: "number" },
          { name: "minIdx", value: minIdx, kind: "pointer" },
        ],
        comparisons: cmp,
        swaps: swp,
      });
    }
    const finalCells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
    const finalHi: Record<string, "sorted"> = {};
    finalCells.forEach((c) => (finalHi[c.id] = "sorted"));
    pushStep(rec, {
      title: "Sorted ✓",
      currentLine: 5,
      arrayCells: finalCells,
      arrayHighlights: finalHi,
      variables: [
        { name: "compares", value: cmp, kind: "number" },
        { name: "swaps", value: swp, kind: "number" },
      ],
      comparisons: cmp,
      swaps: swp,
    });
    return rec.steps;
  },
};