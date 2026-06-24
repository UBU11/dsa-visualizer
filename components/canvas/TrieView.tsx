// components/canvas/TrieView.tsx

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";

interface Props {
  step: HistoryStep;
}

export function TrieView({ step }: Props) {
  const nodes = step.trieNodes ?? [];
  const edges = step.trieEdges ?? [];
  const highlights = step.trieHighlights ?? {};
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ w, h }, setSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      // Seed dimensions on mount — ResizeObserver alone won't fire if the
      // element mounts at its final size and never resizes.
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
        className="relative h-full w-full overflow-hidden grid place-items-center text-zinc-500 text-xs"
      >
        empty trie
      </div>
    );
  }

  const nodeR = Math.max(14, Math.min(22, Math.min(w, h) / 20));
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const positions = new Map(
    nodes.map((n) => {
      const usableH = h - 2 * nodeR - 12;
      const yPx = clamp01(n.y) * Math.max(0, usableH) + nodeR + 6;
      const usableW = w - 2 * nodeR - 8;
      const xPx = clamp01(n.x) * Math.max(0, usableW) + nodeR + 4;
      return [n.id, { x: xPx, y: yPx }];
    }),
  );

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <svg className="absolute inset-0 h-full w-full pointer-events-none">
        {edges.map((e) => {
          const a = positions.get(e.fromId);
          const b = positions.get(e.toId);
          if (!a || !b) return null;
          return (
            <g key={e.id}>
              <motion.line
                x1={a.x}
                y1={a.y + nodeR}
                x2={b.x}
                y2={b.y - nodeR}
                stroke="#52525b"
                strokeWidth={1.2}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              />
              <text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2}
                fill="#a1a1aa"
                fontSize={10}
                fontFamily="monospace"
                textAnchor="middle"
              >
                {e.char}
              </text>
            </g>
          );
        })}
      </svg>
      {nodes.map((n) => {
        const p = positions.get(n.id)!;
        const token = highlights[n.id];
        const palette = token ? tokenColors[token] : null;
        return (
          <motion.div
            key={n.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: p.x - nodeR, y: p.y - nodeR }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className={`absolute grid place-items-center rounded-full border ${
              palette ? `${palette.bg} ${palette.border}` : defaultCellClass
            } font-mono text-xs font-semibold`}
            style={{ width: nodeR * 2, height: nodeR * 2 }}
          >
            {n.char === "·" ? (n.isWord ? "✓" : "") : n.char}
          </motion.div>
        );
      })}
    </div>
  );
}