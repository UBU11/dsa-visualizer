// app/page.tsx
"use client";

import dynamic from "next/dynamic";

// The whole app uses browser-only state (Zustand + framer-motion + ResizeObserver),
// so render the client shell only.
const App = dynamic(() => import("@/components/App").then((m) => m.App), {
  ssr: false,
});

export default function Home() {
  return <App />;
}