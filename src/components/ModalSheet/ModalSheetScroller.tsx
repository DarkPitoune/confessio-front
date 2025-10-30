import { useState, useEffect, ReactNode } from "react";
import ModalSheetScrollerServer from "./ModalSheetScrollerServer";
import ModalSheetScrollerClient from "./ModalSheetScrollerClient";
import { SheetScrollerProps } from "react-modal-sheet";

const ModalSheetScroller = ({
  children,
  ...props
}: { children: ReactNode } & SheetScrollerProps) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    if (window.visualViewport && window.visualViewport.width < 768)
      setIsMounted(true);
  }, []);
  if (isMounted)
    return <ModalSheetScrollerClient>{children}</ModalSheetScrollerClient>;
  return (
    <ModalSheetScrollerServer {...props}>{children}</ModalSheetScrollerServer>
  );
};

export default ModalSheetScroller;
