"use client";

import { components } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { LatLngBounds, Map as LeafletMap } from "leaflet";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SearchInput } from "./SearchInput";

const Map = dynamic(() => import("./Map"), {
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
const ModalSheet = dynamic(() => import("./ModalSheet"), {
  // this one's a shame, we'll need to display values from the server
  loading: () => <p>Loading modal sheet...</p>,
  ssr: false,
});

export default function MapView() {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 100);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const { data, isLoading } = useQuery<
    components["schemas"]["AutocompleteItem"][]
  >({
    queryKey: ["mapData", debouncedSearchQuery],
    queryFn: async () => {
      if (debouncedSearchQuery.length === 0) return Promise.resolve([]);
      return fetch(
        `https://confessio.fr/front/api/autocomplete?query=${debouncedSearchQuery}`,
      ).then((res) => res.json());
    },
  });

  // TODO: debounce this to avoid concurrent requests
  const { data: searchResults, isFetching: isSearchResultsFetching } = useQuery<
    components["schemas"]["SearchResult"]
  >({
    queryKey: ["churches", bounds],
    queryFn: async () => {
      if (!bounds) return Promise.resolve(null);
      return fetch(
        `https://confessio.fr/front/api/search?min_lat=${bounds?.getSouth()}&min_lng=${bounds?.getWest()}&max_lat=${bounds?.getNorth()}&max_lng=${bounds?.getEast()}`,
      ).then((res) => res.json());
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
        className="absolute right-4 size-12 z-20 bg-deepblue rounded-full flex items-center justify-center cursor-pointer shadow-lg"
        style={{ bottom: "160px" }}
      >
        <Image src="/target.svg" alt="Center on me" width={32} height={32} />
      </button>
      <div className="relative z-10 h-screen w-screen">
        <Map
          setMap={setMap}
          searchResults={searchResults}
          currentPosition={currentPosition}
        />
      </div>
      <ModalSheet searchResults={searchResults} />
    </>
  );
}
