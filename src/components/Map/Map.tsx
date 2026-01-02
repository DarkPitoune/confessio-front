import { selectedChurchAtom } from "@/store/atoms";
import { components } from "@/types";
import { AggregatedSearchResults, Bounds, MAP_TILER_API_KEY } from "@/utils";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";
import { useAtom } from "jotai";
import L, { Map as LeafletMap, Marker } from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { addAggregationMarker, useAddChurchMarker } from "./markers";

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
  const churchMarkersRef = useRef<{ [key: string]: Marker }>({});
  const aggregationMarkersRef = useRef<{ [key: string]: Marker }>({});
  const [selectedChurch, setSelectedChurch] = useAtom(selectedChurchAtom);
  const addChurchMarker = useAddChurchMarker();
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
      setMap(map);

      new MaptilerLayer({
        apiKey: MAP_TILER_API_KEY || "",
      }).addTo(map);
    }
  }, [setMap, initialBounds]);

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
        const marker = addChurchMarker(
          mapInstanceRef.current!,
          church,
          setSelectedChurch,
        );
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
  }, [searchResults, currentPosition, setSelectedChurch, addChurchMarker]);

  // Pan and click on selected church
  useEffect(() => {
    if (mapInstanceRef.current) {
      if (selectedChurch) {
        const zoomLevel = Math.max(mapInstanceRef.current.getZoom(), 14);
        mapInstanceRef.current.flyTo(
          [selectedChurch.latitude, selectedChurch.longitude],
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
        const marker = addAggregationMarker(
          mapInstanceRef.current!,
          aggregation,
        );
        aggregationMarkersRef.current[uuid] = marker;
      }
    });
  }, [searchResults]);

  // endregion

  return <div ref={mapRef} className="h-full w-full" />;
};

export default Map;
