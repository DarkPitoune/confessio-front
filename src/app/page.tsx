"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import ModalSheet from "@/components/ModalSheet";
import { SearchInput } from "@/components/SearchInput";
import { components } from "@/types";
import {
  AggregatedSearchResults,
  fetchApi,
  fetchChurchesWithWebsites,
} from "@/utils";
import { useAtomValue } from "jotai";
import { dateFilterAtom } from "@/store/atoms";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { LatLngBounds, Map as LeafletMap } from "leaflet";
import Image from "next/image";
import dynamic from "next/dynamic";

const queryClient = new QueryClient();

const Map = dynamic(() => import("../components/Map/Map"), {
  loading: () => (
    <div className="h-screen w-screen flex flex-col gap-4 items-center justify-center">
      <Image
        src="/spinner.svg"
        alt="Loading"
        width={40}
        height={40}
        className="animate-spin"
      />
      <p className="text-deepblue font-medium">Chargement...</p>
    </div>
  ),
  ssr: false,
});

function HomePage() {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [debouncedSearchQuery] = useDebounce(searchQuery, 100);
  const [debouncedBounds] = useDebounce(bounds, 500);

  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { data, isLoading } = useQuery<
    components["schemas"]["AutocompleteItem"][]
  >({
    queryKey: ["mapData", debouncedSearchQuery],
    queryFn: async () => {
      if (debouncedSearchQuery.length === 0) return Promise.resolve([]);
      return fetchApi(`/autocomplete?query=${debouncedSearchQuery}`);
    },
  });
  const dateFilterValue = useAtomValue(dateFilterAtom);
  const { data: searchResults, isFetching: isSearchResultsFetching } =
    useQuery<AggregatedSearchResults | null>({
      queryKey: ["churches", debouncedBounds, dateFilterValue],
      queryFn: async ({ signal }) => {
        if (!debouncedBounds) return Promise.resolve(null);
        return fetchChurchesWithWebsites({
          min_lat: debouncedBounds.getSouth(),
          max_lat: debouncedBounds.getNorth(),
          min_lng: debouncedBounds.getEast(),
          max_lng: debouncedBounds.getWest(),
          date_filter: dateFilterValue,
          signal,
        });
      },
      staleTime: 200,
      placeholderData: (previousdata) => previousdata, // persist previous data to avoid flickering
    });

  useEffect(() => {
    const moveEndHandler = () => {
      if (map) {
        const bounds = map.getBounds();
        setBounds(bounds);
      }
    };
    map?.addEventListener("moveend", moveEndHandler);
    map?.fire("moveend");
    return () => {
      map?.removeEventListener("moveend", moveEndHandler);
    };
  }, [map]);

  const handleCenterOnMe = () => {
    if (map) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ latitude, longitude });
        map.setView([latitude, longitude], 14);
      });
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SearchInput
        map={map}
        isLoading={isLoading || isSearchResultsFetching}
        data={data || []}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <button
        onClick={handleCenterOnMe}
        className="absolute right-4 bottom-[160px] md:bottom-4 size-12 z-20 bg-deepblue rounded-full flex items-center justify-center cursor-pointer shadow-lg"
      >
        <Image src="/target.svg" alt="Centrer sur moi" width={32} height={32} />
      </button>
      <div className="relative z-10 h-screen w-screen">
        <Map
          setMap={setMap}
          searchResults={searchResults}
          currentPosition={currentPosition}
        />
        <ModalSheet searchResults={searchResults} />
      </div>
    </QueryClientProvider>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>
  );
}
