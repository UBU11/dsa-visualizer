// lib/engine/types.ts
// Core data shapes that every algorithm must produce, plus the runtime
// abstractions the canvas / timeline / inspector panels render against.

export type CellValue = number | string | boolean;

export interface ArrayCell {
  // Stable identity for Framer Motion `layoutId`. Required so swaps animate
  // via FLIP instead of cross-fading.
  id: string;
  value: CellValue;
}

export interface TreeNodeSnapshot {
  id: string;
  value: CellValue;
  // x/y are 0..1 normalized positions so the renderer can scale per canvas.
  x: number;
  y: number;
  parentId: string | null;
}

export interface TreeEdgeSnapshot {
  id: string;
  fromId: string;
  toId: string;
}

export interface GraphNodeSnapshot {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdgeSnapshot {
  id: string;
  fromId: string;
  toId: string;
  directed: boolean;
}

export interface LinkedListNodeSnapshot {
  id: string;
  value: CellValue;
  // Layout position in canvas units. Renderer positions absolute from this.
  x: number;
  y: number;
  // id of the next node, or null for tail.
  nextId: string | null;
}

// ────────────────────────────────────────────────────────────────────────────
// Semantic color tokens. These map directly to the design-system swatches.
// `default` is implicit (rendered as zinc-800 if not listed here).
// ────────────────────────────────────────────────────────────────────────────
export type SemanticToken =
  | "compare" // amber-500 — pointer / read access
  | "mutate" // rose-600   — write / swap / overwrite
  | "sorted" // emerald-600 — locked-in, valid
  | "pointer" // indigo-600 — pivot / target / frontier
  | "visited"; // slate-500 — already inspected but not final

export type AnnotationKind =
  | "arrayIndex" // labeled index marker
  | "pointerLabel" // movable arrow w/ text
  | "treeEdgeLabel"
  | "graphEdgeLabel";

export interface Annotation {
  kind: AnnotationKind;
  key: string; // stable id so it animates with layout
  text: string;
  // placement in normalized 0..1 coords or grid coords depending on kind.
  targetId?: string;
  x?: number;
  y?: number;
  color?: SemanticToken;
}

// ────────────────────────────────────────────────────────────────────────────
// Stack / Queue / DP / Backtrack / String payloads
// ────────────────────────────────────────────────────────────────────────────

export interface StackFrame {
  id: string;
  value: CellValue;
  highlight?: SemanticToken;
}

export interface QueueFrame {
  id: string;
  value: CellValue;
  highlight?: SemanticToken;
}

export interface DPCell {
  row: number;
  col: number;
  value: number | string;
  highlight?: SemanticToken;
  isCurrent?: boolean;
  isDependency?: boolean;
}

export interface BacktrackCell {
  row: number;
  col: number;
  value: number | string;
  highlight?: SemanticToken;
}

export interface StringCharFrame {
  id: string;
  char: string;
  index: number;
  highlight?: SemanticToken;
}

export interface TrieNodeSnapshot {
  id: string;
  char: string;
  isWord: boolean;
  // Auto-laid-out positions.
  x: number;
  y: number;
  parentId: string | null;
  depth: number;
}

export interface TrieEdgeSnapshot {
  id: string;
  fromId: string;
  toId: string;
  char: string;
}

// ────────────────────────────────────────────────────────────────────────────
// HistoryStep: a single discrete frame the player can scrub to.
// All visual state must derive from a step. No "current" state lives outside.
// ────────────────────────────────────────────────────────────────────────────
export interface VariableFrame {
  name: string;
  value: CellValue | string;
  kind?: "number" | "string" | "pointer" | "state";
  highlight?: boolean;
}

export interface HistoryStep {
  // 0-based index. The 0th frame is the pre-execution initial state.
  index: number;
  title: string; // short human label e.g. "compare i=3, j=5"
  description?: string;
  currentLine: number; // which line of pseudocode is executing
  // Optional structured payload — only the renderer for the active structure
  // reads these. Engine is structure-agnostic.
  arrayCells?: ArrayCell[];
  arrayHighlights?: Record<string, SemanticToken>;
  treeNodes?: TreeNodeSnapshot[];
  treeEdges?: TreeEdgeSnapshot[];
  treeHighlights?: Record<string, SemanticToken>;
  graphNodes?: GraphNodeSnapshot[];
  graphEdges?: GraphEdgeSnapshot[];
  graphHighlights?: Record<string, SemanticToken>;
  listNodes?: LinkedListNodeSnapshot[];
  listHighlights?: Record<string, SemanticToken>;
  stackFrames?: StackFrame[];
  stackHighlights?: Record<string, SemanticToken>;
  queueFrames?: QueueFrame[];
  queueHighlights?: Record<string, SemanticToken>;
  dpRows?: number;
  dpCols?: number;
  dpCells?: DPCell[];
  dpRowLabels?: string[];
  dpColLabels?: string[];
  gridRows?: number;
  gridCols?: number;
  gridCells?: BacktrackCell[];
  gridRowLabels?: string[];
  gridColLabels?: string[];
  stringText?: StringCharFrame[];
  stringPattern?: StringCharFrame[];
  stringPatternIndex?: number;
  stringTextIndex?: number;
  trieNodes?: TrieNodeSnapshot[];
  trieEdges?: TrieEdgeSnapshot[];
  trieHighlights?: Record<string, SemanticToken>;
  variables: VariableFrame[];
  annotations?: Annotation[];
  // Total operation counters for the meta panel.
  comparisons: number;
  swaps: number;
  writes: number;
}

// ────────────────────────────────────────────────────────────────────────────
// AlgorithmDefinition: what the registry stores, what the UI lists.
// ────────────────────────────────────────────────────────────────────────────
export type StructureKind =
  | "array"
  | "tree"
  | "trie"
  | "graph"
  | "list"
  | "stack"
  | "queue"
  | "dp"
  | "backtrack"
  | "string";

export interface PseudoLine {
  line: number;
  text: string;
}

export interface AlgorithmConfigField {
  key: string;
  label: string;
  kind: "number" | "select" | "toggle" | "text";
  min?: number;
  max?: number;
  step?: number;
  default: number | string | boolean;
  options?: { value: string; label: string }[];
  help?: string;
}

export interface AlgorithmDefinition {
  id: string; // stable slug, used in URL state
  name: string;
  category:
    | "Sorting"
    | "Searching"
    | "Trees"
    | "Graphs"
    | "Lists"
    | "DP"
    | "Stacks & Queues"
    | "Backtracking"
    | "Strings";
  structure: StructureKind;
  summary: string;
  pseudocode: PseudoLine[];
  configFields: AlgorithmConfigField[];
  // The factory. Receives config + a step recorder. Pure: no DOM, no React.
  run: (config: Record<string, unknown>) => HistoryStep[];
}