import { useState, useEffect, ReactNode } from "react";
import ModalSheetContainerClient from "./ModalSheetContainerClient";
import ModalSheetContainerServer from "./ModalSheetContainerServer";

import "./ModalSheet.css";
const ModalSheetContainer = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    if (window.visualViewport && window.visualViewport.width < 768)
      setIsMounted(true);
  }, []);
  if (isMounted)
    return <ModalSheetContainerClient>{children}</ModalSheetContainerClient>;
  return <ModalSheetContainerServer>{children}</ModalSheetContainerServer>;
};

export default ModalSheetContainer;
