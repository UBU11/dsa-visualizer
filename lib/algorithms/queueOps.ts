// lib/algorithms/queueOps.ts

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const queueOps: AlgorithmDefinition = {
  id: "queue-ops",
  name: "Queue (enqueue / dequeue)",
  category: "Stacks & Queues",
  structure: "queue",
  summary: "FIFO demonstration: enqueue from the right, dequeue from the left.",
  pseudocode: [
    { line: 1, text: "enqueue 1, 2, 3" },
    { line: 2, text: "dequeue → 1" },
    { line: 3, text: "enqueue 4" },
    { line: 4, text: "dequeue → 2" },
    { line: 5, text: "dequeue → 3" },
    { line: 6, text: "dequeue → 4" },
  ],
  configFields: [],
  run() {
    const rec = createRecorder({
      index: 0,
      title: "Empty queue",
      currentLine: 1,
      queueFrames: [],
      variables: [
        { name: "action", value: "idle", kind: "state" },
        { name: "front", value: 0, kind: "number" },
        { name: "rear", value: -1, kind: "number" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    const frames: { id: string; value: string }[] = [];
    let seq = 0;
    const op = (action: "enqueue" | "dequeue", value?: string) => {
      if (action === "enqueue" && value !== undefined) {
        const f = { id: `q${seq++}-${value}`, value };
        frames.push(f);
        pushStep(rec, {
          title: `enqueue ${value}`,
          currentLine: 1,
          queueFrames: frames.map((fr) => ({ id: fr.id, value: fr.value })),
          queueHighlights: { [f.id]: "mutate" },
          variables: [
            { name: "action", value: "enqueue", kind: "state" },
            { name: "front", value: 0, kind: "number" },
            { name: "rear", value: frames.length - 1, kind: "number" },
          ],
          comparisons: 0,
          swaps: 0,
          writes: 0,
        });
      } else if (action === "dequeue") {
        const f = frames.shift();
        if (f) {
          pushStep(rec, {
            title: `dequeue → ${f.value}`,
            currentLine: 2,
            queueFrames: frames.map((fr) => ({ id: fr.id, value: fr.value })),
            variables: [
              { name: "action", value: "dequeue", kind: "state" },
              { name: "dequeued", value: f.value, kind: "pointer", highlight: true },
              { name: "front", value: 0, kind: "number" },
              { name: "rear", value: frames.length - 1, kind: "number" },
            ],
            comparisons: 0,
            swaps: 0,
            writes: 0,
          });
        }
      }
    };
    op("enqueue", "1");
    op("enqueue", "2");
    op("enqueue", "3");
    op("dequeue");
    op("enqueue", "4");
    op("dequeue");
    op("dequeue");
    op("dequeue");
    pushStep(rec, {
      title: "Done ✓",
      currentLine: 6,
      queueFrames: [],
      variables: [
        { name: "action", value: "idle", kind: "state" },
        { name: "front", value: 0, kind: "number" },
        { name: "rear", value: -1, kind: "number" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};