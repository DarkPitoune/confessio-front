import { useState, useEffect, ReactNode } from "react";
import ModalSheetContainerClient from "./ModalSheetContainerClient";
import ModalSheetContainerServer from "./ModalSheetContainerServer";

const ModalSheetContainer = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    console.log("mount");
    setIsMounted(true);
  }, []);
  if (isMounted)
    return <ModalSheetContainerClient>{children}</ModalSheetContainerClient>;
  return <ModalSheetContainerServer>{children}</ModalSheetContainerServer>;
};

export default ModalSheetContainer;
