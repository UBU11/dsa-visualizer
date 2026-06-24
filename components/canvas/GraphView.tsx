// components/canvas/GraphView.tsx

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { HistoryStep, SemanticToken } from "@/lib/engine/types";
import { defaultCellClass, tokenColors } from "./semanticColors";
import { usePlayer } from "@/lib/store";

interface Props {
  step: HistoryStep;
}

export function GraphView({ step }: Props) {
  const nodes = step.graphNodes ?? [];
  const edges = step.graphEdges ?? [];
  const highlights = step.graphHighlights ?? {};
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ w, h }, setSize] = useState({ w: 800, h: 600 });

  const algoId = usePlayer((s) => s.algorithmId);
  const isCoordinatePlot =
    algoId === "linear-regression" || algoId === "logistic-regression" || algoId === "knn";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
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

  // Setup Coordinate Ticks based on the algorithm scale
  let xTicks: { val: number; label: string }[] = [];
  let yTicks: { val: number; label: string }[] = [];

  if (algoId === "linear-regression") {
    xTicks = Array.from({ length: 5 }).map((_, i) => ({ val: i + 1, label: String(i + 1) }));
    yTicks = Array.from({ length: 8 }).map((_, i) => ({ val: i + 1, label: String(i + 1) }));
  } else if (algoId === "logistic-regression") {
    xTicks = [-3, -2, -1, 0, 1, 2, 3].map((val) => ({ val, label: String(val) }));
    yTicks = [0, 1].map((val) => ({ val, label: val === 1 ? "Class 1" : "Class 0" }));
  } else if (algoId === "knn") {
    xTicks = [0.2, 0.4, 0.6, 0.8, 1.0].map((val) => ({ val, label: val.toFixed(1) }));
    yTicks = [0.2, 0.4, 0.6, 0.8, 1.0].map((val) => ({ val, label: val.toFixed(1) }));
  }

  // Coordinate helper scales to place ticks on screen:
  const getTickScreenX = (val: number) => {
    if (algoId === "linear-regression") return w * (0.1 + 0.8 * (val / 5));
    if (algoId === "logistic-regression") return w * (0.1 + 0.8 * ((val + 3) / 6));
    // knn
    return w * (0.1 + 0.8 * val);
  };

  const getTickScreenY = (val: number) => {
    if (algoId === "linear-regression") return h * (0.9 - 0.8 * (val / 8));
    if (algoId === "logistic-regression") return h * (val === 1 ? 0.3 : 0.7);
    // knn
    return h * (0.9 - 0.8 * val);
  };

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

        {/* 1. Draw Mathematical Axes & Ticks if it is a coordinate plot */}
        {isCoordinatePlot && (
          <g>
            {/* Y Axis line */}
            <line
              x1={w * 0.1}
              y1={h * 0.94}
              x2={w * 0.1}
              y2={h * 0.05}
              stroke="#4b5563"
              strokeWidth={1.5}
              markerEnd="url(#arrow)"
            />
            <text
              x={w * 0.08}
              y={h * 0.06}
              fill="#9ca3af"
              className="font-sans text-[10px] font-bold select-none"
            >
              Y
            </text>

            {/* X Axis line */}
            <line
              x1={w * 0.06}
              y1={h * 0.9}
              x2={w * 0.95}
              y2={h * 0.9}
              stroke="#4b5563"
              strokeWidth={1.5}
              markerEnd="url(#arrow)"
            />
            <text
              x={w * 0.96}
              y={h * 0.92}
              fill="#9ca3af"
              className="font-sans text-[10px] font-bold select-none"
            >
              X
            </text>

            {/* Draw Ticks on X-Axis */}
            {xTicks.map((tick, idx) => {
              const screenX = getTickScreenX(tick.val);
              const screenY = h * 0.9;
              return (
                <g key={`xtick-${idx}`}>
                  <line
                    x1={screenX}
                    y1={screenY}
                    x2={screenX}
                    y2={screenY + 4}
                    stroke="#4b5563"
                    strokeWidth={1.2}
                  />
                  <text
                    x={screenX}
                    y={screenY + 14}
                    textAnchor="middle"
                    fill="#71717a"
                    className="font-mono text-[9px] select-none"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}

            {/* Draw Ticks on Y-Axis */}
            {yTicks.map((tick, idx) => {
              const screenX = w * 0.1;
              const screenY = getTickScreenY(tick.val);
              return (
                <g key={`ytick-${idx}`}>
                  <line
                    x1={screenX - 4}
                    y1={screenY}
                    x2={screenX}
                    y2={screenY}
                    stroke="#4b5563"
                    strokeWidth={1.2}
                  />
                  <text
                    x={screenX - 8}
                    y={screenY}
                    textAnchor="end"
                    dominantBaseline="central"
                    fill="#71717a"
                    className="font-mono text-[9px] select-none"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* 2. Draw Edges */}
        {edges.map((e) => {
          const a = pos.get(e.fromId);
          const b = pos.get(e.toId);
          if (!a || !b) return null;

          const edgeToken: SemanticToken | undefined = highlights[e.id];
          const targetToken: SemanticToken | undefined = highlights[e.toId];
          const sourceToken: SemanticToken | undefined = highlights[e.fromId];

          const token =
            edgeToken ||
            ((sourceToken === "compare" ||
              targetToken === "compare" ||
              targetToken === "mutate" ||
              targetToken === "pointer")
              ? targetToken === "mutate"
                ? "mutate"
                : targetToken === "pointer"
                  ? "pointer"
                  : "compare"
              : undefined);

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

          // If fromId === toId, render as a self-loop (e.g. for RNN recurrent loop)
          if (e.fromId === e.toId) {
            const rx = nodeR * 1.5;
            const ry = nodeR * 1.5;
            // Arc loop path going from top-left of node to top-right of node
            const x1 = a.x - nodeR * 0.5;
            const y1 = a.y - nodeR * 0.86;
            const x2 = a.x + nodeR * 0.5;
            const y2 = a.y - nodeR * 0.86;
            const pathD = `M ${x1} ${y1} C ${a.x - rx} ${a.y - nodeR - ry}, ${a.x + rx} ${
              a.y - nodeR - ry
            }, ${x2} ${y2}`;

            const labelStr = e.weight !== undefined ? String(e.weight) : "";
            const rectW = Math.max(20, labelStr.length * 6 + 8);
            const labelY = a.y - nodeR - ry * 0.6;

            return (
              <g key={e.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={active ? 2 : 1.2}
                  markerEnd="url(#arrow)"
                />
                {e.weight !== undefined && (
                  <g transform={`translate(${a.x}, ${labelY})`}>
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
          }

          // Otherwise, render regular straight line edge
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const x1 = a.x + ux * nodeR;
          const y1 = a.y + uy * nodeR;
          const x2 = b.x - ux * nodeR;
          const y2 = b.y - uy * nodeR;

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

      {/* 3. Draw Nodes */}
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