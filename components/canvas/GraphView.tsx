// components/canvas/GraphView.tsx

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";

interface Props {
  step: HistoryStep;
}

export function GraphView({ step }: Props) {
  const nodes = step.graphNodes ?? [];
  const edges = step.graphEdges ?? [];
  const highlights = step.graphHighlights ?? {};
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ w, h }, setSize] = useState({ w: 800, h: 600 });

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
        className="relative h-full w-full overflow-hidden flex items-center justify-center text-zinc-500 text-xs"
      >
        no graph
      </div>
    );
  }

  const nodeR = Math.max(18, Math.min(30, Math.min(w, h) / 16));
  const pos = new Map(nodes.map((n) => [n.id, { x: n.x * w, y: n.y * h }]));

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <marker
            id="arrow"
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
        {edges.map((e) => {
          const a = pos.get(e.fromId);
          const b = pos.get(e.toId);
          if (!a || !b) return null;
          // Trim the line so the arrow lands on the node edge, not center.
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const x1 = a.x + ux * nodeR;
          const y1 = a.y + uy * nodeR;
          const x2 = b.x - ux * nodeR;
          const y2 = b.y - uy * nodeR;
          const edgeToken: SemanticToken | undefined = highlights[e.id];
          const targetToken: SemanticToken | undefined = highlights[e.toId];
          const sourceToken: SemanticToken | undefined = highlights[e.fromId];
          
          const token = edgeToken || (
            (sourceToken === "compare" || targetToken === "compare" || targetToken === "mutate" || targetToken === "pointer")
              ? (targetToken === "mutate" ? "mutate" : targetToken === "pointer" ? "pointer" : "compare")
              : undefined
          );
          
          const active = !!token;
          const stroke = active
            ? token === "mutate"
              ? "#fb7185"
              : token === "pointer"
                ? "#818cf8"
                : token === "sorted"
                  ? "#10b981"
                  : token === "visited"
                    ? "#64748b"
                    : "#fbbf24"
            : "#3f3f46";

          // Calculate midpoint for the edge label
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const labelStr = e.weight !== undefined ? String(e.weight) : "";
          const rectW = Math.max(20, labelStr.length * 6 + 8);

          return (
            <g key={e.id}>
              <motion.line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth={active ? 2 : 1.2}
                markerEnd={e.directed ? "url(#arrow)" : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              />
              {e.weight !== undefined && (
                <g transform={`translate(${mx}, ${my})`}>
                  <rect
                    x={-rectW / 2}
                    y={-8}
                    width={rectW}
                    height={16}
                    rx={4}
                    fill="#18181b"
                    stroke="#27272a"
                    strokeWidth={1}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#a1a1aa"
                    className="font-mono text-[9px] font-semibold select-none"
                  >
                    {labelStr}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {nodes.map((n) => {
        const p = pos.get(n.id)!;
        const token = highlights[n.id];
        const palette = token ? tokenColors[token] : null;
        return (
          <motion.div
            key={n.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: p.x - nodeR, y: p.y - nodeR }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`absolute grid place-items-center rounded-full border ${
              palette ? `${palette.bg} ${palette.border} ${palette.text}` : defaultCellClass
            } font-mono text-sm font-semibold`}
            style={{ width: nodeR * 2, height: nodeR * 2 }}
          >
            {n.label}
            {n.subLabel !== undefined && (
              <div className="absolute top-[105%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-mono px-1.5 py-0.5 rounded shadow-lg select-none pointer-events-none z-10">
                {n.subLabel}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}