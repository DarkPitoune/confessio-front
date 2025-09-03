import { selectedChurchAtom } from "@/store/atoms";
import { components } from "@/types";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";
import { useAtom } from "jotai";
import L, { Map as LeafletMap, Marker } from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

const getAggregationUuid = (
  aggregation: components["schemas"]["SearchResult"]["aggregations"][number],
) => {
  const truncatedLatitude =
    Math.trunc(aggregation.centroid_latitude * 10000) / 10000;
  const truncatedLongitude =
    Math.trunc(aggregation.centroid_longitude * 10000) / 10000;
  return `${truncatedLatitude}-${truncatedLongitude}`;
};

const getZoomLevel = (
  aggregation: components["schemas"]["SearchResult"]["aggregations"][number],
) => {
  console.log("aggregation", aggregation.type, aggregation.name);
  switch (aggregation.type) {
    case "diocese":
      return 12;
    case "municipality":
      return 15;
    case "parish":
      return 14;
  }
};
const Map = ({
  setMap,
  searchResults,
  currentPosition,
}: {
  setMap: (map: LeafletMap) => void;
  searchResults: components["schemas"]["SearchResult"] | undefined;
  currentPosition: { latitude: number; longitude: number } | null;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const churchMarkersRef = useRef<{ [key: string]: Marker }>({});
  const aggregationMarkersRef = useRef<{ [key: string]: Marker }>({});
  const [selectedChurch, setSelectedChurch] = useAtom(selectedChurchAtom);

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
  }, [setMap]);

  useEffect(() => {
    // adapt map position to current position
    if (mapInstanceRef.current && currentPosition) {
      mapInstanceRef.current.setView(
        [currentPosition.latitude, currentPosition.longitude],
        14,
      );
    }
  }, [currentPosition]);

  // region Churches Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // find markers that are not in the list of churches
    for (const [key, marker] of Object.entries(churchMarkersRef.current)) {
      if (!searchResults?.churches.find((church) => church.uuid === key)) {
        marker.remove();
        delete churchMarkersRef.current[key];
      }
    }

    // Add markers for new churches
    searchResults?.churches.forEach((church) => {
      if (!churchMarkersRef.current[church.uuid]) {
        const marker = L.marker([church.latitude, church.longitude], {
          // todo this is incorrectly centered
          icon: L.divIcon({
            className: "",
            html: `<div class="church-marker">${church.name.slice(0, 2)}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 5],
          }),
        })
          .addTo(mapInstanceRef.current!)
          .bindPopup(
            `<strong>${church.name}</strong><br/>${church.address || ""}`,
          )
          .on("click", () => {
            setSelectedChurch(church);
          });
        churchMarkersRef.current[church.uuid] = marker;
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

      churchMarkersRef.current["current-position-marker"] =
        currentPositionMarker;
    }
  }, [searchResults, currentPosition, setSelectedChurch]);

  // Pan and click on selected church
  useEffect(() => {
    if (mapInstanceRef.current) {
      // TODO: This does not really work consistently, to fix before v1
      if (selectedChurch) {
        const zoomLevel = Math.max(mapInstanceRef.current.getZoom(), 14);
        mapInstanceRef.current.setView(
          [selectedChurch.latitude - 0.01, selectedChurch.longitude],
          zoomLevel,
        );
        churchMarkersRef.current[selectedChurch.uuid]?.openPopup();
      } else {
        Object.values(churchMarkersRef.current).forEach((marker) =>
          marker.closePopup(),
        );
      }
    }
  }, [selectedChurch]);

  // endregion

  // region Aggregation Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // find markers that are not in the list of aggregations
    for (const [key, marker] of Object.entries(aggregationMarkersRef.current)) {
      if (
        !searchResults?.aggregations.find(
          (aggregation) => getAggregationUuid(aggregation) === key,
        )
      ) {
        marker.remove();
        delete aggregationMarkersRef.current[key];
      }
    }

    // Add Aggregation markers for new aggregations
    searchResults?.aggregations.forEach((aggregation) => {
      const uuid = getAggregationUuid(aggregation);
      if (!aggregationMarkersRef.current[uuid]) {
        const marker = L.marker(
          [aggregation.centroid_latitude, aggregation.centroid_longitude],
          {
            icon: L.divIcon({
              className: "",
              html: `<div class="aggregation-marker-count">${aggregation.church_count}</div>`,
              iconSize: [25, 25],
              iconAnchor: [10, 10],
            }),
          },
        )
          .addTo(mapInstanceRef.current!)
          .on("click", () => {
            mapInstanceRef.current?.setView(
              [aggregation.centroid_latitude, aggregation.centroid_longitude],
              getZoomLevel(aggregation),
            );
          });
        aggregationMarkersRef.current[uuid] = marker;
      }
    });
  }, [searchResults]);

  // endregion

  return <div ref={mapRef} className="h-full w-full" />;
};

export default Map;
