// lib/algorithms/floydCycle.ts
// Floyd's hare-and-tortoise cycle detection.
//
// Layout (normalized 0..1 coordinates so LinkedListView scales to any canvas):
//
//   Top row (y = 0.30): the chain prefix INCLUDING the loop-to node.
//                       For loopTo=0, the top row holds the entire chain.
//                       For loopTo=k>0, top row = nodes [0..k], with node k
//                       being the cycle entry point.
//   Bottom row (y = 0.68): only when there's a cycle. Holds the remaining
//                       tail [k+1 .. size-1] left-to-right. The cycle-back
//                       tip (last tail node) is then positioned directly
//                       UNDER the loop-to node on the top row, so the
//                       cycle-back arc is a short vertical-ish hop instead
//                       of a long cross-canvas diagonal.
//   Cycle-back arc:   drawn by LinkedListView — last tail node's nextId
//                       points back to the loop-to node on the top row.
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
    const size = Math.max(2, Number(cfg.size) || 6);
    const requestedLoopTo = Math.max(0, Number(cfg.loopTo) || 0);
    // Clamp loopTo to a valid in-range index (1..size-2). 0 means "no cycle".
    const loopTo =
      requestedLoopTo > 0 && requestedLoopTo < size - 1 ? requestedLoopTo : 0;

    // Build nodes — last node points back to loopTo (if loopTo > 0).
    const nodes: LN[] = Array.from({ length: size }, (_, i) => ({
      id: `n${i}`,
      v: i + 1,
      nextId:
        i + 1 < size
          ? `n${i + 1}`
          : loopTo > 0
            ? `n${loopTo}`
            : null,
    }));

    // Layout helper. Produces normalized {x, y} for each node.
    //   Top row (y = 0.30): nodes 0..lt  (prefix INCLUDING the loop-to node).
    //   Bottom row (y = 0.68): nodes lt+1..size-1  (the cycle tail).
    // The cycle-back tip (last tail, real index = size-1) is laid out at the
    // FAR RIGHT of the bottom row, and the loop-to (real index = lt) is laid
    // out at the FAR RIGHT of the top row. They share the same x, so the
    // cycle-back arc is a short vertical hop.
    const lt = loopTo > 0 ? loopTo : size;
    const topCount = lt + (loopTo > 0 ? 1 : 0); // include loop-to on top row
    const tailCount = loopTo > 0 ? size - lt - 1 : 0;

    const horizontalMargin = 0.05;
    const usableW = 1 - 2 * horizontalMargin;

    const layoutFor = (
      topCountInner: number,
      tailCountInner: number,
    ): { id: string; value: number; x: number; y: number; nextId: string | null }[] => {
      const topSlots = topCountInner;
      const tailSlots = Math.max(tailCountInner, 0);

      const out: { id: string; value: number; x: number; y: number; nextId: string | null }[] = [];
      // Top-row nodes (prefix including the loop-to), left-to-right.
      if (topSlots > 0) {
        const w = usableW / topSlots;
        for (let i = 0; i < topSlots; i++) {
          const node = nodes[i];
          out.push({
            id: node.id,
            value: node.v,
            x: horizontalMargin + w * (i + 0.5),
            y: 0.30,
            nextId: node.nextId,
          });
        }
      }
      // Bottom-row tail nodes, left-to-right. The last tail node sits
      // directly under the loop-to node (both at the far-right column).
      if (tailSlots > 0) {
        const w = usableW / tailSlots;
        for (let j = 0; j < tailSlots; j++) {
          const realIdx = lt + 1 + j;
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
      return out;
    };

    const init = layoutFor(topCount, tailCount);
    const rec = createRecorder({
      index: 0,
      title: `Linked list${loopTo > 0 ? ` (cycle back to n${loopTo})` : " (no cycle)"}`,
      currentLine: 1,
      listNodes: init,
      listHighlights: {},
      variables: [
        { name: "slow", value: "n0", kind: "pointer" },
        { name: "fast", value: "n0", kind: "pointer" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    if (loopTo === 0) {
      // No cycle — just walk to the end so the algorithm is still demonstrable.
      let cur = 0;
      let cmp = 0;
      while (cur < size && nodes[cur].nextId) {
        const lt2 = layoutFor(size, 0);
        const nextId = nodes[cur].nextId!;
        pushStep(rec, {
          title: `cur = n${cur + 1} (${nodes[cur].v})`,
          currentLine: 2,
          listNodes: lt2,
          listHighlights: { [nodes[cur].id]: "pointer" },
          variables: [
            { name: "cur", value: `n${cur}`, kind: "pointer", highlight: true },
            { name: "next", value: nextId, kind: "pointer" },
            { name: "cmp", value: String(cmp), kind: "number" },
          ],
          comparisons: cmp++,
          swaps: 0,
          writes: 0,
        });
        cur = parseInt(nextId.slice(1), 10);
      }
      // Final tail step.
      pushStep(rec, {
        title: `cur = n${cur + 1} (${nodes[cur].v}), next = null`,
        currentLine: 2,
        listNodes: layoutFor(size, 0),
        listHighlights: { [nodes[cur].id]: "pointer" },
        variables: [
          { name: "cur", value: `n${cur}`, kind: "pointer", highlight: true },
          { name: "next", value: "null", kind: "pointer" },
        ],
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });
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

    // With cycle: hare & tortoise.
    // The pseudocode is: advance, then check. Each iteration renders a "before
    // advance" snapshot at the current pointer positions, then advances and
    // renders an "after advance" snapshot, then either loops or declares cycle.
    let slow = 0;
    let fast = 0;
    let cmp = 0;
    const stepLimit = 60;
    let iterations = 0;

    while (iterations++ < stepLimit) {
      // Render the current pointer positions (line 2: "while fast and fast.next").
      // When both pointers land on the same node, prefer the "pointer" color
      // (indigo) so the slow-pointer identity stays clear.
      const snapHi: Record<string, "compare" | "pointer" | "mutate"> = {};
      snapHi[nodes[fast].id] = "compare";
      snapHi[nodes[slow].id] = "pointer";
      pushStep(rec, {
        title: `slow = n${slow + 1}, fast = n${fast + 1}`,
        currentLine: 2,
        listNodes: layoutFor(lt, tailCount),
        listHighlights: snapHi,
        variables: [
          { name: "slow", value: `n${slow}`, kind: "pointer", highlight: true },
          { name: "fast", value: `n${fast}`, kind: "pointer", highlight: true },
          { name: "cmp", value: String(cmp), kind: "number" },
        ],
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });

      // Advance (lines 3 & 4).
      const newSlow = parseInt(nodes[slow].nextId?.slice(1) ?? "-1", 10);
      const fastNext = parseInt(nodes[fast].nextId?.slice(1) ?? "-1", 10);
      if (newSlow < 0 || fastNext < 0) break;
      const newFast =
        fastNext < size
          ? parseInt(nodes[fastNext].nextId?.slice(1) ?? "-1", 10)
          : -1;
      if (newFast < 0) break;

      // Render the "just advanced" snapshot (line 3+4 in progress).
      pushStep(rec, {
        title: `slow → n${newSlow + 1}, fast → n${newFast + 1}`,
        currentLine: 3,
        listNodes: layoutFor(lt, tailCount),
        listHighlights: {
          [nodes[newSlow].id]: "pointer",
          [nodes[newFast].id]: "compare",
        },
        variables: [
          { name: "slow", value: `n${newSlow}`, kind: "pointer", highlight: true },
          { name: "fast", value: `n${newFast}`, kind: "pointer", highlight: true },
          { name: "cmp", value: String(cmp), kind: "number" },
        ],
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });

      slow = newSlow;
      fast = newFast;
      cmp++;

      // Check (line 5).
      if (slow === fast) {
        pushStep(rec, {
          title: `slow == fast at n${slow + 1} → cycle detected`,
          currentLine: 5,
          listNodes: layoutFor(lt, tailCount),
          listHighlights: { [nodes[slow].id]: "mutate" },
          variables: [
            { name: "slow", value: `n${slow}`, kind: "pointer" },
            { name: "fast", value: `n${fast}`, kind: "pointer" },
            { name: "result", value: "cycle", kind: "pointer", highlight: true },
          ],
          comparisons: cmp,
          swaps: 0,
          writes: 0,
        });
        return rec.steps;
      }
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
