// components/layout/LeftPanel.tsx
"use client";

import { usePlayer } from "@/lib/store";
import { algorithmsByCategory } from "@/lib/engine/registry";

export function LeftPanel() {
  const def = usePlayer((s) => s.currentAlgorithm());
  const config = usePlayer((s) => s.config);
  const setConfig = usePlayer((s) => s.setConfig);
  const select = usePlayer((s) => s.selectAlgorithm);
  const algoId = usePlayer((s) => s.algorithmId);
  const groups = algorithmsByCategory();

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden">
      {/* Algorithm library */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">
            Algorithm Library
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-100 tracking-tight">
            {Object.values(groups).reduce((s, l) => s + l.length, 0)} algorithms
          </div>
        </div>
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat} className="border-b border-zinc-800/50">
            <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
              {cat} <span className="text-zinc-600">· {items.length}</span>
            </div>
            <ul className="pb-1">
              {items.map((a) => {
                const active = a.id === algoId;
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => select(a.id)}
                      className={`w-full text-left px-4 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                        active
                          ? "bg-amber-500/10 text-amber-200 border-l-2 border-amber-500"
                          : "text-zinc-300 hover:bg-zinc-800/60 border-l-2 border-transparent"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-sm ${
                          a.structure === "array"
                            ? "bg-zinc-400"
                            : a.structure === "tree"
                              ? "bg-emerald-500"
                              : a.structure === "trie"
                                ? "bg-teal-500"
                                : a.structure === "graph"
                                  ? "bg-indigo-500"
                                  : a.structure === "list"
                                    ? "bg-amber-500"
                                    : a.structure === "stack"
                                      ? "bg-rose-500"
                                      : a.structure === "queue"
                                        ? "bg-rose-400"
                                        : a.structure === "dp"
                                          ? "bg-violet-500"
                                          : a.structure === "backtrack"
                                            ? "bg-orange-500"
                                            : "bg-cyan-500"
                        }`}
                      />
                      {a.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Configuration + legend for current algorithm */}
      <div className="border-t border-zinc-800 max-h-[40vh] overflow-y-auto">
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">
            Structure
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-100 tracking-tight">
            {def.name}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">
            {def.category} · {def.structure}
          </div>
        </div>

        {def.configFields.length > 0 && (
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              Configuration
            </div>
            <div className="flex flex-col gap-3">
              {def.configFields.map((field) => {
                const value = config[field.key];
                return (
                  <label key={field.key} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-zinc-300">
                      {field.label}
                    </span>
                    {field.kind === "number" && (
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step ?? 1}
                        value={typeof value === "number" ? value : Number(value) || 0}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          if (!Number.isNaN(n)) setConfig(field.key, n);
                        }}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs rounded-sm px-2 py-1.5 focus:outline-none focus:border-zinc-600"
                      />
                    )}
                    {field.kind === "text" && (
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => setConfig(field.key, e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs rounded-sm px-2 py-1.5 focus:outline-none focus:border-zinc-600"
                      />
                    )}
                    {field.kind === "select" && (
                      <select
                        value={String(value)}
                        onChange={(e) => setConfig(field.key, e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-sm px-2 py-1.5 focus:outline-none focus:border-zinc-600"
                      >
                        {(field.options ?? []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {field.kind === "toggle" && (
                      <button
                        onClick={() => setConfig(field.key, !value)}
                        className={`text-xs font-medium px-2 py-1.5 rounded-sm border ${
                          value
                            ? "bg-indigo-600 border-indigo-400 text-indigo-50"
                            : "bg-zinc-950 border-zinc-800 text-zinc-100"
                        }`}
                      >
                        {value ? "On" : "Off"}
                      </button>
                    )}
                    {field.help && (
                      <span className="text-[10px] text-zinc-500">{field.help}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            Legend
          </div>
          <div className="flex flex-col gap-1.5">
            <LegendSwatch label="compare" className="bg-amber-500 border-amber-300" />
            <LegendSwatch label="mutate" className="bg-rose-600 border-rose-300" />
            <LegendSwatch label="sorted / done" className="bg-emerald-600 border-emerald-300" />
            <LegendSwatch label="pointer" className="bg-indigo-600 border-indigo-300" />
            <LegendSwatch label="visited" className="bg-slate-600 border-slate-400" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function LegendSwatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-3 h-3 rounded-sm border ${className}`} />
      <span className="text-xs text-zinc-300 font-mono">{label}</span>
    </div>
  );
}