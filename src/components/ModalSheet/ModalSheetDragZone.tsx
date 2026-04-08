"use client";
import { useState, useEffect, ReactNode } from "react";
import ModalSheetDragZoneClient from "./ModalSheetDragZoneClient";

const ModalSheetDragZone = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    if (window.visualViewport && window.visualViewport.width < 768)
      setIsMounted(true);
  }, []);
  if (isMounted)
    return <ModalSheetDragZoneClient>{children}</ModalSheetDragZoneClient>;
  return <>{children}</>;
};

export default ModalSheetDragZone;
