// components/canvas/LinkedListView.tsx

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";

interface Props {
  step: HistoryStep;
}

export function LinkedListView({ step }: Props) {
  const nodes = step.listNodes ?? [];
  const highlights = step.listHighlights ?? {};
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Seed on mount — ResizeObserver alone won't fire if mounted at final size.
    setDims({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden flex items-center justify-center text-zinc-500 text-xs"
      >
        empty list
      </div>
    );
  }

  const boxW = 72;
  const boxH = 56;
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const positions = new Map(
    nodes.map((n) => {
      // Reserve space for the node box + a margin so nodes never spill
      // outside the canvas even if an algorithm overshoots.
      const usableW = Math.max(0, dims.w - boxW - 8);
      const usableH = Math.max(0, dims.h - boxH - 8);
      const x = clamp01(n.x) * usableW;
      const y = clamp01(n.y) * usableH;
      return [n.id, { x, y }];
    }),
  );

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <svg className="absolute inset-0 h-full w-full pointer-events-none">
        {nodes.map((n) => {
          if (!n.nextId) return null;
          const a = positions.get(n.id)!;
          const b = positions.get(n.nextId)!;
          const x1 = a.x + boxW;
          const y1 = a.y + boxH / 2;
          const x2 = b.x;
          const y2 = b.y + boxH / 2;
          const cx = (x1 + x2) / 2;
          const token = highlights[n.nextId];
          const stroke =
            token === "mutate"
              ? "#fb7185"
              : token === "sorted"
                ? "#34d399"
                : token === "compare"
                  ? "#fbbf24"
                  : "#52525b";
          return (
            <motion.path
              key={`${n.id}->${n.nextId}`}
              d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
              stroke={stroke}
              strokeWidth={1.6}
              fill="none"
              markerEnd="url(#ll-arrow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            />
          );
        })}
        <defs>
          <marker
            id="ll-arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#52525b" />
          </marker>
        </defs>
      </svg>
      {nodes.map((n) => {
        const p = positions.get(n.id)!;
        const token = highlights[n.id];
        const palette = token ? tokenColors[token] : null;
        return (
          <motion.div
            key={n.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: p.x, y: p.y }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`absolute grid place-items-center rounded-md border ${
              palette ? `${palette.bg} ${palette.border}` : defaultCellClass
            } font-mono text-sm font-semibold`}
            style={{ width: boxW, height: boxH }}
          >
            {n.value}
          </motion.div>
        );
      })}
    </div>
  );
}