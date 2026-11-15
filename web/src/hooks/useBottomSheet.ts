import { useCallback, useEffect, useRef, useState } from "react";

export type Snap = "peek" | "half" | "full";
const ORDER: Snap[] = ["peek", "half", "full"];
const PEEK_PX = 124;

/**
 * A bottom sheet that snaps to three heights. Drag the handle (pointer events, works with
 * touch and mouse) and release to snap to the nearest height; a tap without dragging steps
 * to the next height. Heights are relative to `container`.
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
    /** Callback ref for the element the sheet sits in (its height sets the snap points). */
    containerRef: setContainerEl,
    snap,
    setSnap,
    /** Pixel height to apply (mobile only), and whether a drag is in progress (no transition then). */
    height: dragPx ?? heightFor(snap),
    dragging: dragPx !== null,
    handleProps,
    /** Raise from peek to half (e.g. when a place opens); leave half/full alone. */
    reveal,
  };
}
