"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const WORDS = ["create.", "explore.", "expand.", "conquer."];

interface WordState {
  x: number;
  y: number;
}

function DraggableWord({
  word,
  containerRef,
  initialX,
  initialY,
}: {
  word: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialX: number;
  initialY: number;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState<WordState>({ x: initialX, y: initialY });

  const clamp = useCallback(
    (x: number, y: number) => {
      const el = ref.current;
      const container = containerRef.current;
      if (!el || !container) return { x, y };

      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();

      return {
        x: Math.max(0, Math.min(cRect.width - eRect.width, x)),
        y: Math.max(0, Math.min(cRect.height - eRect.height, y)),
      };
    },
    [containerRef]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      ref.current?.setPointerCapture(e.pointerId);
      offset.current = {
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      };
    },
    [pos]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      setPos(
        clamp(e.clientX - offset.current.x, e.clientY - offset.current.y)
      );
    },
    [clamp]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    const handleResize = () => setPos((p) => clamp(p.x, p.y));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clamp]);

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        touchAction: "none",
      }}
      className="absolute cursor-grab active:cursor-grabbing select-none font-[family-name:var(--font-jetbrains-mono)] text-[#484545] text-3xl sm:text-5xl lg:text-[64px] leading-none whitespace-nowrap"
    >
      {word}
    </div>
  );
}

export function DraggableTagline(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [offsets, setOffsets] = useState<{ x: number; y: number }[] | null>(
    null
  );

  // Measure initial stacked positions from a hidden reference layout
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const children = measure.children;
    const results: { x: number; y: number }[] = [];
    const cRect = container.getBoundingClientRect();

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const r = child.getBoundingClientRect();
      results.push({
        x: r.left - cRect.left,
        y: r.top - cRect.top,
      });
    }

    setOffsets(results);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Hidden measure element to calculate initial stacked positions */}
      <div
        ref={measureRef}
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 font-[family-name:var(--font-jetbrains-mono)] text-[#484545] text-3xl sm:text-5xl lg:text-[64px] leading-none space-y-1 ml-[14px] sm:ml-[22px] lg:ml-[38px]"
        style={{ visibility: "hidden", pointerEvents: "none" }}
      >
        {WORDS.map((w) => (
          <p key={w}>{w}</p>
        ))}
      </div>

      {/* Draggable words positioned at measured locations */}
      {offsets &&
        WORDS.map((word, i) => (
          <DraggableWord
            key={word}
            word={word}
            containerRef={containerRef}
            initialX={offsets[i].x}
            initialY={offsets[i].y}
          />
        ))}
    </div>
  );
}
