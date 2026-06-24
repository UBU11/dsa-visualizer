// components/canvas/QueueView.tsx
// Horizontal linear track; elements enter from the right, exit from the left.

"use client";

import { motion } from "framer-motion";
import type { HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";

interface Props {
  step: HistoryStep;
}

export function QueueView({ step }: Props) {
  const frames = step.queueFrames ?? [];
  const highlights = step.queueHighlights ?? {};
  const front = Number(step.variables.find((v) => v.name === "front")?.value ?? 0);
  const rear = Number(step.variables.find((v) => v.name === "rear")?.value ?? frames.length - 1);
  const action = (step.variables.find((v) => v.name === "action")?.value ?? "idle") as string;

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden p-6">
      <div className="relative">
        {/* Track rail */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-zinc-700" />
        <div className="relative flex gap-1 items-center min-h-[64px] px-12">
          {frames.length === 0 && (
            <div className="h-12 w-32 grid place-items-center text-zinc-500 text-xs font-mono border border-dashed border-zinc-700 rounded-sm">
              empty queue
            </div>
          )}
          {frames.map((f, i) => {
            const token = highlights[f.id] ?? (i === front ? "pointer" : i === rear ? "mutate" : undefined);
            const palette = token ? tokenColors[token as SemanticToken] : null;
            const entering = action === "enqueue" && i === rear;
            return (
              <motion.div
                key={f.id}
                layout
                initial={entering ? { x: 80, opacity: 0 } : { scale: 0.9, opacity: 0 }}
                animate={{ x: 0, scale: 1, opacity: 1 }}
                exit={{ x: -80, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className={`w-14 h-12 grid place-items-center border rounded-sm font-mono text-sm font-semibold ${
                  palette ? `${palette.bg} ${palette.border}` : defaultCellClass
                }`}
              >
                {String(f.value)}
              </motion.div>
            );
          })}
        </div>
        {/* Arrows */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-amber-400 font-mono text-xs">▶ dequeue</div>
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-rose-400 font-mono text-xs">enqueue ◀</div>
      </div>
      <div className="absolute right-6 top-6 font-mono text-[10px] text-zinc-500">
        action: <span className="text-zinc-200">{action}</span>
      </div>
    </div>
  );
}