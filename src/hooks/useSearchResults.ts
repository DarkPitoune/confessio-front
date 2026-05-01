import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useDateFilter } from "./useDateFilter";
import { useMapBounds } from "./useMapBounds";
import {
  AggregatedSearchResults,
  buildSearchResultsQueryKey,
  fetchChurchesWithWebsites,
} from "@/utils";

export const useSearchResults = (
  initialData?: AggregatedSearchResults | null,
) => {
  const { bounds } = useMapBounds();
  const { date } = useDateFilter();
  const dateFilter = date?.toISOString().split("T")?.[0] ?? null;
  const queryKey = buildSearchResultsQueryKey(bounds, dateFilter);
  const queryClient = useQueryClient();

  // When the page hands us the freshly-fetched list, write it into the cache
  // synchronously *during render* so the very first useQuery read (including
  // SSR) sees it. Plain `initialData` doesn't reliably win when other observers
  // for the same key have already registered (as happens with the
  // loading.tsx → page.tsx streaming render).
  const seededKeyRef = useRef<string | null>(null);
  if (initialData) {
    const keyStr = JSON.stringify(queryKey);
    if (seededKeyRef.current !== keyStr) {
      seededKeyRef.current = keyStr;
      queryClient.setQueryData(queryKey, initialData);
    }
  }

  return useQuery<AggregatedSearchResults | null>({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!bounds) return Promise.resolve(null);
      return fetchChurchesWithWebsites({
        min_lat: bounds.south,
        max_lat: bounds.north,
        min_lng: bounds.east,
        max_lng: bounds.west,
        date_filter: dateFilter ?? undefined,
        signal,
      });
    },
    staleTime: 200,
    placeholderData: (previousdata) => previousdata,
  });
};
