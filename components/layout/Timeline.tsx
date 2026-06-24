// components/layout/Timeline.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/store";

const SPEED_MIN = 0.5;
const SPEED_MAX = 30;

export function Timeline() {
  const isPlaying = usePlayer((s) => s.isPlaying);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const stepBack = usePlayer((s) => s.stepBack);
  const stepForward = usePlayer((s) => s.stepForward);
  const setStep = usePlayer((s) => s.setStep);
  const idx = usePlayer((s) => s.currentStepIndex);
  const steps = usePlayer((s) => s.steps);
  const speed = usePlayer((s) => s.speed);
  const setSpeed = usePlayer((s) => s.setSpeed);
  const reseed = usePlayer((s) => s.reseed);

  const total = steps.length;
  const pct = total > 1 ? (idx / (total - 1)) * 100 : 0;

  // Track the speed slider DOM so external live changes (e.g. programmatic)
  // still reflect in the visible thumb while the user is dragging.
  const speedSliderRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (speedSliderRef.current && document.activeElement !== speedSliderRef.current) {
      speedSliderRef.current.value = String(speed);
    }
  }, [speed]);

  return (
    <footer className="h-16 shrink-0 border-t border-zinc-800 bg-zinc-900 grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3">
      <div className="flex items-center gap-1">
        <IconButton title="Reseed" onClick={reseed}>
          ↻
        </IconButton>
        <IconButton title="Step back" onClick={stepBack} disabled={idx === 0}>
          ◀
        </IconButton>
        <IconButton
          title={isPlaying ? "Pause" : "Play"}
          onClick={togglePlay}
          primary
        >
          {isPlaying ? "❚❚" : "▶"}
        </IconButton>
        <IconButton
          title="Step forward"
          onClick={stepForward}
          disabled={idx >= total - 1}
        >
          ▶
        </IconButton>
      </div>

      <div className="relative h-6 flex items-center">
        <input
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={idx}
          onChange={(e) => setStep(parseInt(e.target.value, 10))}
          className="w-full accent-amber-500 cursor-pointer"
        />
        <div className="absolute -bottom-3 left-0 right-0 flex justify-between text-[10px] text-zinc-500 font-mono tabular-nums px-1">
          <span>{String(idx + 1).padStart(3, "0")}</span>
          <span className="text-zinc-400">{pct.toFixed(0)}%</span>
          <span>{String(total).padStart(3, "0")}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          Speed
        </span>
        <input
          ref={speedSliderRef}
          type="range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={0.5}
          defaultValue={speed}
          // `defaultValue` makes this an uncontrolled input — the thumb
          // responds instantly to the user's drag without waiting for React
          // to round-trip state. We sync via `useEffect` above.
          onInput={(e) => setSpeed(parseFloat((e.target as HTMLInputElement).value))}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-32 accent-indigo-500 cursor-pointer"
          title={`${speed}× — drag to change speed during playback`}
        />
        <span className="font-mono text-xs text-zinc-100 tabular-nums w-12 text-right">
          {speed.toFixed(speed < 1 ? 1 : 0)}×
        </span>
      </div>
    </footer>
  );
}

function IconButton({
  children,
  onClick,
  title,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`grid place-items-center h-8 min-w-8 px-2 rounded-sm border text-xs font-mono transition-opacity ${
        primary
          ? "bg-amber-500 border-amber-300 text-zinc-900 hover:bg-amber-400 disabled:opacity-40"
          : "bg-zinc-950 border-zinc-800 text-zinc-100 hover:bg-zinc-800 disabled:opacity-40"
      }`}
    >
      {children}
    </button>
  );
}