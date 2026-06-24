// components/canvas/BacktrackGridView.tsx

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { BacktrackCell, HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";

interface Props {
  step: HistoryStep;
}

export function BacktrackGridView({ step }: Props) {
  const rows = step.gridRows ?? 0;
  const cols = step.gridCols ?? 0;
  const cells = step.gridCells ?? [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(48);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth - 32;
      const h = el.clientHeight - 32;
      const size = Math.max(20, Math.min(64, Math.floor(Math.min(w / cols, h / rows))));
      setCellSize(size);
    };
    // Seed on mount — ResizeObserver alone won't fire if mounted at final size.
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols, rows]);

  if (rows === 0 || cols === 0) {
    return <div className="grid h-full place-items-center text-zinc-500 text-xs">empty grid</div>;
  }

  const cellMap = new Map<string, BacktrackCell>();
  cells.forEach((c) => cellMap.set(`${c.row},${c.col}`, c));
  const current = cells.find((c) => c.highlight === "compare");
  const invalid = cells.find((c) => c.highlight === "mutate");

  return (
    <div ref={containerRef} className="relative h-full w-full flex items-center justify-center overflow-hidden p-4">
      <div className="flex gap-8">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Board</div>
          <div
            className="grid gap-px bg-zinc-800 border border-zinc-800"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: rows * cols }).map((_, idx) => {
              const r = Math.floor(idx / cols);
              const c = idx % cols;
              const cell = cellMap.get(`${r},${c}`);
              const token = cell?.highlight as SemanticToken | undefined;
              const palette = token ? tokenColors[token] : null;
              return (
                <motion.div
                  key={`${r}-${c}`}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`grid place-items-center font-mono text-xs font-semibold border ${
                    palette
                      ? `${palette.bg} ${palette.border}`
                      : defaultCellClass
                  }`}
                  style={{ width: cellSize, height: cellSize }}
                >
                  {cell ? (typeof cell.value === "string" ? cell.value : "") : ""}
                </motion.div>
              );
            })}
          </div>
          {current && (
            <div className="mt-2 text-[10px] font-mono text-amber-400">
              cell ({current.row}, {current.col})
            </div>
          )}
          {invalid && (
            <div className="mt-1 text-[10px] font-mono text-rose-400">
              rejected ({invalid.row}, {invalid.col}) — backtrack
            </div>
          )}
        </div>
      </div>
    </div>
  );
}