// lib/algorithms/floydCycle.ts
// Floyd's hare-and-tortoise cycle detection.
//
// Layout (normalized 0..1 coordinates so LinkedListView scales to any canvas):
//
//   Straight segment: nodes 0..lt-1 laid out on row 1 (y = 0.30)
//   Cycle tail:        nodes lt..n-1 laid out on row 2 (y = 0.65), in reverse
//                      visual order so the cycle "wraps around" the loop node
//   Cycle-back arc:    drawn by LinkedListView itself — last tail node's
//                      nextId points back to the loop-to node.
//
// The arc geometry is given to the renderer via the y-coordinate of the tail
// row (lower) vs the loop-to row (higher), so the cubic bezier naturally
// curves under and back without any node overlapping another.
//
// All x/y are normalized 0..1.

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

interface LN {
  id: string;
  v: number;
  nextId: string | null;
}

export const floydCycle: AlgorithmDefinition = {
  id: "floyd-cycle",
  name: "Floyd's Cycle Detection",
  category: "Lists",
  structure: "list",
  summary:
    "Hare-and-tortoise: advance slow one step, fast two steps. If they meet, the list has a cycle.",
  pseudocode: [
    { line: 1, text: "slow ← head, fast ← head" },
    { line: 2, text: "while fast and fast.next:" },
    { line: 3, text: "  slow ← slow.next" },
    { line: 4, text: "  fast ← fast.next.next" },
    { line: 5, text: "  if slow == fast: return cycle" },
    { line: 6, text: "return no cycle" },
  ],
  configFields: [
    { key: "size", label: "Node count", kind: "number", min: 4, max: 10, step: 1, default: 6 },
    { key: "loopTo", label: "Cycle back to (0=none)", kind: "number", min: 0, max: 5, step: 1, default: 2 },
  ],
  run(cfg) {
    const size = Number(cfg.size) || 6;
    const loopTo = Number(cfg.loopTo) || 0;
    // Build nodes — last node points back to loopTo (if loopTo > 0).
    const nodes: LN[] = Array.from({ length: size }, (_, i) => ({
      id: `n${i}`,
      v: i + 1,
      nextId:
        i + 1 < size
          ? `n${i + 1}`
          : loopTo > 0 && loopTo < size
            ? `n${loopTo}`
            : null,
    }));

    // Layout helper. Produces normalized {x, y} for each node.
    // Row 1 (straight segment): y = 0.32
    // Row 2 (cycle tail):       y = 0.68
    const lt = loopTo > 0 && loopTo < size ? loopTo : size;
    const tailCount = size - lt;

    const horizontalMargin = 0.05;
    const usableW = 1 - 2 * horizontalMargin;

    const layoutFor = (
      straightCount: number,
      tailCountInner: number,
    ): { id: string; value: number; x: number; y: number; nextId: string | null }[] => {
      // Straight segment: indices 0..straightCount-1 on row 1.
      const straightSlots = straightCount;
      const tailSlots = Math.max(tailCountInner, 0);
      const totalSlots = straightSlots + tailSlots;

      // Straight nodes — x evenly spaced on top row
      const out: { id: string; value: number; x: number; y: number; nextId: string | null }[] = [];
      if (straightSlots > 0) {
        const w = usableW / straightSlots;
        for (let i = 0; i < straightSlots; i++) {
          const node = nodes[i];
          out.push({
            id: node.id,
            value: node.v,
            x: horizontalMargin + w * (i + 0.5),
            y: 0.32,
            nextId: node.nextId,
          });
        }
      }
      // Tail nodes — laid out on bottom row in original order so node `lt`
      // (the first tail node) sits directly under the last straight node,
      // and node `size-1` (the cycle-back tail tip) sits at the FAR RIGHT.
      // The cycle-back arrow then naturally curves from the rightmost
      // bottom-row node UP to the loop-to node on the top row.
      if (tailSlots > 0) {
        const w = usableW / tailSlots;
        for (let j = 0; j < tailSlots; j++) {
          const realIdx = lt + j;
          const node = nodes[realIdx];
          out.push({
            id: node.id,
            value: node.v,
            x: horizontalMargin + w * (j + 0.5),
            y: 0.68,
            nextId: node.nextId,
          });
        }
      }
      // Sanity: when there's no cycle, just render a single row.
      if (tailSlots === 0 && straightSlots === 0) return out;
      return out;
    };

    const init = layoutFor(lt, tailCount);
    const rec = createRecorder({
      index: 0,
      title: `Linked list${loopTo > 0 ? ` (cycle back to n${loopTo})` : " (no cycle)"}`,
      currentLine: 1,
      listNodes: init,
      listHighlights: {},
      variables: [
        { name: "slow", value: "head", kind: "pointer" },
        { name: "fast", value: "head", kind: "pointer" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    if (loopTo === 0) {
      // No cycle — just walk to the end so the algorithm is still demonstrable.
      let cur = 0;
      let cmp = 0;
      while (cur < size) {
        const lt2 = layoutFor(size, 0);
        pushStep(rec, {
          title: `cur = n${cur + 1} (${nodes[cur].v}), next = ${nodes[cur].nextId ? `n${parseInt(nodes[cur].nextId!.slice(1)) + 1}` : "null"}`,
          currentLine: 2,
          listNodes: lt2,
          listHighlights: { [nodes[cur].id]: "pointer" },
          variables: [
            { name: "cur", value: `n${cur + 1}`, kind: "pointer", highlight: true },
            { name: "cmp", value: String(cmp), kind: "number" },
          ],
          comparisons: cmp++,
          swaps: 0,
          writes: 0,
        });
        if (!nodes[cur].nextId) break;
        cur = parseInt(nodes[cur].nextId!.slice(1), 10);
      }
      pushStep(rec, {
        title: "No cycle (reached tail)",
        currentLine: 6,
        listNodes: layoutFor(size, 0),
        listHighlights: {},
        variables: [{ name: "result", value: "no cycle", kind: "pointer" }],
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });
      return rec.steps;
    }

    // With cycle: hare & tortoise
    let slow = 0;
    let fast = 0;
    let cmp = 0;
    const stepLimit = 60;
    let steps = 0;
    while (steps++ < stepLimit) {
      const lt2 = layoutFor(lt, tailCount);
      const snapHi: Record<string, "compare" | "pointer" | "mutate"> = {
        [nodes[slow].id]: "pointer",
        [nodes[fast].id]: "compare",
      };
      pushStep(rec, {
        title: `slow = n${slow + 1}, fast = n${fast + 1}`,
        currentLine: 2,
        listNodes: lt2,
        listHighlights: snapHi,
        variables: [
          { name: "slow", value: `n${slow + 1}`, kind: "pointer", highlight: true },
          { name: "fast", value: `n${fast + 1}`, kind: "pointer", highlight: true },
          { name: "cmp", value: String(cmp), kind: "number" },
        ],
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });
      if (slow === fast) {
        pushStep(rec, {
          title: `Cycle detected at n${slow + 1}`,
          currentLine: 5,
          listNodes: layoutFor(lt, tailCount),
          listHighlights: { [nodes[slow].id]: "mutate" },
          variables: [{ name: "result", value: "cycle", kind: "pointer", highlight: true }],
          comparisons: cmp,
          swaps: 0,
          writes: 0,
        });
        return rec.steps;
      }
      cmp++;
      const newSlow = parseInt(nodes[slow].nextId?.slice(1) ?? "-1", 10);
      const fastNext = parseInt(nodes[fast].nextId?.slice(1) ?? "-1", 10);
      if (fastNext < 0 || newSlow < 0) break;
      const newFast =
        fastNext < size
          ? parseInt(nodes[fastNext].nextId?.slice(1) ?? "-1", 10)
          : -1;
      if (newFast < 0) break;
      slow = newSlow;
      fast = newFast;
    }
    pushStep(rec, {
      title: "No cycle (fast reached end)",
      currentLine: 6,
      listNodes: layoutFor(lt, tailCount),
      listHighlights: {},
      variables: [{ name: "result", value: "no cycle", kind: "pointer" }],
      comparisons: cmp,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};