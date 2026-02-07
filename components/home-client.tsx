"use client";

import dynamic from "next/dynamic";

// Dynamic imports for client-only components with browser APIs
const DraggableTagline = dynamic(
  () => import("@/components/draggable-tagline").then(mod => ({ default: mod.DraggableTagline })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center">
        <div className="font-[family-name:var(--font-jetbrains-mono)] text-[#484545] text-3xl sm:text-5xl lg:text-[64px] opacity-50">
          Loading...
        </div>
      </div>
    ),
  }
);

const SplineBackground = dynamic(
  () => import("@/components/spline-background").then(mod => ({ default: mod.SplineBackground })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 w-full h-full z-0 bg-gradient-to-br from-gray-100 to-gray-200" />
    ),
  }
);

export function HomeClient(): JSX.Element {
  return (
    <>
      <SplineBackground />
      <DraggableTagline />
    </>
  );
}
