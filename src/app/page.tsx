"use client";

import { useQuery } from "@tanstack/react-query";
import ModalSheet from "@/components/ModalSheet";
import { SearchInput } from "@/components/SearchInput";
import { components } from "@/types";
import {
  AggregatedSearchResults,
  fetchApi,
  fetchChurchesWithWebsites,
} from "@/utils";
import { useAtom } from "jotai";
import { dateFilterAtom, selectedChurchAtom } from "@/store/atoms";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { LatLngBounds, Map as LeafletMap } from "leaflet";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";

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
  const [selectedChurch, setSelectedChurch] = useAtom(selectedChurchAtom);
  const [dateFilter, setDateFilter] = useAtom(dateFilterAtom);
  const params = useParams();
  const searchParams = useSearchParams();

  const [debouncedSearchQuery] = useDebounce(searchQuery, 100);
  const [debouncedBounds] = useDebounce(bounds, 500);

  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [initialCenter, setInitialCenter] = useState<{
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
    useQuery<AggregatedSearchResults | null>({
      queryKey: ["churches", debouncedBounds, dateFilter],
      queryFn: async ({ signal }) => {
        if (!debouncedBounds) return Promise.resolve(null);
        return fetchChurchesWithWebsites({
          min_lat: debouncedBounds.getSouth(),
          max_lat: debouncedBounds.getNorth(),
          min_lng: debouncedBounds.getEast(),
          max_lng: debouncedBounds.getWest(),
          date_filter: dateFilter,
          signal,
        });
      },
      staleTime: 200,
      placeholderData: (previousdata) => previousdata,
    });

  // Handle direct URL access to church pages
  const { data: churchFromUrl } = useQuery<
    components["schemas"]["SearchResult"]["churches"][number]
  >({
    queryKey: ["church", params.uuid],
    queryFn: () => fetchApi(`/church/${params.uuid}`),
    enabled: !!params.uuid && !selectedChurch,
  });

  // Fetch initial geolocation based on IP
  useEffect(() => {
    const fetchInitialLocation = async () => {
      try {
        const response = await fetch('/api/geolocation');
        const data = await response.json();
        setInitialCenter({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } catch (error) {
        console.error('Failed to fetch initial location:', error);
        setInitialCenter({
          latitude: 48.8566,
          longitude: 2.3522,
        });
      }
    };

    fetchInitialLocation();
  }, []);

  // Initialize date filter from URL (only on mount and navigation)
  useEffect(() => {
    const urlDate = searchParams.get("date");
    if (urlDate && urlDate !== dateFilter) {
      setDateFilter(urlDate);
    }
  }, [searchParams]);

  // Sync date filter to URL
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    if (dateFilter) {
      currentParams.set("date", dateFilter);
    } else {
      currentParams.delete("date");
    }

    const newSearch = currentParams.toString();
    const currentPath = selectedChurch ? `/church/${selectedChurch.uuid}` : "/";
    const newUrl = newSearch ? `${currentPath}?${newSearch}` : currentPath;

    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [dateFilter, selectedChurch]);

  // Sync URL with atom state
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const queryString = currentParams.toString();

    if (selectedChurch) {
      // Shadow routing - update URL without navigation
      const newUrl = queryString
        ? `/church/${selectedChurch.uuid}?${queryString}`
        : `/church/${selectedChurch.uuid}`;
      window.history.replaceState(null, "", newUrl);
    } else {
      const newUrl = queryString ? `/?${queryString}` : "/";
      window.history.replaceState(null, "", newUrl);
    }
  }, [selectedChurch, searchParams]);

  // Handle direct URL access
  useEffect(() => {
    if (params.uuid && churchFromUrl && !selectedChurch) {
      setSelectedChurch(churchFromUrl);
    }
  }, [params.uuid, churchFromUrl, selectedChurch, setSelectedChurch]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopstate = () => {
      const path = window.location.pathname;
      if (path === "/") {
        setSelectedChurch(null);
      } else if (path.startsWith("/church/")) {
        const uuid = path.split("/")[2];
        // Only update if it's different from current
        if (!selectedChurch || selectedChurch.uuid !== uuid) {
          // The church will be loaded by the query above
        }
      }
    };

    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, [selectedChurch, setSelectedChurch]);

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
        className="absolute right-4 bottom-[160px] md:bottom-4 size-12 z-20 bg-deepblue rounded-full flex items-center justify-center cursor-pointer shadow-lg"
      >
        <Image src="/target.svg" alt="Centrer sur moi" width={32} height={32} />
      </button>
      <div className="relative z-10 h-screen w-screen">
        <Map
          setMap={setMap}
          searchResults={searchResults}
          currentPosition={currentPosition}
          initialCenter={initialCenter}
        />
        <ModalSheet searchResults={searchResults} />
      </div>
    </>
  );
}

export default HomePage;
