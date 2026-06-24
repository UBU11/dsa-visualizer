// lib/engine/runner.ts
// Helpers for recording algorithm steps in a uniform way. An algorithm
// doesn't have to use these — it can push HistoryStep objects directly —
// but they remove boilerplate from common cases.

import type {
  ArrayCell,
  BacktrackCell,
  DPCell,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
  HistoryStep,
  LinkedListNodeSnapshot,
  QueueFrame,
  SemanticToken,
  StackFrame,
  StringCharFrame,
  TreeEdgeSnapshot,
  TreeNodeSnapshot,
  TrieEdgeSnapshot,
  TrieNodeSnapshot,
  VariableFrame,
} from "./types";

export interface RecorderState {
  steps: HistoryStep[];
  comparisons: number;
  swaps: number;
  writes: number;
}

export function createRecorder(initial: HistoryStep): RecorderState {
  return {
    steps: [initial],
    comparisons: 0,
    swaps: 0,
    writes: 0,
  };
}

export interface PushOptions {
  title: string;
  description?: string;
  currentLine: number;
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
  variables?: VariableFrame[];
  // Counters for this frame (defaults: leave unchanged).
  comparisons?: number;
  swaps?: number;
  writes?: number;
}

// Push a new frame onto the recorder. `state` is mutated in-place for speed.
export function pushStep(state: RecorderState, opts: PushOptions): void {
  const prev = state.steps[state.steps.length - 1];
  const comparisons = opts.comparisons ?? state.comparisons;
  const swaps = opts.swaps ?? state.swaps;
  const writes = opts.writes ?? state.writes;
  state.comparisons = comparisons;
  state.swaps = swaps;
  state.writes = writes;

  const step: HistoryStep = {
    index: state.steps.length,
    title: opts.title,
    description: opts.description,
    currentLine: opts.currentLine,
    arrayCells: opts.arrayCells ?? prev.arrayCells,
    arrayHighlights:
      opts.arrayHighlights ?? prev.arrayHighlights ?? {},
    treeNodes: opts.treeNodes ?? prev.treeNodes,
    treeEdges: opts.treeEdges ?? prev.treeEdges,
    treeHighlights: opts.treeHighlights ?? prev.treeHighlights ?? {},
    graphNodes: opts.graphNodes ?? prev.graphNodes,
    graphEdges: opts.graphEdges ?? prev.graphEdges,
    graphHighlights: opts.graphHighlights ?? prev.graphHighlights ?? {},
    listNodes: opts.listNodes ?? prev.listNodes,
    listHighlights: opts.listHighlights ?? prev.listHighlights ?? {},
    stackFrames: opts.stackFrames ?? prev.stackFrames,
    stackHighlights: opts.stackHighlights ?? prev.stackHighlights ?? {},
    queueFrames: opts.queueFrames ?? prev.queueFrames,
    queueHighlights: opts.queueHighlights ?? prev.queueHighlights ?? {},
    dpRows: opts.dpRows ?? prev.dpRows,
    dpCols: opts.dpCols ?? prev.dpCols,
    dpCells: opts.dpCells ?? prev.dpCells,
    dpRowLabels: opts.dpRowLabels ?? prev.dpRowLabels,
    dpColLabels: opts.dpColLabels ?? prev.dpColLabels,
    gridRows: opts.gridRows ?? prev.gridRows,
    gridCols: opts.gridCols ?? prev.gridCols,
    gridCells: opts.gridCells ?? prev.gridCells,
    gridRowLabels: opts.gridRowLabels ?? prev.gridRowLabels,
    gridColLabels: opts.gridColLabels ?? prev.gridColLabels,
    stringText: opts.stringText ?? prev.stringText,
    stringPattern: opts.stringPattern ?? prev.stringPattern,
    stringPatternIndex: opts.stringPatternIndex ?? prev.stringPatternIndex,
    stringTextIndex: opts.stringTextIndex ?? prev.stringTextIndex,
    trieNodes: opts.trieNodes ?? prev.trieNodes,
    trieEdges: opts.trieEdges ?? prev.trieEdges,
    trieHighlights: opts.trieHighlights ?? prev.trieHighlights ?? {},
    variables: opts.variables ?? prev.variables ?? [],
    comparisons,
    swaps,
    writes,
  };
  state.steps.push(step);
}

// Build a stable ID for an array cell from (slotIndex, value). value is
// included so repeated equal values still get unique keys for layout animation
// across the same execution lifetime.
export function cellId(slot: number, value: number | string): string {
  return `c-${slot}-${value}`;
}