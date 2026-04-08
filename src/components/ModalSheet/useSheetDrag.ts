"use client";
import { useRef, useCallback } from "react";
import { animate, type MotionValue } from "motion/react";

const VELOCITY_THRESHOLD = 0.3; // px/ms (~300px/s) — low enough for easy flicks

function resolveSnapYValues(
  snapPoints: number[],
  sheetHeight: number,
): number[] {
  return snapPoints
    .map((p) => {
      const resolved = p > 0 && p <= 1 ? Math.round(p * sheetHeight) : p;
      return sheetHeight - Math.min(resolved, sheetHeight);
    })
    .sort((a, b) => a - b); // ascending: [top(smallest y), middle, bottom(largest y)]
}

function findClosest(values: number[], target: number): number {
  let closest = values[0] ?? 0;
  let minDiff = Math.abs(closest - target);
  for (let i = 1; i < values.length; i++) {
    const diff = Math.abs(values[i]! - target);
    if (diff < minDiff) {
      closest = values[i]!;
      minDiff = diff;
    }
  }
  return closest;
}

export function useSheetDrag(
  sheetY: MotionValue<number>,
  snapPoints: number[],
  sheetHeight: number,
) {
  const isDragging = useRef(false);
  const touchStartY = useRef(0);
  const yAtDragStart = useRef(0);
  const lastTouchY = useRef(0);
  const lastTouchTime = useRef(0);
  const velocityRef = useRef(0);

  const startDrag = useCallback(
    (clientY: number) => {
      isDragging.current = true;
      touchStartY.current = clientY;
      yAtDragStart.current = sheetY.get();
      lastTouchY.current = clientY;
      lastTouchTime.current = Date.now();
      velocityRef.current = 0;
    },
    [sheetY],
  );

  const updateDrag = useCallback(
    (clientY: number) => {
      // Track velocity
      const now = Date.now();
      const dt = now - lastTouchTime.current;
      if (dt > 0) {
        velocityRef.current = (clientY - lastTouchY.current) / dt;
      }
      lastTouchY.current = clientY;
      lastTouchTime.current = now;

      // Move the sheet
      const deltaY = clientY - touchStartY.current;
      const newY = Math.max(0, yAtDragStart.current + deltaY);
      sheetY.set(newY);
    },
    [sheetY],
  );

  const endDrag = useCallback(() => {
    isDragging.current = false;

    const currentY = sheetY.get();
    const v = velocityRef.current;
    const snapYValues = resolveSnapYValues(snapPoints, sheetHeight);

    let target: number;

    if (Math.abs(v) > VELOCITY_THRESHOLD) {
      if (v < 0) {
        // Flicking up — next snap point above current position
        target =
          snapYValues.filter((s) => s < currentY - 5).at(-1) ??
          snapYValues[0] ??
          0;
      } else {
        // Flicking down — next snap point below current position
        target =
          snapYValues.find((s) => s > currentY + 5) ??
          snapYValues.at(-1) ??
          0;
      }
    } else {
      target = findClosest(snapYValues, currentY);
    }

    animate(sheetY, target, {
      type: "tween",
      ease: [0.32, 0.72, 0, 1],
      duration: 0.4,
    });
  }, [sheetY, snapPoints, sheetHeight]);

  return { isDragging, startDrag, updateDrag, endDrag };
}
