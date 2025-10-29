import { AggregatedSearchResults, cleanupChurchName } from "@/utils";
import L, { Map } from "leaflet";

export const addChurchMarker = (
  map: Map,
  church: AggregatedSearchResults["churches"][number],
  setSelectedChurch: (
    church: AggregatedSearchResults["churches"][number],
  ) => void,
) => {
  const firstDayFirstEvent = Object.values(
    church.website?.eventsByDay || {},
  )?.[0]?.[0];

  if (firstDayFirstEvent === undefined) {
    const emptyChurchMarker = L.marker([church.latitude, church.longitude], {
      icon: L.divIcon({
        className: "leaflet-div-icon empty-church-marker", // leaflet-div-icon is the default we have to put back
        html: "<span class='empty-church-marker'></span>",
        iconSize: [10, 10],
      }),
    }).addTo(map);
    return emptyChurchMarker;
  }

  const firstEventStart = new Date(firstDayFirstEvent.start);
  const marker = L.marker([church.latitude, church.longitude], {
    icon: L.divIcon({
      className: "", // needed to remove the default leaflet class
      html: `<div class="church-marker">${firstEventStart.toTimeString().split(":00 ")[0]?.replace(":", "h")}</div>`,
      iconSize: [30, 30],
      popupAnchor: [0, -30], // from the iconAnchor, up the entire height
      iconAnchor: [15, 30], // from the top left, half the width and the entire height
    }),
  })
    .addTo(map)
    .bindPopup(
      `<strong>${cleanupChurchName(church.name)}</strong><br/>${church.address || ""}`,
    )
    .on("click", () => {
      setSelectedChurch(church);
    });
  return marker;
};

export const addAggregationMarker = (
  map: Map,
  aggregation: AggregatedSearchResults["aggregations"][number],
) => {
  const marker = L.marker(
    [aggregation.centroid_latitude, aggregation.centroid_longitude],
    {
      icon: L.divIcon({
        className: "",
        html: `<div class="aggregation-marker-count">${aggregation.church_count}</div>`,
        iconSize: [25, 25],
        iconAnchor: [12.5, 25], // from to top left, half the width and half the height
      }),
    },
  )
    .addTo(map)
    .on("click", () => {
      map.flyToBounds([
        [aggregation.max_latitude, aggregation.min_longitude],
        [aggregation.min_latitude, aggregation.max_longitude],
      ]);
    });
  return marker;
};
