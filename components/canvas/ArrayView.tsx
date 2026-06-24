// components/canvas/ArrayView.tsx
// Horizontal bar visualization. layoutId on each cell is its unique
// `ArrayCell.id` (slot+value), so swap animations are real FLIPs.

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ArrayCell, HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";

interface Props {
  step: HistoryStep;
}

export function ArrayView({ step }: Props) {
  const cells: ArrayCell[] = step.arrayCells ?? [];
  const highlights: Record<string, SemanticToken> = step.arrayHighlights ?? {};
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellW, setCellW] = useState(48);

  // Fit cell width to viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const padding = 32;
    const gap = 8;
    const n = Math.max(cells.length, 1);
    const measure = () => {
      const available = el.clientWidth - padding;
      const w = Math.max(28, Math.min(72, Math.floor((available - gap * (n - 1)) / n)));
      setCellW(w);
    };
    // Seed on mount — ResizeObserver alone won't fire if mounted at final size.
    measure();
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cells.length]);

  if (cells.length === 0) {
    return (
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden flex items-center justify-center text-zinc-500 text-xs"
      >
        empty array
      </div>
    );
  }

  const max = Math.max(...cells.map((c) => Number(c.value) || 0), 1);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden p-4 flex items-end justify-center gap-2"
    >
      {cells.map((cell) => {
        const token = highlights[cell.id];
        const palette = token ? tokenColors[token] : null;
        const v = Number(cell.value) || 0;
        const heightPct = Math.max(8, (v / max) * 80); // 80% of canvas height max
        return (
          <motion.div
            key={cell.id}
            layoutId={cell.id}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center gap-1"
            style={{ width: cellW }}
          >
            <span
              className={`font-mono text-sm font-semibold ${
                palette ? palette.text : "text-zinc-100"
              }`}
            >
              {cell.value}
            </span>
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`w-full border ${
                palette
                  ? `${palette.bg} ${palette.border}`
                  : defaultCellClass
              } rounded-sm`}
              style={{ height: `${heightPct * 1.2}px` }}
            />
            <span className="font-mono text-[10px] text-zinc-500">
              {cells.indexOf(cell)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}