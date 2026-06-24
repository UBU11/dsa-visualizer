// lib/engine/registry.ts
// Central catalog. Adding a new algorithm:
//   1. implement AlgorithmDefinition.run
//   2. push it into the `algorithms` array below
// The UI auto-discovers it: dropdown, config form, and canvas all derive from here.

import type { AlgorithmDefinition } from "./types";
import { bubbleSort } from "@/lib/algorithms/bubbleSort";
import { selectionSort } from "@/lib/algorithms/selectionSort";
import { insertionSort } from "@/lib/algorithms/insertionSort";
import { mergeSort } from "@/lib/algorithms/mergeSort";
import { quickSort } from "@/lib/algorithms/quickSort";
import { heapSort } from "@/lib/algorithms/heapSort";
import { linearSearch } from "@/lib/algorithms/linearSearch";
import { binarySearch } from "@/lib/algorithms/binarySearch";
import { twoSum } from "@/lib/algorithms/twoSum";
import { slidingWindowMax } from "@/lib/algorithms/slidingWindowMax";
import { stackOps } from "@/lib/algorithms/stackOps";
import { queueOps } from "@/lib/algorithms/queueOps";
import { monotonicStack } from "@/lib/algorithms/monotonicStack";
import { linkedListReverse } from "@/lib/algorithms/linkedListReverse";
import { floydCycle } from "@/lib/algorithms/floydCycle";
import { bstInsert } from "@/lib/algorithms/bstInsert";
import { treeInorder } from "@/lib/algorithms/treeInorder";
import { trieInsert } from "@/lib/algorithms/trieInsert";
import { bfsGraph } from "@/lib/algorithms/bfsGraph";
import { dfsGraph } from "@/lib/algorithms/dfsGraph";
import { dijkstra } from "@/lib/algorithms/dijkstra";
import { bellmanFord } from "@/lib/algorithms/bellmanFord";
import { distanceVector } from "@/lib/algorithms/distanceVector";
import { topoSort } from "@/lib/algorithms/topoSort";
import { fibonacci } from "@/lib/algorithms/fibonacci";
import { coinChange } from "@/lib/algorithms/coinChange";
import { knapsack } from "@/lib/algorithms/knapsack";
import { lcs } from "@/lib/algorithms/lcs";
import { nQueens } from "@/lib/algorithms/nQueens";
import { kmp } from "@/lib/algorithms/kmp";
import { aesSimulation } from "@/lib/algorithms/aesSimulation";
import { diffieHellman } from "@/lib/algorithms/diffieHellman";
import { rsaSimulation } from "@/lib/algorithms/rsaSimulation";

export const algorithms: AlgorithmDefinition[] = [
  bubbleSort,
  selectionSort,
  insertionSort,
  mergeSort,
  quickSort,
  heapSort,
  linearSearch,
  binarySearch,
  twoSum,
  slidingWindowMax,
  stackOps,
  queueOps,
  monotonicStack,
  linkedListReverse,
  floydCycle,
  bstInsert,
  treeInorder,
  trieInsert,
  bfsGraph,
  dfsGraph,
  dijkstra,
  bellmanFord,
  distanceVector,
  topoSort,
  fibonacci,
  coinChange,
  knapsack,
  lcs,
  nQueens,
  kmp,
  aesSimulation,
  diffieHellman,
  rsaSimulation,
];

const byId = new Map(algorithms.map((a) => [a.id, a]));

export function getAlgorithm(id: string): AlgorithmDefinition | undefined {
  return byId.get(id);
}

export function defaultAlgorithmId(): string {
  return algorithms[0].id;
}

// Group by category for the dropdown UX.
export function algorithmsByCategory(): Record<
  AlgorithmDefinition["category"],
  AlgorithmDefinition[]
> {
  return algorithms.reduce(
    (acc, a) => {
      acc[a.category] ??= [];
      acc[a.category].push(a);
      return acc;
    },
    {} as Record<AlgorithmDefinition["category"], AlgorithmDefinition[]>,
  );
}