import { components } from "./types";

const API_URL = "https://confessio.fr/front/api";

export const fetchApi = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${url}`, options);
  return response.json();
};

export type AggregatedSearchResults = {
  aggregations: components["schemas"]["SearchResult"]["aggregations"];
  churches: (components["schemas"]["SearchResult"]["churches"][number] & {
    website?: components["schemas"]["WebsiteOut"] & {
      eventsByDay?: Record<string, components["schemas"]["EventOut"][]>;
    };
  })[];
};

export const fetchChurchesWithWebsites = async ({
  min_lat,
  min_lng,
  max_lat,
  max_lng,
  date_filter,
  signal,
}: {
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
  date_filter?: string;
  signal: AbortSignal;
}): Promise<AggregatedSearchResults> => {
  const searchParams = new URLSearchParams({
    min_lat: min_lat.toString(),
    min_lng: min_lng.toString(),
    max_lat: max_lat.toString(),
    max_lng: max_lng.toString(),
  });

  if (date_filter) {
    searchParams.append("date_filter", date_filter);
  }

  const response: components["schemas"]["SearchResult"] = await fetchApi(
    `/search?${searchParams.toString()}`,
    { signal },
  );
  const churches = response.churches.map((church) => {
    const website = response.websites.find(
      (website) => website.uuid === church.website_uuid,
    );

    const events = website?.events
      .filter((event) => event.church_uuid === church.uuid)
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );

    const today = new Date();
    const eventsByDay = events?.reduce(
      (acc, event) => {
        const dayKey = new Date(event.start).toDateString();
        // Remove events that are over
        if (
          new Date(event.start) < today ||
          (event?.end && new Date(event.end) < today)
        )
          return acc;

        // remove events that are not on the correct church
        if (event.church_uuid !== church.uuid) return acc;
        if (!acc[dayKey]) acc[dayKey] = [];
        acc[dayKey].push(event);
        return acc;
      },
      {} as Record<string, typeof events>,
    );

    return {
      ...church,
      website: website ? { ...website, eventsByDay } : undefined,
    };
  });
  return {
    churches,
    aggregations: response.aggregations,
  };
};

/**
 * Removes the "Église " at the beginning of the name, for readability
 */
export const cleanupChurchName = (churchName: string) =>
  churchName.replace("Église ", "");
