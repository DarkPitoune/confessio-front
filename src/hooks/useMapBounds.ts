import { parseBoundsParam, type Bounds } from "@/utils";
import { useSearchParams } from "next/navigation";
import { useMemo, useCallback } from "react";

type MapBoundsContext = {
  bounds: Bounds | null;
  setBounds: (bounds: Bounds) => void;
};

export const useMapBounds = (): MapBoundsContext => {
  const searchParams = useSearchParams();

  // Extract the string value - stable across renders for same URL
  const boundsParam = searchParams.get("bounds");

  // Memoize the Bounds object based on the string value
  const bounds = useMemo(() => parseBoundsParam(boundsParam), [boundsParam]);

  // Sync URL when bounds change
  const setBounds = useCallback((newBounds: Bounds) => {
    if (!newBounds) return;
    const south = newBounds.south.toFixed(6);
    const west = newBounds.west.toFixed(6);
    const north = newBounds.north.toFixed(6);
    const east = newBounds.east.toFixed(6);
    const boundsStr = `${south},${west},${north},${east}`;

    // Read pathname from the browser directly to avoid stale React closure
    // (moveend fires after flyTo animation, by which time router.push may
    // have updated the URL but React hasn't re-rendered yet)
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("bounds", boundsStr);
    currentParams.delete("center"); // consumed by Map, clean up
    // Pass null — Next.js's patched replaceState will copy its internal
    // routing state automatically via copyNextJsInternalHistoryState.
    // Passing history.state would set __NA which makes Next.js skip the
    // URL sync, preventing useSearchParams from updating.
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${currentParams.toString()}`,
    );
  }, []);

  return { bounds, setBounds };
};
