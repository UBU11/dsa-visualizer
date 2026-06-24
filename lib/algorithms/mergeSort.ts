// lib/algorithms/mergeSort.ts
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

export const mergeSort: AlgorithmDefinition = {
  id: "merge-sort",
  name: "Merge Sort",
  category: "Sorting",
  structure: "array",
  summary: "Divide the array, sort each half, then merge. Merges are the active phase (compare two halves, write smaller).",
  pseudocode: [
    { line: 1, text: "mergesort(a, lo, hi):" },
    { line: 2, text: "  if lo ≥ hi: return" },
    { line: 3, text: "  mid ← (lo + hi) / 2" },
    { line: 4, text: "  mergesort(a, lo, mid)" },
    { line: 5, text: "  mergesort(a, mid+1, hi)" },
    { line: 6, text: "  merge(a, lo, mid, hi)" },
    { line: 7, text: "merge(a, lo, mid, hi):" },
    { line: 8, text: "  i ← lo; j ← mid+1; k ← lo" },
    { line: 9, text: "  while i ≤ mid and j ≤ hi:" },
    { line: 10, text: "    if a[i] ≤ a[j]: b[k++] ← a[i++]" },
    { line: 11, text: "    else: b[k++] ← a[j++]" },
    { line: 12, text: "  copy b[lo..hi] back to a" },
  ],
  configFields: [
    { key: "size", label: "Array size", kind: "number", min: 4, max: 16, step: 1, default: 8 },
    { key: "seed", label: "Random seed", kind: "number", min: 1, max: 9999, step: 1, default: 8 },
  ],
  run(cfg) {
    const size = Number(cfg.size) || 8;
    const seed = Number(cfg.seed) || 8;
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
    const sorted = new Set<number>();

    const snap = (
      highlights: Record<string, "compare" | "mutate" | "sorted" | "pointer">,
      title: string,
      line: number,
      variables: { name: string; value: number | string; kind?: "number" | "pointer" | "state"; highlight?: boolean }[],
    ) => {
      const cells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
      pushStep(rec, {
        title,
        currentLine: line,
        arrayCells: cells,
        arrayHighlights: highlights,
        variables,
        comparisons: cmp,
        swaps: 0,
        writes: wrt,
      });
    };

    const merge = (lo: number, mid: number, hi: number) => {
      const left = arr.slice(lo, mid + 1);
      const right = arr.slice(mid + 1, hi + 1);
      snap(
        { [cellId(lo, arr[lo])]: "pointer", [cellId(mid, arr[mid])]: "pointer" },
        `merge range [${lo}..${hi}], mid=${mid}`,
        7,
        [
          { name: "lo", value: lo, kind: "number" },
          { name: "mid", value: mid, kind: "number" },
          { name: "hi", value: hi, kind: "number" },
        ],
      );
      let i = 0;
      let j = 0;
      let k = lo;
      while (i < left.length && j < right.length) {
        cmp++;
        snap(
          {
            [cellId(lo + i, left[i])]: "compare",
            [cellId(mid + 1 + j, right[j])]: "compare",
          },
          `compare ${left[i]} vs ${right[j]}`,
          10,
          [
            { name: "i", value: i, kind: "number" },
            { name: "j", value: j, kind: "number" },
            { name: "k", value: k, kind: "number" },
            { name: "left[i]", value: left[i], kind: "pointer" },
            { name: "right[j]", value: right[j], kind: "pointer" },
          ],
        );
        if (left[i] <= right[j]) {
          arr[k] = left[i++];
        } else {
          arr[k] = right[j++];
        }
        wrt++;
        snap(
          { [cellId(k, arr[k])]: "mutate" },
          `write ${arr[k]} at index ${k}`,
          11,
          [{ name: "k", value: k, kind: "number", highlight: true }],
        );
        k++;
      }
      while (i < left.length) {
        arr[k] = left[i++];
        wrt++;
        snap(
          { [cellId(k, arr[k])]: "mutate" },
          `drain left → ${arr[k]} at ${k}`,
          11,
          [{ name: "k", value: k, kind: "number" }],
        );
        k++;
      }
      while (j < right.length) {
        arr[k] = right[j++];
        wrt++;
        snap(
          { [cellId(k, arr[k])]: "mutate" },
          `drain right → ${arr[k]} at ${k}`,
          11,
          [{ name: "k", value: k, kind: "number" }],
        );
        k++;
      }
    };

    const ms = (lo: number, hi: number) => {
      if (lo >= hi) {
        sorted.add(lo);
        return;
      }
      const mid = (lo + hi) >> 1;
      ms(lo, mid);
      ms(mid + 1, hi);
      merge(lo, mid, hi);
      if (hi - lo + 1 === arr.length) {
        for (let i = lo; i <= hi; i++) sorted.add(i);
      }
    };
    ms(0, arr.length - 1);
    const finalCells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
    const finalHi: Record<string, "sorted"> = {};
    finalCells.forEach((c) => (finalHi[c.id] = "sorted"));
    pushStep(rec, {
      title: "Sorted ✓",
      currentLine: 12,
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