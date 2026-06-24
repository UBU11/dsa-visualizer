# DSA Visualizer

Step-by-step interactive visualization for 27+ algorithms spanning arrays,
sorting, searching, stacks/queues, linked lists, trees, tries, graphs, dynamic
programming, backtracking, and string matching. Every algorithm runs as a
pre-computed step log that the player scrubs through — playback is fully
deterministic and frame-by-frame synchronous across canvas, pseudocode, and
state inspector.

## Stack

- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript 5**
- **Tailwind v4** (design tokens: zinc + amber/rose/emerald/indigo)
- **Framer Motion 12** (FLIP via `layoutId`, `pathLength` edge animations,
  spring-based pointer interpolation)
- **Zustand 5** (single player store — every panel subscribes to the same
  `currentStepIndex`)

## Layout (per the AGENT.md spec)

```
┌──────────────────────────────────────────────────────────────────────┐
│  TopBar       Logo · Algorithm selector · Step counter · Reseed/Reset│
├────────────┬─────────────────────────────────────────┬───────────────┤
│            │                                         │  Pseudocode   │
│  Library   │            Interactive Canvas           │   + State     │
│  + Config  │           (radial dot grid backdrop)    │   Inspector   │
│            │                                         │   + Counters  │
├────────────┴─────────────────────────────────────────┴───────────────┤
│  Timeline   ◀ ▶ ❚❚ ▶   scrubber ─────●─────────  speed: 1×  ─ 30×     │
└──────────────────────────────────────────────────────────────────────┘
```

The entire app is pinned to `100vh × 100vw`. No body scroll. Every pane has a
fixed width/height token (`h-12`, `w-64`, `flex-1`, `w-80`, `h-16`).

## Color tokens (semantic, not decorative)

| Token      | Color           | Meaning                                    |
|------------|-----------------|--------------------------------------------|
| `compare`  | amber-500       | pointer read / comparison                  |
| `mutate`   | rose-600        | swap / write / overwrite                   |
| `sorted`   | emerald-600     | locked-in position / visited-done          |
| `pointer`  | indigo-600      | pivot / target / frontier / index marker   |
| `visited`  | slate-600       | inspected but not final                    |

Default (no highlight) is zinc-800 / slate-200. Every color carries
meaning — there is no decoration.

## Algorithms

| Category          | Algorithms                                                                        | Canvas          |
|-------------------|------------------------------------------------------------------------------------|-----------------|
| Sorting           | Bubble, Selection, Insertion, Merge, Quick, Heap                                   | bars            |
| Searching         | Linear, Binary, Two Sum (sorted two-pointer), Sliding Window Max                  | bars            |
| Stacks & Queues   | Stack (push/pop), Queue (enq/deq), Monotonic Stack (Next Greater)                | stack / queue   |
| Lists             | Linked List Reverse, Floyd's Cycle Detection                                      | list            |
| Trees             | BST Insert, Tree Inorder Traversal, Trie Insert                                   | tree / trie     |
| Graphs            | BFS, DFS, Dijkstra, Topological Sort (Kahn)                                       | graph           |
| DP                | Fibonacci (Tabulation), Coin Change, 0/1 Knapsack, LCS                            | dp-grid         |
| Backtracking      | N-Queens                                                                           | backtrack grid  |
| Strings           | KMP Search                                                                         | string mask     |

## Adding a new algorithm

Three steps:

### 1. Create the file

`lib/algorithms/yourAlgo.ts`

```ts
import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const yourAlgo: AlgorithmDefinition = {
  id: "your-algo",                    // stable slug
  name: "Your Algo",
  category: "Sorting",                // controls sidebar grouping
  structure: "array",                 // controls which canvas renders
  summary: "One-line description.",
  pseudocode: [
    { line: 1, text: "for i ..." },
    { line: 2, text: "  compare..." },
  ],
  configFields: [
    { key: "size", label: "Size", kind: "number", min: 4, max: 16, step: 1, default: 10 },
    { key: "seed", label: "Seed", kind: "number", min: 1, max: 9999, step: 1, default: 42 },
    { key: "keys", label: "Keys (CSV)", kind: "text", default: "1,2,3" },
    { key: "mode", label: "Mode", kind: "select", default: "a",
      options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] },
    { key: "verbose", label: "Verbose", kind: "toggle", default: false },
  ],
  run(config) {
    const size = Number(config.size) || 10;
    const values = Array.from({ length: size }, () => Math.floor(Math.random() * 90));
    const arr = [...values];
    let cmp = 0;
    let swp = 0;

    // Frame 0 = initial state. Every step must paint the full visual state.
    const initialCells = arr.map((v, i) => ({ id: `c-${i}-${v}`, value: v }));
    const rec = createRecorder({
      index: 0,
      title: "Initial array",
      currentLine: 1,
      arrayCells: initialCells,
      arrayHighlights: {},
      variables: [{ name: "n", value: size, kind: "number" }],
      comparisons: 0, swaps: 0, writes: 0,
    });

    // ... your algorithm here, calling pushStep() at every visual event ...
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - 1; j++) {
        cmp++;
        pushStep(rec, {
          title: `compare a[${j}]=${arr[j]} vs a[${j + 1}]=${arr[j + 1]}`,
          currentLine: 2,
          arrayCells: arr.map((v, k) => ({ id: `c-${k}-${v}`, value: v })),
          arrayHighlights: { [`c-${j}-${arr[j]}`]: "compare", [`c-${j + 1}-${arr[j + 1]}`]: "compare" },
          variables: [
            { name: "i", value: i, kind: "number" },
            { name: "j", value: j, kind: "number" },
          ],
          comparisons: cmp, swaps: swp,
        });
        // ...
      }
    }
    return rec.steps;
  },
};
```

### 2. Register it

`lib/engine/registry.ts` — add to the `algorithms` array:

```ts
import { yourAlgo } from "@/lib/algorithms/yourAlgo";

export const algorithms: AlgorithmDefinition[] = [
  bubbleSort,
  yourAlgo,        // ← here
  // ...
];
```

### 3. Done

The TopBar dropdown auto-groups it under `Sorting`. The LeftPanel sidebar
auto-shows it with the right color dot. The config form auto-renders from
`configFields`. The Canvas routes to `ArrayView` (because `structure: "array"`).
Pseudocode highlighting auto-binds to `currentLine`. State inspector renders
any `variables[]` you push.

No other file needs to change. If your algorithm needs a *new* canvas type
(e.g. segment trees), add a `StructureKind` variant in `lib/engine/types.ts`,
extend the `PushOptions` payload in `lib/engine/runner.ts`, build a new
`components/canvas/<Your>View.tsx`, and branch on it in `components/layout/Shell.tsx`.

## Design rules baked into the engine

- **Pure functions.** `AlgorithmDefinition.run` takes config, returns
  `HistoryStep[]`. No DOM, no React, no `setTimeout`. This makes every
  algorithm deterministic, testable, and replayable.
- **Decoupled visual state from computation.** All visual state is computed
  up-front and stored in the step log. Playback just indexes into the array.
- **Synchronized playback.** Canvas, pseudocode highlight, variable
  inspector, and counters all subscribe to the same `currentStepIndex`.
  Scrubbing the timeline updates everything atomically.
- **Hardware-accelerated transforms.** The canvas container has
  `transform-gpu` so Framer Motion's `layout` animations stay smooth at 60fps
  even with many elements.

## Run it

```bash
cd dsa-visualizer
npm install
npm run dev    # http://localhost:3000
npm run build  # production
```