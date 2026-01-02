"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchInput } from "@/components/SearchInput";
import { components } from "@/types";
import { fetchApi, parseBoundsParam } from "@/utils";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Map as LeafletMap } from "leaflet";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useMapBounds } from "@/hooks/useMapBounds";
import { useSearchResults } from "@/hooks/useSearchResults";
import { useSearchParams } from "next/navigation";

const Map = dynamic(() => import("../../components/Map/Map"), {
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
  const [searchQuery, setSearchQuery] = useState("");
  const { setBounds } = useMapBounds();
  const searchParams = useSearchParams();
  const initialBounds = parseBoundsParam(searchParams.get("bounds"));

  const [debouncedSearchQuery] = useDebounce(searchQuery, 100);

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

  const { data: searchResults, isFetching: isSearchResultsFetching } =
    useSearchResults();

  useEffect(
    function attachMapMoveHandler() {
      const moveEndHandler = () => {
        if (map) {
          const bounds = map.getBounds();
          setBounds({
            south: bounds.getSouth(),
            north: bounds.getNorth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          });
        }
      };
      map?.addEventListener("moveend", moveEndHandler);
      map?.fire("moveend");
      return () => {
        map?.removeEventListener("moveend", moveEndHandler);
      };
    },
    [map, setBounds],
  );

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
    <>
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
          initialBounds={initialBounds}
          setMap={setMap}
          searchResults={searchResults}
          currentPosition={currentPosition}
        />
      </div>
    </>
  );
}

export default HomePage;
