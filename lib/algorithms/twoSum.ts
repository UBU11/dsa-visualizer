// lib/algorithms/twoSum.ts
// Two-pointer collision on a sorted array looking for pair summing to target.

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { cellId, createRecorder, pushStep } from "@/lib/engine/runner";

function makeSorted(seed: number, size: number) {
  let s = seed;
  const r = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: size }, (_, i) => 5 + i * 6 + Math.floor(r() * 4)).sort(
    (a, b) => a - b,
  );
}

export const twoSum: AlgorithmDefinition = {
  id: "two-sum",
  name: "Two Sum (sorted)",
  category: "Searching",
  structure: "array",
  summary: "Sorted-array two-pointer: move left or right based on whether the sum is too small or too large.",
  pseudocode: [
    { line: 1, text: "left ← 0, right ← n-1" },
    { line: 2, text: "while left < right:" },
    { line: 3, text: "  s ← a[left] + a[right]" },
    { line: 4, text: "  if s == target: return (left, right)" },
    { line: 5, text: "  if s < target: left++" },
    { line: 6, text: "  else: right--" },
    { line: 7, text: "return null" },
  ],
  configFields: [
    { key: "size", label: "Array size", kind: "number", min: 4, max: 16, step: 1, default: 10 },
    { key: "seed", label: "Random seed", kind: "number", min: 1, max: 9999, step: 1, default: 51 },
  ],
  run(cfg) {
    const size = Number(cfg.size) || 10;
    const seed = Number(cfg.seed) || 51;
    const values = makeSorted(seed, size);
    let s = seed + 7;
    const r = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const target = values[Math.floor(r() * (values.length - 2))] + values[Math.floor(r() * (values.length - 2)) + 2];
    const init = values.map((v, i) => ({ id: cellId(i, v), value: v }));
    const rec = createRecorder({
      index: 0,
      title: `Find pair summing to ${target}`,
      currentLine: 1,
      arrayCells: init,
      arrayHighlights: {},
      variables: [
        { name: "target", value: target, kind: "pointer", highlight: true },
        { name: "left", value: 0, kind: "number" },
        { name: "right", value: values.length - 1, kind: "number" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    let L = 0;
    let R = values.length - 1;
    let cmp = 0;
    while (L < R) {
      cmp++;
      const sum = values[L] + values[R];
      const cells = values.map((v, k) => ({ id: cellId(k, v), value: v }));
      const hi: Record<string, "compare" | "sorted" | "pointer" | "visited"> = {
        [cellId(L, values[L])]: "pointer",
        [cellId(R, values[R])]: "pointer",
      };
      pushStep(rec, {
        title: `a[${L}]+a[${R}]=${values[L]}+${values[R]}=${sum} ${sum === target ? "✓" : sum < target ? "< target → left++" : "> target → right--"}`,
        currentLine: 3,
        arrayCells: cells,
        arrayHighlights: hi,
        variables: [
          { name: "left", value: L, kind: "number", highlight: true },
          { name: "right", value: R, kind: "number", highlight: true },
          { name: "sum", value: sum, kind: "number" },
          { name: "target", value: target, kind: "pointer" },
        ],
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });
      if (sum === target) {
        const finalHi: Record<string, "sorted"> = {
          [cellId(L, values[L])]: "sorted",
          [cellId(R, values[R])]: "sorted",
        };
        pushStep(rec, {
          title: `Found pair (${L}, ${R}) summing to ${target}`,
          currentLine: 4,
          arrayCells: cells,
          arrayHighlights: finalHi,
          variables: [
            { name: "return", value: `(${L}, ${R})`, kind: "pointer", highlight: true },
          ],
          comparisons: cmp,
          swaps: 0,
          writes: 0,
        });
        return rec.steps;
      }
      if (sum < target) L++;
      else R--;
    }
    pushStep(rec, {
      title: "No pair found",
      currentLine: 7,
      arrayCells: values.map((v, k) => ({ id: cellId(k, v), value: v })),
      arrayHighlights: {},
      variables: [{ name: "return", value: "null", kind: "pointer" }],
      comparisons: cmp,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};