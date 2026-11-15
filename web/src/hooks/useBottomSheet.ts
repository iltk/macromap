import { useCallback, useEffect, useRef, useState } from "react";

type Snap = "peek" | "half" | "full";
const ORDER: Snap[] = ["peek", "half", "full"];
const PEEK_PX = 124;

/**
 * Bottom sheet with three snap heights. Dragging the handle snaps to the nearest one on
 * release; tapping it steps to the next.
 */
export function useBottomSheet(initial: Snap = "peek") {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [containerH, setContainerH] = useState(700);
  const [snap, setSnap] = useState<Snap>(initial);

  useEffect(() => {
    if (!containerEl) return;
    const ro = new ResizeObserver(([e]) => setContainerH(e.contentRect.height));
    ro.observe(containerEl);
    return () => ro.disconnect();
  }, [containerEl]);
  const [dragPx, setDragPx] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startH: number; moved: boolean } | null>(null);

  const heightFor = useCallback(
    (s: Snap) => (s === "peek" ? PEEK_PX : s === "half" ? Math.round(containerH * 0.52) : containerH - 12),
    [containerH],
  );
  const reveal = useCallback(() => setSnap((s) => (s === "peek" ? "half" : s)), []);

  const handleProps = {
    onPointerDown: (e: React.PointerEvent) => {
      drag.current = { startY: e.clientY, startH: heightFor(snap), moved: false };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dy = d.startY - e.clientY;
      if (Math.abs(dy) > 4) d.moved = true;
      if (d.moved) setDragPx(Math.max(PEEK_PX - 20, Math.min(heightFor("full"), d.startH + dy)));
    },
    onPointerUp: () => {
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      if (!d.moved) {
        setSnap((s) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length]);
      } else if (dragPx !== null) {
        const nearest = ORDER.reduce((best, s) => (Math.abs(heightFor(s) - dragPx) < Math.abs(heightFor(best) - dragPx) ? s : best), "peek" as Snap);
        setSnap(nearest);
      }
      setDragPx(null);
    },
    onPointerCancel: () => {
      drag.current = null;
      setDragPx(null);
    },
  };

  return {
    containerRef: setContainerEl,
    snap,
    setSnap,
    height: dragPx ?? heightFor(snap),
    dragging: dragPx !== null,
    handleProps,
    // peek -> half when something opens; leaves half/full alone
    reveal,
  };
}
