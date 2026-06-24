// components/canvas/TreeView.tsx

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";

interface Props {
  step: HistoryStep;
}

export function TreeView({ step }: Props) {
  const nodes = step.treeNodes ?? [];
  const edges = step.treeEdges ?? [];
  const highlights = step.treeHighlights ?? {};
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ w, h }, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Seed dimensions synchronously on mount — ResizeObserver alone won't
    // fire if the element mounts at its final size and never resizes, so
    // we'd be stuck on the useState defaults (800x600) forever.
    setSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
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
        tree is empty
      </div>
    );
  }

  const nodeR = Math.max(14, Math.min(28, Math.min(w, h) / 18));
  // Defense-in-depth clamp: even if an algorithm accidentally emits n.y > 1
  // (e.g. due to stale ResizeObserver dimensions), clamp it back into [0,1]
  // before mapping to pixels so nodes never spill outside the canvas.
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const positions = new Map(
    nodes.map((n) => {
      // Reserve vertical space for the node radius + a small margin so the
      // deepest row stays inside the canvas.
      const usableH = Math.max(0, h - 2 * nodeR - 12);
      const yPx = clamp01(n.y) * usableH + nodeR + 6;
      // Reserve horizontal space too.
      const usableW = Math.max(0, w - 2 * nodeR - 8);
      const xPx = clamp01(n.x) * usableW + nodeR + 4;
      return [n.id, { x: xPx, y: yPx }];
    }),
  );
  const pos = (id: string) => positions.get(id) ?? { x: 0, y: 0 };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
    >
      <svg className="absolute inset-0 h-full w-full">
        {edges.map((e) => {
          const a = pos(e.fromId);
          const b = pos(e.toId);
          // Edge token: from child's highlight (mutation point) or default.
          const childToken = highlights[e.toId];
          const stroke = childToken === "mutate"
            ? "#fb7185"
            : childToken === "sorted"
              ? "#34d399"
              : childToken === "pointer"
                ? "#818cf8"
                : "#3f3f46";
          return (
            <motion.line
              key={e.id}
              x1={a.x}
              y1={a.y + nodeR}
              x2={b.x}
              y2={b.y - nodeR}
              stroke={stroke}
              strokeWidth={1.5}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            />
          );
        })}
      </svg>
      {nodes.map((n) => {
        const p = pos(n.id);
        const token = highlights[n.id];
        const palette = token ? tokenColors[token] : null;
        return (
          <motion.div
            key={n.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: p.x - nodeR, y: p.y - nodeR }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`absolute grid place-items-center rounded-full border ${
              palette
                ? `${palette.bg} ${palette.border}`
                : defaultCellClass
            } font-mono text-sm font-semibold`}
            style={{ width: nodeR * 2, height: nodeR * 2 }}
          >
            {n.value}
          </motion.div>
        );
      })}
    </div>
  );
}