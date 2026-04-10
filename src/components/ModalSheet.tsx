"use client";
import Image from "next/image";
import { useEffect } from "react";
import { useSheetRef } from "./ModalSheet/SheetContext";
import { ChurchCard } from "./ChurchCard";
import ModalSheetContainer from "./ModalSheet/ModalSheetContainer";
import ModalSheetScroller from "./ModalSheet/ModalSheetScroller";
import ModalSheetDragZone from "./ModalSheet/ModalSheetDragZone";
import { AggregatedSearchResults, fetchApi } from "@/utils";
import ChurchTile from "./ChurchTile";
import { useDateFilter } from "@/hooks/useDateFilter";
import { components } from "@/types";
import { useSearchResults } from "@/hooks/useSearchResults";
import { useQuery } from "@tanstack/react-query";
import { CircleNotchIcon } from "@phosphor-icons/react";

function ModalSheet({
  originalSearchResults,
  selectedChurchUuid,
  serverChurchData,
}: {
  originalSearchResults?: AggregatedSearchResults | null | undefined;
  selectedChurchUuid?: string;
  serverChurchData?: components["schemas"]["ChurchDetails"];
}) {
  const { date, setDate } = useDateFilter();
  const sheetRef = useSheetRef();
  const { data: searchResults } = useSearchResults();

  // Fetch church details client-side — shares cache with Map component's query.
  // serverChurchData (from SSR) seeds the cache so first load has content immediately.
  // On client-side navigation, the Map's query may already have cached this UUID.
  const { data: selectedChurch } = useQuery<
    components["schemas"]["ChurchDetails"]
  >({
    queryKey: ["churchDetails", selectedChurchUuid],
    queryFn: () => fetchApi(`/church/${selectedChurchUuid}`),
    enabled: !!selectedChurchUuid,
    initialData: serverChurchData,
  });

  const displayedSearchResults = searchResults
    ? searchResults
    : originalSearchResults;

  useEffect(() => {
    if (selectedChurchUuid) sheetRef?.current?.snapTo(1);
  }, [selectedChurchUuid]);

  return (
    <ModalSheetContainer>
      {selectedChurchUuid ? (
        selectedChurch ? (
          <ChurchCard church={selectedChurch} />
        ) : (
          <div className="flex items-center justify-center py-12">
            <CircleNotchIcon size={32} color="white" className="animate-spin" />
          </div>
        )
      ) : (
        <>
          <ModalSheetDragZone>
            <div className="flex flex-col gap-2 py-2">
              <h4 className="text-base md:text-lg font-semibold text-white px-4">
                Horaires de confession proches de vous
              </h4>
              <div className="px-4 grid grid-cols-2 pb-2">
                <label
                  htmlFor="date-filter"
                  className="text-sm font-medium text-gray-300 flex items-center"
                >
                  Sélectionner une date
                </label>
                <input
                  id="date-filter"
                  type="date"
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lightblue focus:border-transparent backdrop-blur-sm"
                  min={new Date().toISOString().split("T")[0]}
                  value={date?.toISOString().split("T")[0] || ""}
                  onChange={({ target }) =>
                    setDate(target.value ? new Date(target.value) : null)
                  }
                />
              </div>
            </div>
            <hr className="text-gray-500" />
          </ModalSheetDragZone>
          <ModalSheetScroller draggableAt="top">
            <div className="p-4 space-y-4">
              {displayedSearchResults?.churches?.map((church) => (
                <ChurchTile key={church.uuid} church={church} />
              ))}
              <div className="flex items-center justify-center gap-2 py-4">
                <span className="text-white text-xs">Un projet généreusement encouragé par</span>
                <a href="https://hozana.org" target="_blank" rel="noopener noreferrer">
                  <Image src="/hozana-logo-white.png" alt="Hozana" height={16} width={64} />
                </a>
              </div>
            </div>
          </ModalSheetScroller>
        </>
      )}
    </ModalSheetContainer>
  );
}

export default ModalSheet;
