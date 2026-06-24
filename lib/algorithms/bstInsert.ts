// lib/algorithms/bstInsert.ts
// Builds a Binary Search Tree by inserting keys one at a time. The tree is
// laid out via a Reingold–Tilford-ish pass each frame: x = (i + 0.5)/N, then
// pulled apart horizontally by depth so parents sit above their mid-children.

import type {
  AlgorithmDefinition,
  TreeEdgeSnapshot,
  TreeNodeSnapshot,
  VariableFrame,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

interface BstNode {
  id: string;
  value: number;
  left: BstNode | null;
  right: BstNode | null;
}

const newNode = (value: number, counter: { n: number }): BstNode => ({
  id: `n${counter.n++}-${value}`,
  value,
  left: null,
  right: null,
});

// Walk the tree and assign normalized x/y positions per frame.
function layoutTree(
  root: BstNode | null,
): { nodes: TreeNodeSnapshot[]; edges: TreeEdgeSnapshot[] } {
  const nodes: TreeNodeSnapshot[] = [];
  const edges: TreeEdgeSnapshot[] = [];
  if (!root) return { nodes, edges };

  // Compute in-order index per node (used for x).
  const xMap = new Map<string, number>();
  let i = 0;
  const inorder = (n: BstNode | null) => {
    if (!n) return;
    inorder(n.left);
    xMap.set(n.id, i++);
    inorder(n.right);
  };
  inorder(root);

  // Depth per node.
  const depthMap = new Map<string, number>();
  const computeDepth = (n: BstNode | null, d: number) => {
    if (!n) return;
    depthMap.set(n.id, d);
    computeDepth(n.left, d + 1);
    computeDepth(n.right, d + 1);
  };
  computeDepth(root, 0);

  // Width per depth, then layout.
  const maxDepth = Math.max(...Array.from(depthMap.values()));
  const perRow = new Map<number, number>();
  for (const d of depthMap.values()) perRow.set(d, (perRow.get(d) ?? 0) + 1);

  // Assign a slot per row.
  const slot = new Map<string, number>();
  const seen = new Map<number, number>();
  const walk = (n: BstNode | null) => {
    if (!n) return;
    const row = perRow.get(depthMap.get(n.id)!);
    const col = seen.get(depthMap.get(n.id)!) ?? 0;
    slot.set(n.id, col);
    seen.set(depthMap.get(n.id)!, col + 1);
    walk(n.left);
    walk(n.right);
  };
  walk(root);

  const build = (n: BstNode | null, parentId: string | null) => {
    if (!n) return;
    const d = depthMap.get(n.id)!;
    const idx = xMap.get(n.id)!;
    const x = i > 1 ? (idx + 0.5) / i : 0.5;
    // Vertical: cap at depth 5 so deep trees still fit. Always leave a
    // bottom margin so the deepest node isn't clipped.
    const usableDepth = Math.min(maxDepth, 5);
    const y =
      usableDepth === 0 ? 0.5 : 0.08 + (d / Math.max(usableDepth, 1)) * 0.78;
    nodes.push({
      id: n.id,
      value: n.value,
      x,
      y,
      parentId,
    });
    if (parentId)
      edges.push({ id: `e-${parentId}-${n.id}`, fromId: parentId, toId: n.id });
    build(n.left, n.id);
    build(n.right, n.id);
  };
  build(root, null);

  return { nodes, edges };
}

export const bstInsert: AlgorithmDefinition = {
  id: "bst-insert",
  name: "BST Insert",
  category: "Trees",
  structure: "tree",
  summary:
    "Insert keys into a binary search tree one at a time. Compare (amber) at each node, descend, then place the new node (rose).",
  pseudocode: [
    { line: 1, text: "function insert(root, key):" },
    { line: 2, text: "  if root is null: return new Node(key)" },
    { line: 3, text: "  if key < root.key:" },
    { line: 4, text: "    root.left ← insert(root.left, key)" },
    { line: 5, text: "  else if key > root.key:" },
    { line: 6, text: "    root.right ← insert(root.right, key)" },
    { line: 7, text: "  return root" },
  ],
  configFields: [
    {
      key: "keys",
      label: "Keys (CSV)",
      kind: "text",
      default: "50,30,70,20,40,60,80,10,35,65",
    },
    {
      key: "seed",
      label: "Random seed",
      kind: "number",
      min: 1,
      max: 9999,
      step: 1,
      default: 1,
    },
  ],
  run(config) {
    const seed = Number(config.seed) || 1;
    let s = seed;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const rawKeys =
      typeof config.keys === "string" && (config.keys as string).trim().length > 0
        ? (config.keys as string)
            .split(",")
            .map((k) => parseInt(k.trim(), 10))
            .filter((n) => !Number.isNaN(n))
        : Array.from({ length: 8 }, () => 5 + Math.floor(rand() * 90));

    const keys = Array.from(new Set(rawKeys));
    const counter = { n: 0 };

    let root: BstNode | null = null;
    const { nodes: initNodes, edges: initEdges } = layoutTree(root);
    const rec = createRecorder({
      index: 0,
      title: "Empty BST",
      description: `insert ${keys.length} keys`,
      currentLine: 1,
      treeNodes: initNodes,
      treeEdges: initEdges,
      treeHighlights: {},
      variables: [],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    let cmp = 0;

    const snap = (
      highlights: Record<string, "compare" | "mutate" | "sorted" | "pointer">,
      title: string,
      line: number,
      vars: VariableFrame[],
      desc?: string,
    ) => {
      const { nodes, edges } = layoutTree(root);
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        treeNodes: nodes,
        treeEdges: edges,
        treeHighlights: highlights,
        variables: vars,
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });
    };

    const insert = (key: number, parentPath: string[]): BstNode => {
      const node = newNode(key, counter);
      const pathStr = parentPath.length ? parentPath.join(" → ") + " → " : "";
      snap(
        {},
        `insert ${key} as new node`,
        2,
        [{ name: "key", value: key, kind: "number" }],
        `path so far: ${pathStr || "(root)"}`,
      );
      if (!root) {
        root = node;
        snap(
          { [node.id]: "mutate" },
          `place ${key} at root`,
          2,
          [{ name: "key", value: key, kind: "number" }],
        );
        return node;
      }
      // Walk down.
      let cur: BstNode = root;
      while (true) {
        cmp++;
        if (key < cur.value) {
          snap(
            { [cur.id]: "compare", [node.id]: "pointer" },
            `${key} < ${cur.value}, descend left`,
            3,
            [
              { name: "key", value: key, kind: "number" },
              { name: "cur", value: cur.value, kind: "pointer", highlight: true },
            ],
          );
          if (!cur.left) {
            cur.left = node;
            snap(
              { [node.id]: "mutate", [cur.id]: "sorted" },
              `attach ${key} as left child of ${cur.value}`,
              4,
              [
                { name: "key", value: key, kind: "number" },
                { name: "parent", value: cur.value, kind: "number" },
              ],
            );
            break;
          }
          cur = cur.left;
        } else if (key > cur.value) {
          snap(
            { [cur.id]: "compare", [node.id]: "pointer" },
            `${key} > ${cur.value}, descend right`,
            5,
            [
              { name: "key", value: key, kind: "number" },
              { name: "cur", value: cur.value, kind: "pointer", highlight: true },
            ],
          );
          if (!cur.right) {
            cur.right = node;
            snap(
              { [node.id]: "mutate", [cur.id]: "sorted" },
              `attach ${key} as right child of ${cur.value}`,
              6,
              [
                { name: "key", value: key, kind: "number" },
                { name: "parent", value: cur.value, kind: "number" },
              ],
            );
            break;
          }
          cur = cur.right;
        } else {
          snap(
            { [cur.id]: "compare", [node.id]: "pointer" },
            `${key} == ${cur.value}, duplicate — skip`,
            7,
            [
              { name: "key", value: key, kind: "number" },
              { name: "cur", value: cur.value, kind: "pointer" },
            ],
          );
          break;
        }
      }
      return node;
    };

    for (const k of keys) insert(k, []);

    const { nodes, edges } = layoutTree(root);
    const allHi: Record<string, "sorted"> = {};
    nodes.forEach((n) => (allHi[n.id] = "sorted"));
    pushStep(rec, {
      title: "Tree built ✓",
      description: `inserted ${keys.length} keys, ${cmp} compares`,
      currentLine: 7,
      treeNodes: nodes,
      treeEdges: edges,
      treeHighlights: allHi,
      variables: [
        { name: "inserted", value: keys.length, kind: "number" },
        { name: "compares", value: cmp, kind: "number" },
      ],
      comparisons: cmp,
      swaps: 0,
      writes: 0,
    });

    return rec.steps;
  },
};