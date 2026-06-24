// components/canvas/StringMaskView.tsx
// Dual horizontal tracks: static text on top, pattern sliding along bottom.

"use client";

import { motion } from "framer-motion";
import type { HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";

interface Props {
  step: HistoryStep;
}

export function StringMaskView({ step }: Props) {
  const text = step.stringText ?? [];
  const pattern = step.stringPattern ?? [];
  const textIdx = step.stringTextIndex ?? 0;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8 p-6 overflow-hidden">
      {/* Text track */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Text</div>
        <div className="flex gap-1">
          {text.map((c) => {
            const token = c.highlight as SemanticToken | undefined;
            const palette = token ? tokenColors[token] : null;
            const isWindow = c.index >= textIdx && c.index < textIdx + pattern.length;
            return (
              <motion.div
                key={c.id}
                layout
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className={`w-10 h-12 grid place-items-center rounded-sm border font-mono text-sm font-semibold ${
                  palette
                    ? `${palette.bg} ${palette.border}`
                    : isWindow
                      ? "bg-zinc-700 border-amber-500/40 text-zinc-100"
                      : defaultCellClass
                }`}
              >
                {c.char}
              </motion.div>
            );
          })}
        </div>
        <div className="flex gap-1">
          {text.map((c) => (
            <div key={`idx-${c.id}`} className="w-10 text-center text-[9px] font-mono text-zinc-600">
              {c.index}
            </div>
          ))}
        </div>
      </div>

      {/* Pattern track */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Pattern</div>
        <motion.div
          animate={{ x: textIdx * 44 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="flex gap-1"
          style={{ width: "max-content" }}
        >
          {pattern.map((c) => {
            const token = c.highlight as SemanticToken | undefined;
            const palette = token ? tokenColors[token] : null;
            return (
              <div
                key={c.id}
                className={`w-10 h-12 grid place-items-center rounded-sm border font-mono text-sm font-semibold ${
                  palette ? `${palette.bg} ${palette.border}` : "bg-zinc-700 border-zinc-600 text-zinc-100"
                }`}
              >
                {c.char}
              </div>
            );
          })}
        </motion.div>
        <div className="flex gap-1" style={{ transform: `translateX(${textIdx * 44}px)` }}>
          {pattern.map((c) => (
            <div key={`pidx-${c.id}`} className="w-10 text-center text-[9px] font-mono text-zinc-600">
              {c.index}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}