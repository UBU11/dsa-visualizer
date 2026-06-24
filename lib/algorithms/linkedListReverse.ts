// lib/algorithms/linkedListReverse.ts

import type {
  AlgorithmDefinition,
  LinkedListNodeSnapshot,
  VariableFrame,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

interface LLNode {
  id: string;
  value: number;
  nextId: string | null;
}

export const linkedListReverse: AlgorithmDefinition = {
  id: "linked-list-reverse",
  name: "Linked List Reverse",
  category: "Lists",
  structure: "list",
  summary:
    "Iteratively reverse a singly linked list using three pointers: prev, cur, next. Each mutation rewires a `.next` (rose).",
  pseudocode: [
    { line: 1, text: "prev ← null" },
    { line: 2, text: "cur ← head" },
    { line: 3, text: "while cur ≠ null:" },
    { line: 4, text: "  next ← cur.next" },
    { line: 5, text: "  cur.next ← prev" },
    { line: 6, text: "  prev ← cur" },
    { line: 7, text: "  cur ← next" },
    { line: 8, text: "head ← prev" },
  ],
  configFields: [
    {
      key: "size",
      label: "Node count",
      kind: "number",
      min: 4,
      max: 14,
      step: 1,
      default: 7,
    },
    {
      key: "seed",
      label: "Random seed",
      kind: "number",
      min: 1,
      max: 9999,
      step: 1,
      default: 99,
    },
  ],
  run(config) {
    const size = Number(config.size) || 7;
    const seed = Number(config.seed) || 99;
    let s = seed;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const values: number[] = Array.from(
      { length: size },
      () => 10 + Math.floor(rand() * 90),
    );
    const nodes: LLNode[] = values.map((v, i) => ({
      id: `node-${i}`,
      value: v,
      nextId: i + 1 < values.length ? `node-${i + 1}` : null,
    }));

    // Layout: horizontal row centered in canvas.
    const layout = (
      list: LLNode[],
    ): { snaps: LinkedListNodeSnapshot[]; order: string[] } => {
      const n = list.length;
      const snaps: LinkedListNodeSnapshot[] = list.map((node, idx) => ({
        id: node.id,
        value: node.value,
        x: (idx + 0.5) / n,
        y: 0.5,
        nextId: node.nextId,
      }));
      return { snaps, order: list.map((l) => l.id) };
    };

    const rec = createRecorder({
      index: 0,
      title: "Initial list",
      description: `${size} nodes`,
      currentLine: 1,
      listNodes: layout(nodes).snaps,
      listHighlights: {},
      variables: [
        { name: "prev", value: "null", kind: "pointer" },
        { name: "cur", value: nodes[0]?.id ?? "null", kind: "pointer" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    let prev: LLNode | null = null;
    let cur: LLNode | null = nodes[0] ?? null;

    const snap = (
      highlights: Record<string, "compare" | "mutate" | "sorted" | "pointer" | "visited">,
      title: string,
      line: number,
      vars: VariableFrame[],
      desc?: string,
    ) => {
      const { snaps } = layout(nodes);
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        listNodes: snaps,
        listHighlights: highlights,
        variables: vars,
        comparisons: 0,
        swaps: 0,
        writes: 0,
      });
    };

    let writes = 0;
    while (cur) {
      const c: LLNode = cur;
      snap(
        {
          [c.id]: "pointer",
          ...(prev ? { [prev.id]: "visited" } : {}),
        },
        `cur = node ${c.value}`,
        3,
        [
          { name: "prev", value: prev ? prev.id : "null", kind: "pointer" },
          { name: "cur", value: c.id, kind: "pointer", highlight: true },
        ],
      );
      const next: LLNode | null =
        nodes.find((n) => n.id === c.nextId) ?? null;
      // capture next for the description
      snap(
        {
          [c.id]: "compare",
          ...(next ? { [next.id]: "pointer" } : {}),
        },
        `next = cur.next${next ? ` (= ${next.value})` : " (null)"}`,
        4,
        [
          { name: "next", value: next ? next.id : "null", kind: "pointer" },
          { name: "cur", value: c.id, kind: "pointer" },
        ],
      );
      c.nextId = prev ? prev.id : null;
      writes++;
      snap(
        { [c.id]: "mutate" },
        `cur.next = prev${prev ? ` (= ${prev.value})` : " (null)"}`,
        5,
        [
          { name: "cur", value: c.id, kind: "pointer", highlight: true },
          { name: "cur.next", value: prev ? prev.id : "null", kind: "pointer" },
        ],
        "rewire pointer",
      );
      prev = c;
      cur = next;
      snap(
        {
          ...(prev ? { [prev.id]: "sorted" } : {}),
          ...(cur ? { [cur.id]: "pointer" } : {}),
        },
        `advance: prev = ${prev?.value}, cur = ${cur ? cur.value : "null"}`,
        7,
        [
          { name: "prev", value: prev ? prev.id : "null", kind: "pointer" },
          { name: "cur", value: cur ? cur.id : "null", kind: "pointer" },
        ],
      );
    }
    // Final frame: relayout so visually the chain points the other way.
    const reversed = [...nodes].reverse();
    const map = new Map(reversed.map((n) => [n.id, n]));
    const newList: LLNode[] = reversed.map((n, i) => ({
      ...n,
      nextId: i + 1 < reversed.length ? reversed[i + 1].id : null,
    }));
    // Re-render with new order
    const final = layout(newList);
    pushStep(rec, {
      title: "Reversed ✓",
      description: `${writes} pointer rewrites`,
      currentLine: 8,
      listNodes: final.snaps,
      listHighlights: Object.fromEntries(final.snaps.map((s) => [s.id, "sorted" as const])),
      variables: [
        { name: "head", value: map.get(nodes[0].id)?.id ?? "null", kind: "pointer", highlight: true },
        { name: "writes", value: writes, kind: "number" },
      ],
      comparisons: 0,
      swaps: 0,
      writes,
    });

    return rec.steps;
  },
};