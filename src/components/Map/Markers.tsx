import { AggregatedSearchResults, getFrenchTimeString } from "@/utils";
import L, { Map, Marker as LeafletMarker } from "leaflet";
import { useEffect, useRef } from "react";
import { useMapRouter } from "@/hooks/useMapRouter";
import { useQueryClient } from "@tanstack/react-query";
import { components } from "@/types";

const seedChurchDetails = (
  queryClient: ReturnType<typeof useQueryClient>,
  church: AggregatedSearchResults["churches"][number],
) => {
  const existing = queryClient.getQueryData<
    components["schemas"]["ChurchDetails"] | components["schemas"]["ChurchOut"]
  >(["churchDetails", church.uuid]);
  if (existing && "schedules" in existing) return;
  queryClient.setQueryData(["churchDetails", church.uuid], {
    uuid: church.uuid,
    name: church.name,
    address: church.address,
    zipcode: church.zipcode,
    city: church.city,
    latitude: church.latitude,
    longitude: church.longitude,
    events: church.events,
  });
};

export const ChurchMarker = ({
  map,
  church,
  selected,
}: {
  map: Map;
  church: AggregatedSearchResults["churches"][number];
  selected: boolean;
}) => {
  const { uuid, latitude, longitude, eventsByDay } = church;
  const router = useMapRouter();
  const queryClient = useQueryClient();
  const markerRef = useRef<LeafletMarker | null>(null);

  const firstDayFirstEvent = Object.values(
    eventsByDay || {},
  )?.[0]?.[0];
  const timeLabel = firstDayFirstEvent
    ? getFrenchTimeString(firstDayFirstEvent.start)
    : null;

  useEffect(() => {
    let marker: LeafletMarker;

    const handleClick = () => {
      seedChurchDetails(queryClient, church);
      const params = new URLSearchParams(window.location.search);
      params.set("center", `${latitude},${longitude}`);
      router.push(`/church/${uuid}?${params.toString()}`);
    };

    if (timeLabel === null) {
      const emptySize = selected ? 20 : 14;
      const cls = selected ? "empty-church-marker-selected" : "empty-church-marker";
      marker = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: "",
          html: `<div class="${cls}"></div>`,
          iconSize: [emptySize, emptySize],
          iconAnchor: [emptySize / 2, emptySize / 2],
        }),
        zIndexOffset: selected ? 1000 : 0,
      })
        .addTo(map)
        .on("click", handleClick);
    } else {
      const markerClass = selected ? "church-marker-selected" : "church-marker";
      const size: [number, number] = selected ? [58, 28] : [50, 24];
      marker = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: "", // needed to remove the default leaflet class
          html: `<div class="${markerClass}">${timeLabel}</div>`,
          iconSize: size,
          popupAnchor: [0, -size[1]], // from the iconAnchor, up the entire height
          iconAnchor: [size[0] / 2, size[1]], // from the top left, half the width and the entire height
        }),
        zIndexOffset: selected ? 1000 : 0,
      })
        .addTo(map)
        .on("click", handleClick);
    }

    markerRef.current = marker;
    return () => {
      marker.remove();
    };
  }, [map, router, queryClient, church, uuid, latitude, longitude, timeLabel, selected]);

  useEffect(() => {
    if (!markerRef.current) return;
    if (selected) {
      markerRef.current.openPopup();
    } else {
      markerRef.current.closePopup();
    }
  }, [selected]);

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
