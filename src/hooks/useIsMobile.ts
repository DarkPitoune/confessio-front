import { useState, useEffect } from "react";
import { MOBILE_BREAKPOINT } from "@/utils";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (window.visualViewport && window.visualViewport.width < MOBILE_BREAKPOINT)
      setIsMobile(true);
  }, []);
  return isMobile;
};
