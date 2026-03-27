"use client";
import type { ReactNode } from "react";
import DraggableScroller from "./DraggableScroller";
import { useSheetInternals } from "./ModalSheetContainerClient";

function ModalSheetScrollerClient({ children }: { children: ReactNode }) {
  const internals = useSheetInternals();

  // Before internals are measured, render a plain scrollable div
  if (!internals) {
    return <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>;
  }

  return (
    <DraggableScroller
      sheetY={internals.y}
      snapPoints={internals.snapPoints}
      sheetHeight={internals.sheetHeight}
    >
      {children}
    </DraggableScroller>
  );
}

export default ModalSheetScrollerClient;
