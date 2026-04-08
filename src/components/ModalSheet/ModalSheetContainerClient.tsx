"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Sheet, SheetRef } from "react-modal-sheet";
import type { MotionValue } from "motion/react";

const SNAP_POINTS = [0.95, 0.45, 140] as const;
const BOTTOM_SNAP_INDEX = 2;

// Context to share sheet internals with DraggableScroller
interface SheetInternals {
  y: MotionValue<number>;
  snapPoints: number[];
  sheetHeight: number;
}

const SheetInternalsContext = createContext<SheetInternals | null>(null);
export function useSheetInternals() {
  return useContext(SheetInternalsContext);
}

function ModalSheetContainerClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const sheetRef = useRef<SheetRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internals, setInternals] = useState<SheetInternals | null>(null);

  // Once mounted, grab the y MotionValue and measure sheet height
  useEffect(() => {
    if (!sheetRef.current) return;

    const measure = () => {
      const el = containerRef.current;
      const height = el?.getBoundingClientRect().height ?? window.innerHeight;
      setInternals({
        y: sheetRef.current!.y,
        snapPoints: [...SNAP_POINTS],
        sheetHeight: height,
      });
    };

    // Measure after first paint
    requestAnimationFrame(measure);

    // Re-measure on orientation change
    const handler = () => requestAnimationFrame(measure);
    window.addEventListener("orientationchange", handler);
    return () => window.removeEventListener("orientationchange", handler);
  }, []);

  return (
    <Sheet
      isOpen
      ref={sheetRef}
      snapPoints={[...SNAP_POINTS]}
      initialSnap={BOTTOM_SNAP_INDEX}
      dragCloseThreshold={1}
      tweenConfig={{ ease: [0.32, 0.72, 0, 1], duration: 0.4 }}
      onClose={() => sheetRef.current?.snapTo(BOTTOM_SNAP_INDEX)}
      style={{ zIndex: 30 }}
    >
      <Sheet.Container ref={containerRef}>
        <Sheet.Header />
        <Sheet.Content>
          <SheetInternalsContext.Provider value={internals}>
            {children}
          </SheetInternalsContext.Provider>
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
}

export default ModalSheetContainerClient;
