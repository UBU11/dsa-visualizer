// lib/store.ts
// Single Zustand store: the player state. Every visible panel subscribes to
// the relevant slice, so scrubbing the timeline instantly updates the canvas,
// the pseudocode highlight, and the variable inspector in lockstep.
//
// Playback uses a self-scheduling setTimeout (NOT setInterval) so:
//   - pause is instant (no up-to-tick-interval latency)
//   - speed changes apply immediately on the very next frame
//   - the cleared-timer check is unambiguous

"use client";

import { create } from "zustand";
import { algorithms, defaultAlgorithmId, getAlgorithm } from "@/lib/engine/registry";
import type { AlgorithmDefinition, HistoryStep } from "@/lib/engine/types";

export interface PlayerState {
  algorithmId: string;
  config: Record<string, unknown>;
  steps: HistoryStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number; // steps per second
  _timer: ReturnType<typeof setTimeout> | null;

  // Selectors / derived values (computed on read).
  currentAlgorithm: () => AlgorithmDefinition;
  currentStep: () => HistoryStep | null;

  // Actions.
  selectAlgorithm: (id: string) => void;
  setConfig: (key: string, value: number | string | boolean) => void;
  reset: () => void;
  reseed: () => void;
  setStep: (i: number) => void;
  stepForward: () => void;
  stepBack: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (s: number) => void;
  togglePlay: () => void;
}

function buildConfig(def: AlgorithmDefinition): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of def.configFields) out[f.key] = f.default;
  return out;
}

function runAlgorithm(id: string, config: Record<string, unknown>): HistoryStep[] {
  const def = getAlgorithm(id);
  if (!def) return [];
  try {
    return def.run(config);
  } catch (err) {
    console.error(`[${id}] run failed`, err);
    return [
      {
        index: 0,
        title: "Execution error",
        description: String(err),
        currentLine: 0,
        variables: [],
        comparisons: 0,
        swaps: 0,
        writes: 0,
      },
    ];
  }
}

// Minimum tick = 50ms (≈20fps) and max tick = 4000ms (≈0.25fps) to support 0.5×.
const MIN_TICK_MS = 50;
const MAX_TICK_MS = 4000;
function tickFor(speed: number): number {
  // Map speed (steps/sec) → ms per step. 0.5× → 2s/step; 30× → 33ms/step.
  const ms = 1000 / Math.max(speed, 0.25);
  return Math.max(MIN_TICK_MS, Math.min(MAX_TICK_MS, ms));
}

const initialAlgo = defaultAlgorithmId();
const initialDef = getAlgorithm(initialAlgo)!;
const initialConfig = buildConfig(initialDef);
const initialSteps = runAlgorithm(initialAlgo, initialConfig);

export const usePlayer = create<PlayerState>((set, get) => {
  // Self-scheduling tick. Schedules the NEXT tick only AFTER advancing, so
  // pausing between ticks is instant (no race with setInterval's pending fire).
  const scheduleNext = () => {
    const t = get();
    if (!t.isPlaying) return;
    if (t._timer) clearTimeout(t._timer);
    const tick = tickFor(t.speed);
    if (typeof window !== "undefined") {
      // @ts-ignore — debug surface
      window.__lastTick = tick;
      // @ts-ignore
      window.__lastSpeed = t.speed;
    }
    const timer = setTimeout(() => {
      const s = get();
      if (!s.isPlaying) return;
      if (s.currentStepIndex >= s.steps.length - 1) {
        set({ isPlaying: false, _timer: null });
        return;
      }
      set({ currentStepIndex: s.currentStepIndex + 1 });
      scheduleNext();
    }, tick);
    set({ _timer: timer });
  };

  return {
    algorithmId: initialAlgo,
    config: initialConfig,
    steps: initialSteps,
    currentStepIndex: 0,
    isPlaying: false,
    speed: 4,
    _timer: null,

    currentAlgorithm() {
      return getAlgorithm(get().algorithmId) ?? algorithms[0];
    },

    currentStep() {
      const { steps, currentStepIndex } = get();
      return steps[currentStepIndex] ?? null;
    },

    selectAlgorithm(id: string) {
      const def = getAlgorithm(id);
      if (!def) return;
      const cfg = buildConfig(def);
      const steps = runAlgorithm(id, cfg);
      const t = get()._timer;
      if (t) clearTimeout(t);
      set({
        algorithmId: id,
        config: cfg,
        steps,
        currentStepIndex: 0,
        isPlaying: false,
        _timer: null,
      });
    },

    setConfig(key: string, value: number | string | boolean) {
      const { algorithmId, config } = get();
      const next = { ...config, [key]: value };
      const steps = runAlgorithm(algorithmId, next);
      const t = get()._timer;
      if (t) clearTimeout(t);
      set({ config: next, steps, currentStepIndex: 0, isPlaying: false, _timer: null });
    },

    reset() {
      const t = get()._timer;
      if (t) clearTimeout(t);
      set({ currentStepIndex: 0, isPlaying: false, _timer: null });
    },

    reseed() {
      const { algorithmId, config } = get();
      const next = { ...config };
      if ("seed" in next) next.seed = Number(next.seed || 0) + 1;
      const steps = runAlgorithm(algorithmId, next);
      const t = get()._timer;
      if (t) clearTimeout(t);
      set({
        config: next,
        steps,
        currentStepIndex: 0,
        isPlaying: false,
        _timer: null,
      });
    },

    setStep(i: number) {
      const { steps } = get();
      const clamped = Math.max(0, Math.min(steps.length - 1, i));
      set({ currentStepIndex: clamped });
    },

    stepForward() {
      const { currentStepIndex, steps } = get();
      if (currentStepIndex < steps.length - 1) {
        set({ currentStepIndex: currentStepIndex + 1 });
      } else {
        const t = get()._timer;
        if (t) clearTimeout(t);
        set({ isPlaying: false, _timer: null });
      }
    },

    stepBack() {
      const { currentStepIndex } = get();
      if (currentStepIndex > 0) set({ currentStepIndex: currentStepIndex - 1 });
    },

    play() {
      const { isPlaying, steps, currentStepIndex } = get();
      if (isPlaying) return;
      if (currentStepIndex >= steps.length - 1) {
        set({ currentStepIndex: 0 });
      }
      set({ isPlaying: true });
      scheduleNext();
    },

    pause() {
      const t = get()._timer;
      if (t) clearTimeout(t);
      // Setting isPlaying=false FIRST means the next scheduled tick (if it
      // somehow fires before clearTimeout returns) will noop via the
      // isPlaying guard at the top of the timer body.
      set({ isPlaying: false, _timer: null });
    },

    setSpeed(s: number) {
      // Allow 0.25× to 60×. The "0.5×" the user asked for falls naturally
      // between MIN_TICK_MS (50ms) and MAX_TICK_MS (4000ms).
      const speed = Math.max(0.25, Math.min(60, s));
      set({ speed });
      // If playing, restart the chain so the new tick rate takes effect
      // on the very next step.
      if (get().isPlaying) {
        const t = get()._timer;
        if (t) clearTimeout(t);
        scheduleNext();
      }
    },

    togglePlay() {
      if (get().isPlaying) get().pause();
      else get().play();
    },
  };
});