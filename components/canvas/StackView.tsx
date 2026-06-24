// components/canvas/StackView.tsx
// Vertical walled container. New blocks drop in from the top.

"use client";

import { motion } from "framer-motion";
import type { HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";

interface Props {
  step: HistoryStep;
}

export function StackView({ step }: Props) {
  const frames = step.stackFrames ?? [];
  const highlights = step.stackHighlights ?? {};
  const action = (step.variables.find((v) => v.name === "action")?.value ?? "idle") as string;
  const topIdx = Number(step.variables.find((v) => v.name === "top")?.value ?? frames.length - 1);

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden p-6">
      {/* Wall rails (left + right) */}
      <div className="relative flex flex-col-reverse items-stretch gap-1 max-h-full">
        {/* Floor */}
        <div className="h-1 w-44 bg-zinc-700 rounded-sm" />
        {frames.length === 0 && (
          <div className="h-32 w-44 grid place-items-center text-zinc-500 text-xs font-mono border border-dashed border-zinc-700 rounded-sm">
            empty stack
          </div>
        )}
        {frames.map((f, i) => {
          const token = highlights[f.id] ?? (i === topIdx ? "pointer" : undefined);
          const palette = token ? tokenColors[token as SemanticToken] : null;
          const isJustPushed = action === "push" && i === topIdx;
          return (
            <motion.div
              key={f.id}
              layout
              initial={isJustPushed ? { y: -160, opacity: 0 } : { scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className={`h-12 w-44 grid place-items-center border rounded-sm font-mono text-sm font-semibold ${
                palette ? `${palette.bg} ${palette.border}` : defaultCellClass
              }`}
            >
              {String(f.value)}
            </motion.div>
          );
        })}
      </div>
      <div className="absolute right-6 top-6 font-mono text-[10px] text-zinc-500">
        action: <span className="text-zinc-200">{action}</span>
      </div>
    </div>
  );
}