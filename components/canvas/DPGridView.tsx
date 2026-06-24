// components/canvas/DPGridView.tsx
// 2D matrix with active cell + dependency-cell arrows.

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { DPCell, HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";

interface Props {
  step: HistoryStep;
}

export function DPGridView({ step }: Props) {
  const rows = step.dpRows ?? 0;
  const cols = step.dpCols ?? 0;
  const cells = step.dpCells ?? [];
  const rowLabels = step.dpRowLabels ?? [];
  const colLabels = step.dpColLabels ?? [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(48);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth - 80;
      const h = el.clientHeight - 80;
      const size = Math.max(24, Math.min(64, Math.floor(Math.min(w / cols, h / rows))));
      setCellSize(size);
    };
    // Seed on mount — ResizeObserver alone won't fire if mounted at final size.
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols, rows]);

  if (rows === 0 || cols === 0) {
    return <div className="grid h-full place-items-center text-zinc-500 text-xs">empty dp table</div>;
  }

  const cellMap = new Map<string, DPCell>();
  cells.forEach((c) => cellMap.set(`${c.row},${c.col}`, c));
  const current = cells.find((c) => c.isCurrent);

  return (
    <div ref={containerRef} className="relative h-full w-full flex items-center justify-center overflow-hidden p-6">
      <div className="relative" style={{ paddingLeft: 36, paddingTop: 24 }}>
        {/* Column labels */}
        <div className="absolute top-0 left-0 right-0 flex" style={{ paddingLeft: 36 }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              style={{ width: cellSize }}
              className="text-center font-mono text-[10px] text-zinc-500"
            >
              {colLabels[j] ?? j}
            </div>
          ))}
        </div>
        {/* Row labels + grid */}
        <div className="flex">
          <div className="flex flex-col" style={{ width: 36 }}>
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                style={{ height: cellSize }}
                className="grid place-items-center font-mono text-[10px] text-zinc-500"
              >
                {rowLabels[i] ?? i}
              </div>
            ))}
          </div>
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
                  initial={cell?.isCurrent ? { scale: 1.15 } : false}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className={`grid place-items-center font-mono text-xs font-semibold ${
                    palette ? `${palette.bg} ${palette.border}` : "bg-zinc-900 text-zinc-300"
                  }`}
                  style={{ width: cellSize, height: cellSize }}
                >
                  {cell ? String(cell.value) : ""}
                </motion.div>
              );
            })}
          </div>
        </div>
        {current && (
          <DependencyArrows current={current} cellSize={cellSize} />
        )}
      </div>
    </div>
  );
}

function DependencyArrows({ current, cellSize }: { current: DPCell; cellSize: number }) {
  // Arrows pointing from `current` back to its dependency cells (cells flagged
  // isDependency). Rendered as an overlay SVG.
  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: 36 + current.col * cellSize + cellSize / 2 - 80,
        top: 24 + current.row * cellSize + cellSize / 2 - 80,
        width: 160,
        height: 160,
      }}
    >
      <defs>
        <marker id="dp-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
        </marker>
      </defs>
      <line x1={80} y1={80} x2={80 - cellSize * 0.7} y2={80} stroke="#fbbf24" strokeWidth={1.5} markerEnd="url(#dp-arrow)" />
      <line x1={80} y1={80} x2={80} y2={80 - cellSize * 0.7} stroke="#fbbf24" strokeWidth={1.5} markerEnd="url(#dp-arrow)" />
    </svg>
  );
}