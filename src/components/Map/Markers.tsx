import { AggregatedSearchResults, getFrenchTimeString } from "@/utils";
import L, { Map, Marker as LeafletMarker } from "leaflet";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export const ChurchMarker = ({
  map,
  church: { uuid, latitude, longitude, website },
  selected,
}: {
  map: Map;
  church: AggregatedSearchResults["churches"][number];
  selected: boolean;
}) => {
  const router = useRouter();
  const markerRef = useRef<LeafletMarker | null>(null);

  const firstDayFirstEvent = Object.values(
    website?.eventsByDay || {},
  )?.[0]?.[0];
  const timeLabel = firstDayFirstEvent
    ? getFrenchTimeString(firstDayFirstEvent.start)
    : null;

  useEffect(() => {
    let marker: LeafletMarker;

    if (timeLabel === null) {
      marker = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: "leaflet-div-icon empty-church-marker", // leaflet-div-icon is the default we have to put back
          html: "<span class='empty-church-marker'></span>",
          iconSize: [10, 10],
        }),
      }).addTo(map);
    } else {
      marker = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: "", // needed to remove the default leaflet class
          html: `<div class="church-marker">${timeLabel}</div>`,
          iconSize: [50, 24],
          popupAnchor: [0, -24], // from the iconAnchor, up the entire height
          iconAnchor: [25, 24], // from the top left, half the width and the entire height
        }),
      })
        .addTo(map)
        .on("click", () => {
          const currentParams = new URLSearchParams(window.location.search);
          router.push(`/church/${uuid}?${currentParams.toString()}`);
        });
    }

    markerRef.current = marker;
    return () => {
      marker.remove();
    };
  }, [map, router, uuid, latitude, longitude, timeLabel]);

  useEffect(() => {
    if (!markerRef.current) return;
    if (selected) {
      const zoom = Math.max(map.getZoom(), 16);
      map.flyTo([latitude, longitude], zoom);
      markerRef.current.openPopup();
    } else {
      markerRef.current.closePopup();
    }
  }, [selected, map, latitude, longitude]);

  return null;
};

export const AggregationMarker = ({
  map,
  aggregation: {
    centroid_latitude,
    centroid_longitude,
    church_count,
    max_latitude,
    min_latitude,
    max_longitude,
    min_longitude,
  },
}: {
  map: Map;
  aggregation: AggregatedSearchResults["aggregations"][number];
}) => {
  useEffect(() => {
    const marker = L.marker([centroid_latitude, centroid_longitude], {
      icon: L.divIcon({
        className: "",
        html: `<div class="aggregation-marker-count">${church_count}</div>`,
        iconSize: [25, 25],
        iconAnchor: [12.5, 25], // from to top left, half the width and half the height
      }),
    })
      .addTo(map)
      .on("click", () => {
        map.flyToBounds([
          [max_latitude, min_longitude],
          [min_latitude, max_longitude],
        ]);
      });

    return () => {
      marker.remove();
    };
  }, [
    map,
    centroid_latitude,
    centroid_longitude,
    church_count,
    max_latitude,
    min_latitude,
    max_longitude,
    min_longitude,
  ]);

  return null;
};

export const CurrentPositionMarker = ({
  map,
  position,
}: {
  map: Map;
  position: { latitude: number; longitude: number };
}) => {
  useEffect(() => {
    const marker = L.marker([position.latitude, position.longitude], {
      icon: L.divIcon({
        className: "current-position-marker",
        html: '<div style="background-color: #007bff; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #007bff;"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    }).addTo(map);

    return () => {
      marker.remove();
    };
  }, [map, position.latitude, position.longitude]);

  return null;
};
