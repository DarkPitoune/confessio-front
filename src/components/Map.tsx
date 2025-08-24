import { components } from "@/types";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";
import L, { Map as LeafletMap, Marker } from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

const Map = ({
  setMap,
  searchResults,
  currentPosition,
  setSelectedChurch,
}: {
  setMap: (map: LeafletMap) => void;
  searchResults: components["schemas"]["SearchResult"] | undefined;
  currentPosition: { latitude: number; longitude: number } | null;
  setSelectedChurch: (
    church: components["schemas"]["SearchResult"]["churches"][number],
  ) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<{ [key: string]: Marker }>({});

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [48.8566, 2.3522],
        zoom: 14,
        zoomControl: false,
      });

      mapInstanceRef.current = map;
      setMap(map);

      new MaptilerLayer({
        apiKey: "IvfJd8JdfCAMSmSC08kr",
      }).addTo(map);
    }
  }, []);

  useEffect(() => {
    // adapt map position to current position
    if (mapInstanceRef.current && currentPosition) {
      mapInstanceRef.current.setView(
        [currentPosition.latitude, currentPosition.longitude],
        14,
      );
    }
  }, [currentPosition]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // find markers that are not in the new search results
    for (const [key, marker] of Object.entries(markersRef.current)) {
      if (!searchResults?.churches.find((church) => church.uuid === key)) {
        marker.remove();
        delete markersRef.current[key];
      }
    }

    // Add markers for new churches
    searchResults?.churches.forEach((church) => {
      if (!markersRef.current[church.uuid]) {
        const marker = L.marker([church.latitude, church.longitude])
          .addTo(mapInstanceRef.current!)
          .bindPopup(
            `<strong>${church.name}</strong><br/>${church.address || ""}`,
          )
          .on("click", () => {
            setSelectedChurch(church);
          });
        markersRef.current[church.uuid] = marker;
      }
    });

    // Add marker for current position
    if (currentPosition) {
      const currentPositionMarker = L.marker(
        [currentPosition.latitude, currentPosition.longitude],
        {
          icon: L.divIcon({
            className: "current-position-marker",
            html: '<div style="background-color: #007bff; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #007bff;"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        },
      ).addTo(mapInstanceRef.current!);

      markersRef.current["current-position-marker"] = currentPositionMarker;
    }
  }, [searchResults, currentPosition, setSelectedChurch]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
};

export default Map;
