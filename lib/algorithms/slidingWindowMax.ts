// lib/algorithms/slidingWindowMax.ts

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { cellId, createRecorder, pushStep } from "@/lib/engine/runner";

function makeArr(seed: number, size: number) {
  let s = seed;
  const r = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: size }, () => 5 + Math.floor(r() * 30));
}

export const slidingWindowMax: AlgorithmDefinition = {
  id: "sliding-window-max",
  name: "Sliding Window Max",
  category: "Searching",
  structure: "array",
  summary: "Find max in every k-sized window using a monotonic deque. Front pointer is the window max (indigo).",
  pseudocode: [
    { line: 1, text: "dq ← empty deque of indices" },
    { line: 2, text: "for i from 0 to n-1:" },
    { line: 3, text: "  pop while dq.front ≤ i-k" },
    { line: 4, text: "  pop while a[dq.back] ≤ a[i]" },
    { line: 5, text: "  push i" },
    { line: 6, text: "  if i ≥ k-1: output a[dq.front]" },
  ],
  configFields: [
    { key: "size", label: "Array size", kind: "number", min: 5, max: 16, step: 1, default: 10 },
    { key: "k", label: "Window size", kind: "number", min: 2, max: 6, step: 1, default: 3 },
    { key: "seed", label: "Random seed", kind: "number", min: 1, max: 9999, step: 1, default: 71 },
  ],
  run(cfg) {
    const size = Number(cfg.size) || 10;
    const k = Number(cfg.k) || 3;
    const seed = Number(cfg.seed) || 71;
    const values = makeArr(seed, size);
    const init = values.map((v, i) => ({ id: cellId(i, v), value: v }));
    const rec = createRecorder({
      index: 0,
      title: `Window size k = ${k}`,
      currentLine: 1,
      arrayCells: init,
      arrayHighlights: {},
      variables: [
        { name: "k", value: k, kind: "number" },
        { name: "dq", value: "[]", kind: "pointer" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    const dq: number[] = [];
    const outputs: number[] = [];
    let cmp = 0;
    const snap = (
      hi: Record<string, "compare" | "pointer" | "sorted" | "mutate">,
      title: string,
      line: number,
      vars: { name: string; value: number | string; kind?: "number" | "pointer" | "state"; highlight?: boolean }[],
    ) => {
      const cells = values.map((v, idx) => ({ id: cellId(idx, v), value: v }));
      pushStep(rec, {
        title,
        currentLine: line,
        arrayCells: cells,
        arrayHighlights: hi,
        variables: vars,
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });
    };
    for (let i = 0; i < values.length; i++) {
      const hi: Record<string, "compare" | "pointer" | "sorted" | "mutate"> = {};
      // window highlight
      for (let w = Math.max(0, i - k + 1); w <= i; w++) hi[cellId(w, values[w])] = "compare";
      while (dq.length && dq[0] <= i - k) {
        snap(hi, `pop front (index ${dq[0]} out of window)`, 3, [
          { name: "i", value: i, kind: "number" },
          { name: "pop", value: dq[0], kind: "pointer", highlight: true },
          { name: "dq", value: `[${dq.join(", ")}]`, kind: "state" },
        ]);
        dq.shift();
      }
      while (dq.length && values[dq[dq.length - 1]] <= values[i]) {
        cmp++;
        snap(hi, `pop back (a[${dq[dq.length - 1]}]=${values[dq[dq.length - 1]]} ≤ a[${i}]=${values[i]})`, 4, [
          { name: "i", value: i, kind: "number" },
          { name: "pop", value: dq[dq.length - 1], kind: "pointer" },
          { name: "a[i]", value: values[i], kind: "number", highlight: true },
        ]);
        dq.pop();
      }
      dq.push(i);
      hi[cellId(i, values[i])] = "mutate";
      snap(hi, `push index ${i}`, 5, [
        { name: "i", value: i, kind: "number" },
        { name: "dq", value: `[${dq.join(", ")}]`, kind: "pointer", highlight: true },
      ]);
      if (i >= k - 1) {
        outputs.push(values[dq[0]]);
        hi[cellId(dq[0], values[dq[0]])] = "pointer";
        snap(hi, `window max = a[${dq[0]}] = ${values[dq[0]]}`, 6, [
          { name: "window max", value: values[dq[0]], kind: "pointer", highlight: true },
          { name: "outputs", value: `[${outputs.join(", ")}]`, kind: "state" },
        ]);
      }
    }
    const cells = values.map((v, i) => ({ id: cellId(i, v), value: v }));
    const finalHi: Record<string, "sorted"> = {};
    cells.forEach((c) => (finalHi[c.id] = "sorted"));
    pushStep(rec, {
      title: "Done ✓",
      description: `outputs: [${outputs.join(", ")}]`,
      currentLine: 6,
      arrayCells: cells,
      arrayHighlights: finalHi,
      variables: [
        { name: "outputs", value: `[${outputs.join(", ")}]`, kind: "pointer", highlight: true },
      ],
      comparisons: cmp,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};