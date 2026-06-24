// lib/algorithms/stackOps.ts
// Pure push/pop exercise on a stack.

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const stackOps: AlgorithmDefinition = {
  id: "stack-ops",
  name: "Stack (push / pop)",
  category: "Stacks & Queues",
  structure: "stack",
  summary: "Demonstrate LIFO behavior with a scripted push/pop sequence. Pushed frames drop in from the top; popped frames fade out.",
  pseudocode: [
    { line: 1, text: "push A, push B, push C" },
    { line: 2, text: "pop → C" },
    { line: 3, text: "pop → B" },
    { line: 4, text: "push D" },
    { line: 5, text: "pop → D" },
    { line: 6, text: "pop → A" },
  ],
  configFields: [],
  run() {
    const rec = createRecorder({
      index: 0,
      title: "Empty stack",
      currentLine: 1,
      stackFrames: [],
      variables: [
        { name: "action", value: "idle", kind: "state" },
        { name: "top", value: -1, kind: "number" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    const frames: { id: string; value: string }[] = [];
    let seq = 0;
    const op = (action: "push" | "pop", value?: string) => {
      if (action === "push" && value !== undefined) {
        const f = { id: `f${seq++}-${value}`, value };
        frames.push(f);
        pushStep(rec, {
          title: `push ${value}`,
          currentLine: 1,
          stackFrames: frames.map((fr) => ({ id: fr.id, value: fr.value })),
          stackHighlights: { [f.id]: "mutate" },
          variables: [
            { name: "action", value: "push", kind: "state" },
            { name: "top", value: frames.length - 1, kind: "number" },
          ],
          comparisons: 0,
          swaps: 0,
          writes: 0,
        });
      } else if (action === "pop") {
        const f = frames.pop();
        if (f) {
          pushStep(rec, {
            title: `pop → ${f.value}`,
            currentLine: 2,
            stackFrames: frames.map((fr) => ({ id: fr.id, value: fr.value })),
            variables: [
              { name: "action", value: "pop", kind: "state" },
              { name: "popped", value: f.value, kind: "pointer", highlight: true },
              { name: "top", value: frames.length - 1, kind: "number" },
            ],
            comparisons: 0,
            swaps: 0,
            writes: 0,
          });
        }
      }
    };
    op("push", "A");
    op("push", "B");
    op("push", "C");
    op("pop");
    op("pop");
    op("push", "D");
    op("pop");
    op("pop");
    pushStep(rec, {
      title: "Done ✓",
      currentLine: 6,
      stackFrames: frames.map((fr) => ({ id: fr.id, value: fr.value })),
      variables: [
        { name: "action", value: "idle", kind: "state" },
        { name: "top", value: frames.length - 1, kind: "number" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};