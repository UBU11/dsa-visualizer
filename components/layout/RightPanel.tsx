// components/layout/RightPanel.tsx
"use client";

import { motion } from "framer-motion";
import { usePlayer } from "@/lib/store";

export function RightPanel() {
  const def = usePlayer((s) => s.currentAlgorithm());
  const step = usePlayer((s) => s.currentStep());
  const idx = usePlayer((s) => s.currentStepIndex);
  const steps = usePlayer((s) => s.steps);

  const total = steps.length;
  const currentLine = step?.currentLine ?? 0;
  const variables = step?.variables ?? [];
  const title = step?.title ?? "";
  const desc = step?.description ?? "";

  return (
    <aside className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          Pseudocode
        </div>
        <div className="mt-1 text-sm font-semibold text-zinc-100 tracking-tight">
          {def.name}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 font-mono">
        <ol className="flex flex-col">
          {def.pseudocode.map((line) => {
            const active = line.line === currentLine;
            return (
              <li
                key={line.line}
                className={`grid grid-cols-[2.25rem_1fr] items-start gap-2 px-2 py-1 rounded-sm text-xs leading-relaxed ${
                  active ? "bg-zinc-800" : ""
                }`}
              >
                <span
                  className={`text-right text-[10px] tabular-nums ${
                    active ? "text-amber-400" : "text-zinc-500"
                  }`}
                >
                  {String(line.line).padStart(2, "0")}
                </span>
                <span
                  className={`whitespace-pre ${
                    active ? "text-zinc-100" : "text-zinc-400"
                  }`}
                >
                  {line.text}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="border-t border-zinc-800 px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          State Inspector
        </div>
        <div className="mb-3">
          <div className="text-xs font-medium text-zinc-100">{title}</div>
          {desc && (
            <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
              {desc}
            </div>
          )}
        </div>
        <motion.div
          key={`vars-${idx}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className="flex flex-col gap-1"
        >
          {variables.length === 0 && (
            <div className="text-xs text-zinc-500">no variables</div>
          )}
          {variables.map((v, i) => (
            <div
              key={`${v.name}-${i}`}
              className={`grid grid-cols-[1fr_auto] items-baseline gap-2 px-2 py-1 rounded-sm ${
                v.highlight ? "bg-indigo-950/40 border border-indigo-900" : ""
              }`}
            >
              <span
                className={`text-xs font-mono ${
                  v.kind === "pointer" ? "text-indigo-300" : "text-zinc-300"
                }`}
              >
                {v.name}
              </span>
              <span
                className={`text-xs font-mono tabular-nums ${
                  v.highlight ? "text-indigo-100" : "text-zinc-100"
                }`}
              >
                {String(v.value)}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="border-t border-zinc-800 px-4 py-3 grid grid-cols-4 gap-1.5">
        <Counter label="step" value={`${idx + 1}/${total}`} />
        <Counter label="cmp" value={step?.comparisons ?? 0} />
        <Counter label="swp" value={step?.swaps ?? 0} />
        <Counter label="wrt" value={step?.writes ?? 0} />
      </div>
    </aside>
  );
}

function Counter({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-zinc-800 rounded-sm px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="font-mono text-xs text-zinc-100 tabular-nums">{value}</div>
    </div>
  );
}