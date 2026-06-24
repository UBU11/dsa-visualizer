// components/layout/TopBar.tsx
"use client";

import { usePlayer } from "@/lib/store";
import { algorithmsByCategory } from "@/lib/engine/registry";

export function TopBar() {
  const algo = usePlayer((s) => s.currentAlgorithm());
  const algoId = usePlayer((s) => s.algorithmId);
  const select = usePlayer((s) => s.selectAlgorithm);
  const reseed = usePlayer((s) => s.reseed);
  const reset = usePlayer((s) => s.reset);
  const steps = usePlayer((s) => s.steps);
  const idx = usePlayer((s) => s.currentStepIndex);

  const groups = algorithmsByCategory();

  return (
    <header className="h-12 shrink-0 flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-3">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src="/favicon.svg"
          alt="DSA Visualizer"
          className="h-7 w-7 rounded-sm select-none"
        />
        <span className="text-sm font-semibold tracking-tight text-zinc-100">
          DSA Visualizer
        </span>
        <div className="mx-2 h-5 w-px bg-zinc-800" />
        <select
          value={algoId}
          onChange={(e) => select(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-medium tracking-tight rounded-sm px-2 py-1.5 focus:outline-none focus:border-zinc-600"
        >
          {Object.entries(groups).map(([cat, items]) => (
            <optgroup key={cat} label={cat}>
              {items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <span className="hidden lg:inline text-xs text-zinc-400 truncate">
          {algo.summary}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          Step
        </span>
        <span className="font-mono text-xs text-zinc-100 tabular-nums">
          {String(idx + 1).padStart(3, "0")} / {String(steps.length).padStart(3, "0")}
        </span>
        <div className="mx-2 h-5 w-px bg-zinc-800" />
        <button
          onClick={reseed}
          className="text-xs font-medium tracking-tight px-2.5 py-1.5 rounded-sm border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-100"
        >
          ↻ Reseed
        </button>
        <button
          onClick={reset}
          className="text-xs font-medium tracking-tight px-2.5 py-1.5 rounded-sm border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-100"
        >
          ⟲ Reset
        </button>
      </div>
    </header>
  );
}