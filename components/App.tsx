// components/App.tsx
"use client";

import { TopBar } from "@/components/layout/TopBar";
import { LeftPanel } from "@/components/layout/LeftPanel";
import { Shell } from "@/components/layout/Shell";
import { RightPanel } from "@/components/layout/RightPanel";
import { Timeline } from "@/components/layout/Timeline";

export function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <LeftPanel />
        <Shell />
        <RightPanel />
      </div>
      <Timeline />
    </div>
  );
}