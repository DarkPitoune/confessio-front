"use client";
import {
  useCallback,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import type { MotionValue } from "motion/react";
import { useSheetDrag } from "./useSheetDrag";

/**
 * A non-scrollable draggable area that drives the sheet's y position
 * with velocity-aware snapping. Used for the fixed zone (title, date filter).
 */
export default function DraggableArea({
  children,
  sheetY,
  snapPoints,
  sheetHeight,
  className,
}: {
  children: ReactNode;
  sheetY: MotionValue<number>;
  snapPoints: number[];
  sheetHeight: number;
  className?: string;
}) {
  const { isDragging, startDrag, updateDrag, endDrag } = useSheetDrag(
    sheetY,
    snapPoints,
    sheetHeight,
  );

  // Block Motion's drag on Sheet.Content — we handle it ourselves
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
      startDrag(touch.clientY);
    },
    [startDrag],
  );

  const onTouchMove = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch || !isDragging.current) return;
      e.preventDefault();
      updateDrag(touch.clientY);
    },
    [isDragging, updateDrag],
  );

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    endDrag();
  }, [isDragging, endDrag]);

  return (
    <div
      className={className}
      style={{ touchAction: "none" }}
      onPointerDownCapture={onPointerDownCapture}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
}
