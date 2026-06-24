// lib/algorithms/monotonicStack.ts
// Next Greater Element to the right.

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

export const monotonicStack: AlgorithmDefinition = {
  id: "monotonic-stack",
  name: "Next Greater (Monotonic Stack)",
  category: "Stacks & Queues",
  structure: "stack",
  summary: "For each index, find the next greater element to its right using a monotonic decreasing stack.",
  pseudocode: [
    { line: 1, text: "stack ← empty" },
    { line: 2, text: "for i from 0 to n-1:" },
    { line: 3, text: "  while stack not empty and a[stack.top] < a[i]:" },
    { line: 4, text: "    j ← stack.pop()" },
    { line: 5, text: "    nge[j] ← a[i]" },
    { line: 6, text: "  stack.push(i)" },
  ],
  configFields: [
    { key: "size", label: "Array size", kind: "number", min: 4, max: 12, step: 1, default: 8 },
    { key: "seed", label: "Random seed", kind: "number", min: 1, max: 9999, step: 1, default: 88 },
  ],
  run(cfg) {
    const size = Number(cfg.size) || 8;
    const seed = Number(cfg.seed) || 88;
    const values = makeArr(seed, size);
    const nge: (number | null)[] = Array(size).fill(null);

    // Initial step.
    const initCells = values.map((v, i) => ({ id: cellId(i, v), value: v }));
    const rec = createRecorder({
      index: 0,
      title: "Initial array",
      currentLine: 1,
      arrayCells: initCells,
      arrayHighlights: {},
      stackFrames: [],
      variables: [
        { name: "stack", value: "[]", kind: "pointer" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const stack: number[] = [];
    let cmp = 0;

    const snap = (
      arrHi: Record<string, "compare" | "pointer" | "mutate" | "sorted">,
      title: string,
      line: number,
      vars: { name: string; value: number | string; kind?: "number" | "pointer" | "state"; highlight?: boolean }[],
      action: "push" | "pop" | "idle" = "idle",
    ) => {
      pushStep(rec, {
        title,
        currentLine: line,
        arrayCells: values.map((v, k) => ({ id: cellId(k, v), value: v })),
        arrayHighlights: arrHi,
        stackFrames: stack.map((s, k) => ({ id: `s-${s}`, value: values[s], highlight: k === stack.length - 1 ? "pointer" : "sorted" })),
        stackHighlights: Object.fromEntries(stack.map((s, k) => [`s-${s}`, (k === stack.length - 1 ? "pointer" : "sorted") as "pointer" | "sorted"])),
        variables: [...vars, { name: "action", value: action, kind: "state" }, { name: "top", value: stack.length - 1, kind: "number" }],
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });
    };

    for (let i = 0; i < values.length; i++) {
      const arrHi: Record<string, "compare" | "pointer" | "mutate" | "sorted"> = { [cellId(i, values[i])]: "pointer" };
      for (const j of stack) arrHi[cellId(j, values[j])] = "compare";
      snap(arrHi, `visit i=${i}, a[i]=${values[i]}`, 2, [
        { name: "i", value: i, kind: "number" },
        { name: "a[i]", value: values[i], kind: "number" },
      ]);
      while (stack.length && values[stack[stack.length - 1]] < values[i]) {
        cmp++;
        const j = stack.pop()!;
        nge[j] = values[i];
        arrHi[cellId(j, values[j])] = "mutate";
        snap(arrHi, `pop j=${j}; nge[${j}] = ${values[i]}`, 5, [
          { name: "j", value: j, kind: "number", highlight: true },
          { name: "nge[j]", value: values[i], kind: "pointer" },
          { name: "i", value: i, kind: "number" },
        ], "pop");
      }
      stack.push(i);
      snap({ ...arrHi, [cellId(i, values[i])]: "mutate" }, `push i=${i}`, 6, [
        { name: "i", value: i, kind: "number" },
        { name: "stack", value: `[${stack.join(", ")}]`, kind: "pointer" },
      ], "push");
    }

    const finalCells = values.map((v, i) => ({ id: cellId(i, v), value: v }));
    pushStep(rec, {
      title: "Done ✓",
      description: nge.map((v, i) => `${values[i]}→${v ?? "-"}`).join(", "),
      currentLine: 6,
      arrayCells: finalCells,
      arrayHighlights: Object.fromEntries(finalCells.map((c) => [c.id, "sorted" as const])),
      stackFrames: [],
      variables: [
        { name: "nge", value: `[${nge.map((v) => v ?? "-").join(", ")}]`, kind: "pointer", highlight: true },
      ],
      comparisons: cmp,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};