// components/layout/Shell.tsx
"use client";

import { usePlayer } from "@/lib/store";
import { ArrayView } from "@/components/canvas/ArrayView";
import { TreeView } from "@/components/canvas/TreeView";
import { GraphView } from "@/components/canvas/GraphView";
import { LinkedListView } from "@/components/canvas/LinkedListView";
import { StackView } from "@/components/canvas/StackView";
import { QueueView } from "@/components/canvas/QueueView";
import { DPGridView } from "@/components/canvas/DPGridView";
import { BacktrackGridView } from "@/components/canvas/BacktrackGridView";
import { StringMaskView } from "@/components/canvas/StringMaskView";
import { TrieView } from "@/components/canvas/TrieView";

export function Shell() {
  const step = usePlayer((s) => s.currentStep());
  const def = usePlayer((s) => s.currentAlgorithm());

  return (
    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
      <div
        className="relative h-full w-full rounded-md border border-zinc-800 overflow-hidden transform-gpu"
        style={{
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(#1f1f23 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        {step && def.structure === "array" && <ArrayView step={step} />}
        {step && def.structure === "tree" && <TreeView step={step} />}
        {step && def.structure === "trie" && <TrieView step={step} />}
        {step && def.structure === "graph" && <GraphView step={step} />}
        {step && def.structure === "list" && <LinkedListView step={step} />}
        {step && def.structure === "stack" && <StackView step={step} />}
        {step && def.structure === "queue" && <QueueView step={step} />}
        {step && def.structure === "dp" && <DPGridView step={step} />}
        {step && def.structure === "backtrack" && <BacktrackGridView step={step} />}
        {step && def.structure === "string" && <StringMaskView step={step} />}
      </div>
    </div>
  );
}