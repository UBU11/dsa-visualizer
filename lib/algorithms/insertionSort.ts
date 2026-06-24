// lib/algorithms/insertionSort.ts
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

export const insertionSort: AlgorithmDefinition = {
  id: "insertion-sort",
  name: "Insertion Sort",
  category: "Sorting",
  structure: "array",
  summary: "Grow a sorted prefix by inserting each new element into its correct position via successive shifts.",
  pseudocode: [
    { line: 1, text: "for i from 1 to n-1:" },
    { line: 2, text: "  key ← a[i]" },
    { line: 3, text: "  j ← i - 1" },
    { line: 4, text: "  while j ≥ 0 and a[j] > key:" },
    { line: 5, text: "    a[j+1] ← a[j]" },
    { line: 6, text: "    j ← j - 1" },
    { line: 7, text: "  a[j+1] ← key" },
  ],
  configFields: [
    { key: "size", label: "Array size", kind: "number", min: 4, max: 20, step: 1, default: 10 },
    { key: "seed", label: "Random seed", kind: "number", min: 1, max: 9999, step: 1, default: 23 },
  ],
  run(cfg) {
    const size = Number(cfg.size) || 10;
    const seed = Number(cfg.seed) || 23;
    const values = makeArr(seed, size);
    const init = values.map((v, i) => ({ id: cellId(i, v), value: v }));
    const rec = createRecorder({
      index: 0,
      title: "Initial array",
      currentLine: 1,
      arrayCells: init,
      arrayHighlights: {},
      variables: [],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    const arr = [...values];
    let cmp = 0;
    let wrt = 0;
    const sorted = new Set<number>([0]);
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
      while (j >= 0) {
        cmp++;
        const cells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
        const hi: Record<string, "compare" | "sorted" | "pointer" | "mutate"> = {
          [cellId(j, arr[j])]: "compare",
          [cellId(i, key)]: "pointer",
        };
        for (const k of sorted) hi[cellId(k, arr[k])] = "sorted";
        pushStep(rec, {
          title: `compare a[${j}]=${arr[j]} with key=${key}`,
          currentLine: 4,
          arrayCells: cells,
          arrayHighlights: hi,
          variables: [
            { name: "i", value: i, kind: "number" },
            { name: "j", value: j, kind: "number" },
            { name: "key", value: key, kind: "pointer" },
          ],
          comparisons: cmp,
          swaps: 0,
          writes: wrt,
        });
        if (arr[j] <= key) break;
        arr[j + 1] = arr[j];
        wrt++;
        const cells2 = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
        pushStep(rec, {
          title: `shift a[${j}] → a[${j + 1}]`,
          currentLine: 5,
          arrayCells: cells2,
          arrayHighlights: { [cellId(j + 1, arr[j + 1])]: "mutate", ...Object.fromEntries(Array.from(sorted).map((k) => [cellId(k, arr[k]), "sorted" as const])) },
          variables: [
            { name: "j", value: j, kind: "number" },
            { name: "key", value: key, kind: "pointer" },
          ],
          comparisons: cmp,
          swaps: 0,
          writes: wrt,
        });
        j--;
      }
      arr[j + 1] = key;
      wrt++;
      sorted.add(i);
      const cells3 = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
      const hi3: Record<string, "sorted"> = {};
      for (const k of sorted) hi3[cellId(k, arr[k])] = "sorted";
      pushStep(rec, {
        title: `place key=${key} at index ${j + 1}`,
        currentLine: 7,
        arrayCells: cells3,
        arrayHighlights: hi3,
        variables: [{ name: "placed at", value: j + 1, kind: "number" }],
        comparisons: cmp,
        swaps: 0,
        writes: wrt,
      });
    }
    const finalCells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
    const finalHi: Record<string, "sorted"> = {};
    finalCells.forEach((c) => (finalHi[c.id] = "sorted"));
    pushStep(rec, {
      title: "Sorted ✓",
      currentLine: 7,
      arrayCells: finalCells,
      arrayHighlights: finalHi,
      variables: [
        { name: "compares", value: cmp, kind: "number" },
        { name: "writes", value: wrt, kind: "number" },
      ],
      comparisons: cmp,
      swaps: 0,
      writes: wrt,
    });
    return rec.steps;
  },
};