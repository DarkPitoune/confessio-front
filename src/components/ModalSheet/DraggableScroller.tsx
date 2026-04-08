"use client";
import {
  useRef,
  useCallback,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import type { MotionValue } from "motion/react";
import { useSheetDrag } from "./useSheetDrag";

/**
 * A scrollable container that:
 * - Blocks pointer events from reaching Motion's drag on Sheet.Content
 * - Lets native scroll work normally
 * - Hands off to sheet dragging when at scroll top and pulling down
 * - Uses velocity-aware snapping (flick to throw)
 */
export default function DraggableScroller({
  children,
  sheetY,
  snapPoints,
  sheetHeight,
}: {
  children: ReactNode;
  sheetY: MotionValue<number>;
  snapPoints: number[];
  sheetHeight: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const { isDragging, startDrag, updateDrag, endDrag } = useSheetDrag(
    sheetY,
    snapPoints,
    sheetHeight,
  );

  const onPointerDownCapture = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
    },
    [],
  );

  const onTouchStart = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchStartY.current = touch.clientY;
    },
    [],
  );

  const onTouchMove = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch || !scrollRef.current) return;

      // If already dragging the sheet, keep driving y
      if (isDragging.current) {
        e.preventDefault();
        updateDrag(touch.clientY);
        return;
      }

      // Start dragging if at scroll top and pulling down
      const deltaY = touch.clientY - touchStartY.current;
      if (scrollRef.current.scrollTop <= 0 && deltaY > 0) {
        startDrag(touch.clientY);
        e.preventDefault();
      }
    },
    [isDragging, startDrag, updateDrag],
  );

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    endDrag();
  }, [isDragging, endDrag]);

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto"
      style={{
        touchAction: "pan-y",
        overscrollBehaviorY: "contain",
        WebkitOverflowScrolling: "touch",
      }}
      onPointerDownCapture={onPointerDownCapture}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
}
