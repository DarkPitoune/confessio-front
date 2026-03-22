import { components } from "@/types";
import { AggregatedSearchResults, Bounds, fetchApi, MAP_TILER_API_KEY, MOBILE_BREAKPOINT } from "@/utils";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "@/lib/leaflet-active-area";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChurchMarker, AggregationMarker, CurrentPositionMarker } from "./Markers";

const getAggregationUuid = (
  aggregation: components["schemas"]["SearchResult"]["aggregations"][number],
) => {
  const truncatedLatitude =
    Math.trunc(aggregation.centroid_latitude * 10000) / 10000;
  const truncatedLongitude =
    Math.trunc(aggregation.centroid_longitude * 10000) / 10000;
  return `${truncatedLatitude}-${truncatedLongitude}`;
};

const Map = ({
  setMap,
  searchResults,
  currentPosition,
  initialBounds,
}: {
  setMap: (map: LeafletMap) => void;
  searchResults: AggregatedSearchResults | null | undefined;
  currentPosition: { latitude: number; longitude: number } | null;
  initialBounds: Bounds | null;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  const pathname = usePathname();
  const selectedChurchUuid = pathname?.match(/\/church\/([^/]+)/)?.[1];

  // Fetch selected church details to center map when no bounds are provided
  const { data: selectedChurchDetails } = useQuery<
    components["schemas"]["ChurchDetails"]
  >({
    queryKey: ["churchDetails", selectedChurchUuid],
    queryFn: () => fetchApi(`/church/${selectedChurchUuid}`),
    enabled: !!selectedChurchUuid && !initialBounds,
  });

  useEffect(() => {
    if (mapInstanceRef.current && selectedChurchDetails && !initialBounds) {
      mapInstanceRef.current.setView(
        [selectedChurchDetails.latitude, selectedChurchDetails.longitude],
        16,
      );
    }
  }, [selectedChurchDetails, initialBounds]);

  // Values match ModalSheet width (desktop) and collapsed snap point (mobile)
  const getActiveAreaStyles = useCallback((): Partial<CSSStyleDeclaration> => {
    const isDesktop = window.innerWidth >= MOBILE_BREAKPOINT;
    if (isDesktop) {
      return { position: "absolute", top: "0", left: "500px", right: "0", bottom: "0" };
    }
    return { position: "absolute", top: "0", left: "0", right: "0", bottom: "140px" };
  }, []);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const startingBounds = initialBounds || {
        north: 48.9,
        west: 2.18,
        south: 48.78,
        east: 2.48,
      };

      const map = L.map(mapRef.current, {
        center: [
          (startingBounds.north + startingBounds.south) / 2,
          (startingBounds.west + startingBounds.east) / 2,
        ],
        zoom: 14,
        zoomControl: false,
      });

      mapInstanceRef.current = map;
      setMapInstance(map);
      map.setActiveArea(getActiveAreaStyles());
      setMap(map);

      new MaptilerLayer({
        apiKey: MAP_TILER_API_KEY || "",
      }).addTo(map);
    }
  }, [setMap, initialBounds, getActiveAreaStyles]);

  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setActiveArea(getActiveAreaStyles());
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getActiveAreaStyles]);

  useEffect(() => {
    // adapt map position to current position
    if (mapInstanceRef.current && currentPosition) {
      mapInstanceRef.current.setView(
        [currentPosition.latitude, currentPosition.longitude],
        14,
      );
    }
  }, [currentPosition]);

  return (
    <div ref={mapRef} className="h-full w-full">
      {mapInstance && (
        <>
          {searchResults?.churches.map((church) => (
            <ChurchMarker
              key={church.uuid}
              map={mapInstance}
              church={church}
              selected={church.uuid === selectedChurchUuid}
            />
          ))}
          {searchResults?.aggregations.map((aggregation) => (
            <AggregationMarker
              key={getAggregationUuid(aggregation)}
              map={mapInstance}
              aggregation={aggregation}
            />
          ))}
          {currentPosition && (
            <CurrentPositionMarker
              map={mapInstance}
              position={currentPosition}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Map;
