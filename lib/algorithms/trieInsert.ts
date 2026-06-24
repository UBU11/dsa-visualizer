// lib/algorithms/trieInsert.ts

import type {
  AlgorithmDefinition,
  TrieEdgeSnapshot,
  TrieNodeSnapshot,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

interface TN {
  id: string;
  char: string;
  isWord: boolean;
  children: Map<string, TN>;
  parent: TN | null;
  parentEdgeChar: string | null;
  depth: number;
}

const mk = (char: string, depth: number, parent: TN | null, parentEdgeChar: string | null, seq: { n: number }): TN => ({
  id: `n${seq.n++}-${char}-${depth}`,
  char,
  isWord: false,
  children: new Map(),
  parent,
  parentEdgeChar,
  depth,
});

function layout(root: TN | null): { nodes: TrieNodeSnapshot[]; edges: TrieEdgeSnapshot[] } {
  const nodes: TrieNodeSnapshot[] = [];
  const edges: TrieEdgeSnapshot[] = [];
  if (!root) return { nodes, edges };
  const per = new Map<number, number>();
  const walk = (n: TN) => {
    per.set(n.depth, (per.get(n.depth) ?? 0) + 1);
    for (const c of n.children.values()) walk(c);
  };
  walk(root);
  const slot = new Map<string, number>();
  const seen = new Map<number, number>();
  const assign = (n: TN) => {
    const row = per.get(n.depth)!;
    const col = seen.get(n.depth) ?? 0;
    slot.set(n.id, col);
    seen.set(n.depth, col + 1);
    const maxD = Math.max(...Array.from(per.keys()));
    const usableDepth = Math.min(maxD, 5);
    nodes.push({
      id: n.id,
      char: n.char,
      isWord: n.isWord,
      x: (col + 0.5) / row,
      y: usableDepth === 0 ? 0.5 : 0.1 + (n.depth / Math.max(usableDepth, 1)) * 0.78,
      parentId: n.parent?.id ?? null,
      depth: n.depth,
    });
    if (n.parent)
      edges.push({ id: `e-${n.parent.id}-${n.id}`, fromId: n.parent.id, toId: n.id, char: n.parentEdgeChar ?? "" });
    for (const c of n.children.values()) assign(c);
  };
  assign(root);
  return { nodes, edges };
}

export const trieInsert: AlgorithmDefinition = {
  id: "trie-insert",
  name: "Trie Insert",
  category: "Trees",
  structure: "tree",
  summary: "Insert words character-by-character; shared prefixes share nodes. Newly-created nodes turn rose.",
  pseudocode: [
    { line: 1, text: "insert(word):" },
    { line: 2, text: "  node ← root" },
    { line: 3, text: "  for c in word:" },
    { line: 4, text: "    if c not in node.children: create" },
    { line: 5, text: "    node ← node.children[c]" },
    { line: 6, text: "  node.isWord ← true" },
  ],
  configFields: [
    { key: "words", label: "Words (CSV)", kind: "text", default: "cat,car,card,care,cow" },
  ],
  run(cfg) {
    const words = String(cfg.words || "cat,car,card,care,cow")
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
    const seq = { n: 0 };
    const root = mk("·", 0, null, null, seq);
    const init = layout(root);
    const rec = createRecorder({
      index: 0,
      title: "Empty trie",
      currentLine: 1,
      trieNodes: init.nodes,
      trieEdges: init.edges,
      trieHighlights: {},
      variables: [],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const insertWord = (word: string) => {
      let node = root;
      for (const c of word) {
        if (!node.children.has(c)) {
          const child = mk(c, node.depth + 1, node, c, seq);
          node.children.set(c, child);
          const lt = layout(root);
          pushStep(rec, {
            title: `create node "${c}" under ${node.char === "·" ? "root" : node.char}`,
            currentLine: 4,
            trieNodes: lt.nodes,
            trieEdges: lt.edges,
            trieHighlights: { [child.id]: "mutate" },
            variables: [
              { name: "word", value: word, kind: "pointer" },
              { name: "char", value: c, kind: "pointer", highlight: true },
            ],
            comparisons: 0,
            swaps: 0,
            writes: 0,
          });
          node = child;
        } else {
          node = node.children.get(c)!;
          const lt = layout(root);
          pushStep(rec, {
            title: `traverse to "${c}"`,
            currentLine: 5,
            trieNodes: lt.nodes,
            trieEdges: lt.edges,
            trieHighlights: { [node.id]: "compare" },
            variables: [
              { name: "word", value: word, kind: "pointer" },
              { name: "char", value: c, kind: "pointer", highlight: true },
            ],
            comparisons: 0,
            swaps: 0,
            writes: 0,
          });
        }
      }
      node.isWord = true;
      const lt = layout(root);
      pushStep(rec, {
        title: `mark "${word}" as word`,
        currentLine: 6,
        trieNodes: lt.nodes,
        trieEdges: lt.edges,
        trieHighlights: { [node.id]: "sorted" },
        variables: [
          { name: "word", value: word, kind: "pointer", highlight: true },
        ],
        comparisons: 0,
        swaps: 0,
        writes: 0,
      });
    };

    for (const w of words) insertWord(w);

    const finalLt = layout(root);
    const sorted: Record<string, "sorted"> = {};
    finalLt.nodes.forEach((n) => (sorted[n.id] = "sorted"));
    pushStep(rec, {
      title: "Done ✓",
      currentLine: 6,
      trieNodes: finalLt.nodes,
      trieEdges: finalLt.edges,
      trieHighlights: sorted,
      variables: [
        { name: "inserted", value: words.length, kind: "number", highlight: true },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};