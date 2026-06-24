// components/canvas/semanticColors.ts
// Single source of truth for the design-system color tokens, mapped to the
// SemanticToken union. Reused by every canvas renderer.

import type { SemanticToken } from "@/lib/engine/types";

export const tokenColors: Record<
  SemanticToken,
  { bg: string; border: string; text: string }
> = {
  compare: { bg: "bg-amber-500", border: "border-amber-300", text: "text-amber-50" },
  mutate: { bg: "bg-rose-600", border: "border-rose-300", text: "text-white" },
  sorted: { bg: "bg-emerald-600", border: "border-emerald-300", text: "text-emerald-50" },
  pointer: { bg: "bg-indigo-600", border: "border-indigo-300", text: "text-indigo-50" },
  visited: { bg: "bg-slate-600", border: "border-slate-400", text: "text-slate-200" },
};

export const defaultCellClass = "bg-zinc-800 border-slate-200 text-zinc-100";