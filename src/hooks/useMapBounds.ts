import { parseBoundsParam, type Bounds } from "@/utils";
import { useSearchParams, usePathname } from "next/navigation";
import { useMemo, useCallback } from "react";

type MapBoundsContext = {
  bounds: Bounds | null;
  setBounds: (bounds: Bounds) => void;
};

export const useMapBounds = (): MapBoundsContext => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Extract the string value - stable across renders for same URL
  const boundsParam = searchParams.get("bounds");

  // Memoize the Bounds object based on the string value
  const bounds = useMemo(() => parseBoundsParam(boundsParam), [boundsParam]);

  // Sync URL when bounds change
  const setBounds = useCallback(
    (newBounds: Bounds) => {
      if (!newBounds) return;
      const south = newBounds.south.toFixed(6);
      const west = newBounds.west.toFixed(6);
      const north = newBounds.north.toFixed(6);
      const east = newBounds.east.toFixed(6);
      const boundsStr = `${south},${west},${north},${east}`;

      // Build URL preserving other params
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("bounds", boundsStr);
      window.history.replaceState(
        null,
        "",
        `${pathname}?${currentParams.toString()}`,
      );
    },
    [pathname],
  );

  return { bounds, setBounds };
};
