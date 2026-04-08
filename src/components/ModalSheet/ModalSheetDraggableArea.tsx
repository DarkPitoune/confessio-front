"use client";
import { useState, useEffect, type ReactNode } from "react";
import DraggableArea from "./DraggableArea";
import { useSheetInternals } from "./ModalSheetContainerClient";
import { MOBILE_BREAKPOINT } from "@/utils";

export default function ModalSheetDraggableArea({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const internals = useSheetInternals();

  useEffect(() => {
    if (window.visualViewport && window.visualViewport.width < MOBILE_BREAKPOINT)
      setIsMobile(true);
  }, []);

  if (!isMobile || !internals) {
    return <div className={className}>{children}</div>;
  }

  return (
    <DraggableArea
      sheetY={internals.y}
      snapPoints={internals.snapPoints}
      sheetHeight={internals.sheetHeight}
      className={className}
    >
      {children}
    </DraggableArea>
  );
}
