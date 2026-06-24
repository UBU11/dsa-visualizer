// lib/algorithms/heapSort.ts
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

export const heapSort: AlgorithmDefinition = {
  id: "heap-sort",
  name: "Heap Sort",
  category: "Sorting",
  structure: "array",
  summary: "Build a max-heap in-place, then repeatedly extract the max to the back of the array.",
  pseudocode: [
    { line: 1, text: "buildMaxHeap(a)" },
    { line: 2, text: "for i from n-1 downto 1:" },
    { line: 3, text: "  swap a[0], a[i]" },
    { line: 4, text: "  heapify(a, 0, i)" },
    { line: 5, text: "heapify(a, root, n):" },
    { line: 6, text: "  largest ← root; l ← 2r+1; r ← 2r+2" },
    { line: 7, text: "  if l<n and a[l]>a[largest]: largest ← l" },
    { line: 8, text: "  if r<n and a[r]>a[largest]: largest ← r" },
    { line: 9, text: "  if largest ≠ root: swap; heapify(largest)" },
  ],
  configFields: [
    { key: "size", label: "Array size", kind: "number", min: 4, max: 16, step: 1, default: 10 },
    { key: "seed", label: "Random seed", kind: "number", min: 1, max: 9999, step: 1, default: 19 },
  ],
  run(cfg) {
    const size = Number(cfg.size) || 10;
    const seed = Number(cfg.seed) || 19;
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
    let swp = 0;

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
        swaps: swp,
      });
    };

    const heapify = (n: number, root: number) => {
      const l = 2 * root + 1;
      const r = 2 * root + 2;
      let largest = root;
      if (l < n) {
        cmp++;
        snap(
          { [cellId(root, arr[root])]: "pointer", [cellId(l, arr[l])]: "compare" },
          `compare a[${l}]=${arr[l]} with parent a[${root}]=${arr[root]}`,
          7,
          [
            { name: "root", value: root, kind: "number" },
            { name: "l", value: l, kind: "number" },
            { name: "largest", value: largest, kind: "pointer" },
          ],
        );
        if (arr[l] > arr[largest]) largest = l;
      }
      if (r < n) {
        cmp++;
        snap(
          { [cellId(largest, arr[largest])]: "pointer", [cellId(r, arr[r])]: "compare" },
          `compare a[${r}]=${arr[r]} with current largest a[${largest}]=${arr[largest]}`,
          8,
          [
            { name: "largest", value: largest, kind: "pointer" },
            { name: "r", value: r, kind: "number" },
          ],
        );
        if (arr[r] > arr[largest]) largest = r;
      }
      if (largest !== root) {
        [arr[root], arr[largest]] = [arr[largest], arr[root]];
        swp++;
        snap(
          { [cellId(root, arr[root])]: "mutate", [cellId(largest, arr[largest])]: "mutate" },
          `swap a[${root}] ↔ a[${largest}]`,
          9,
          [
            { name: "root", value: root, kind: "number" },
            { name: "largest", value: largest, kind: "pointer" },
          ],
        );
        heapify(n, largest);
      }
    };

    for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) heapify(arr.length, i);

    const sorted = new Set<number>();
    for (let i = arr.length - 1; i > 0; i--) {
      [arr[0], arr[i]] = [arr[i], arr[0]];
      swp++;
      sorted.add(i);
      snap(
        { [cellId(0, arr[0])]: "mutate", [cellId(i, arr[i])]: "sorted" },
        `extract max ${arr[i]} to index ${i}`,
        3,
        [
          { name: "i", value: i, kind: "number" },
          { name: "extracted", value: arr[i], kind: "pointer" },
        ],
      );
      heapify(i, 0);
    }
    sorted.add(0);
    const finalCells = arr.map((v, k) => ({ id: cellId(k, v), value: v }));
    const finalHi: Record<string, "sorted"> = {};
    finalCells.forEach((c) => (finalHi[c.id] = "sorted"));
    pushStep(rec, {
      title: "Sorted ✓",
      currentLine: 4,
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