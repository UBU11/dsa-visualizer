// lib/algorithms/binarySearch.ts

import type { AlgorithmDefinition, VariableFrame } from "@/lib/engine/types";
import { cellId, createRecorder, pushStep } from "@/lib/engine/runner";

export const binarySearch: AlgorithmDefinition = {
  id: "binary-search",
  name: "Binary Search",
  category: "Searching",
  structure: "array",
  summary:
    "Search a sorted array by halving the search range each step. Target highlighted indigo; found index turns emerald.",
  pseudocode: [
    { line: 1, text: "lo ← 0, hi ← n-1" },
    { line: 2, text: "while lo ≤ hi:" },
    { line: 3, text: "  mid ← (lo + hi) / 2" },
    { line: 4, text: "  if a[mid] == target: return mid" },
    { line: 5, text: "  if a[mid] < target: lo ← mid + 1" },
    { line: 6, text: "  else: hi ← mid - 1" },
    { line: 7, text: "return -1" },
  ],
  configFields: [
    {
      key: "size",
      label: "Array size",
      kind: "number",
      min: 5,
      max: 24,
      step: 1,
      default: 14,
    },
    {
      key: "seed",
      label: "Seed",
      kind: "number",
      min: 1,
      max: 9999,
      step: 1,
      default: 5,
    },
  ],
  run(config) {
    const size = Number(config.size) || 14;
    const seed = Number(config.seed) || 5;
    let s = seed;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const sorted = Array.from({ length: size }, (_, k) => 5 + k * 6 + Math.floor(rand() * 4)).sort(
      (a, b) => a - b,
    );
    const target = sorted[Math.floor(rand() * sorted.length)]; // guaranteed hit

    const initialCells = sorted.map((v, i) => ({ id: cellId(i, v), value: v }));
    const rec = createRecorder({
      index: 0,
      title: "Sorted input + target",
      description: `target = ${target}`,
      currentLine: 1,
      arrayCells: initialCells,
      arrayHighlights: {},
      variables: [
        { name: "lo", value: 0, kind: "number" },
        { name: "hi", value: size - 1, kind: "number" },
        { name: "target", value: target, kind: "pointer", highlight: true },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    let lo = 0;
    let hi = sorted.length - 1;
    let cmp = 0;
    const eliminated = new Set<number>();

    const snap = (
      highlights: Record<string, "compare" | "mutate" | "sorted" | "pointer" | "visited">,
      title: string,
      line: number,
      vars: VariableFrame[],
      desc?: string,
    ) => {
      const cells = sorted.map((v, k) => ({ id: cellId(k, v), value: v }));
      const merged = { ...highlights };
      for (const k of eliminated) merged[cellId(k, sorted[k])] = "visited";
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        arrayCells: cells,
        arrayHighlights: merged,
        variables: vars,
        comparisons: cmp,
        swaps: 0,
      });
    };

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      cmp++;
      snap(
        {
          [cellId(mid, sorted[mid])]: "compare",
        },
        `mid = ${mid}, a[mid] = ${sorted[mid]}`,
        3,
        [
          { name: "lo", value: lo, kind: "number" },
          { name: "hi", value: hi, kind: "number" },
          { name: "mid", value: mid, kind: "number" },
          { name: "target", value: target, kind: "pointer" },
        ],
      );
      if (sorted[mid] === target) {
        const finalHi: Record<string, "sorted"> = {
          [cellId(mid, sorted[mid])]: "sorted",
        };
        const cells = sorted.map((v, k) => ({ id: cellId(k, v), value: v }));
        pushStep(rec, {
          title: `Found at index ${mid}`,
          description: `a[mid] == target (${target})`,
          currentLine: 4,
          arrayCells: cells,
          arrayHighlights: finalHi,
          variables: [
            { name: "return", value: mid, kind: "number", highlight: true },
            { name: "target", value: target, kind: "pointer" },
          ],
          comparisons: cmp,
          swaps: 0,
        });
        return rec.steps;
      }
      if (sorted[mid] < target) {
        snap(
          {},
          `a[mid] ${sorted[mid]} < target, discard left half`,
          5,
          [
            { name: "lo", value: mid + 1, kind: "number", highlight: true },
            { name: "hi", value: hi, kind: "number" },
            { name: "mid", value: mid, kind: "number" },
          ],
        );
        for (let k = lo; k <= mid; k++) eliminated.add(k);
        lo = mid + 1;
      } else {
        snap(
          {},
          `a[mid] ${sorted[mid]} > target, discard right half`,
          6,
          [
            { name: "lo", value: lo, kind: "number" },
            { name: "hi", value: mid - 1, kind: "number", highlight: true },
            { name: "mid", value: mid, kind: "number" },
          ],
        );
        for (let k = mid; k <= hi; k++) eliminated.add(k);
        hi = mid - 1;
      }
    }

    const cells = sorted.map((v, k) => ({ id: cellId(k, v), value: k }));
    void cells;
    pushStep(rec, {
      title: "Not found",
      description: "search exhausted",
      currentLine: 7,
      arrayCells: sorted.map((v, k) => ({ id: cellId(k, v), value: v })),
      arrayHighlights: {},
      variables: [{ name: "return", value: -1, kind: "number" }],
      comparisons: cmp,
      swaps: 0,
    });
    return rec.steps;
  },
};