// lib/algorithms/linearSearch.ts
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

export const linearSearch: AlgorithmDefinition = {
  id: "linear-search",
  name: "Linear Search",
  category: "Searching",
  structure: "array",
  summary: "Walk the array left to right; the current index turns amber, hit turns emerald.",
  pseudocode: [
    { line: 1, text: "for i from 0 to n-1:" },
    { line: 2, text: "  if a[i] == target: return i" },
    { line: 3, text: "return -1" },
  ],
  configFields: [
    { key: "size", label: "Array size", kind: "number", min: 4, max: 24, step: 1, default: 12 },
    { key: "seed", label: "Random seed", kind: "number", min: 1, max: 9999, step: 1, default: 33 },
    { key: "target", label: "Target value", kind: "number", min: 1, max: 99, step: 1, default: 42 },
  ],
  run(cfg) {
    const size = Number(cfg.size) || 12;
    const seed = Number(cfg.seed) || 33;
    const target = Number(cfg.target) || 42;
    const values = makeArr(seed, size);
    const init = values.map((v, i) => ({ id: cellId(i, v), value: v }));
    const rec = createRecorder({
      index: 0,
      title: `Searching for ${target}`,
      currentLine: 1,
      arrayCells: init,
      arrayHighlights: {},
      variables: [{ name: "target", value: target, kind: "pointer", highlight: true }],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    let cmp = 0;
    for (let i = 0; i < values.length; i++) {
      cmp++;
      const cells = values.map((v, k) => ({ id: cellId(k, v), value: v }));
      const found = values[i] === target;
      const hi: Record<string, "compare" | "sorted" | "pointer"> = {
        [cellId(i, values[i])]: found ? "sorted" : "compare",
      };
      pushStep(rec, {
        title: found ? `found ${target} at index ${i}` : `compare a[${i}]=${values[i]} with target`,
        currentLine: 2,
        arrayCells: cells,
        arrayHighlights: hi,
        variables: [
          { name: "i", value: i, kind: "number" },
          { name: "a[i]", value: values[i], kind: "number" },
          { name: "target", value: target, kind: "pointer" },
        ],
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });
      if (found) return rec.steps;
    }
    pushStep(rec, {
      title: "Not found",
      currentLine: 3,
      arrayCells: values.map((v, k) => ({ id: cellId(k, v), value: v })),
      arrayHighlights: {},
      variables: [{ name: "return", value: -1, kind: "number" }],
      comparisons: cmp,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};