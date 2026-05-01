"use client";
import Image from "next/image";
import { useEffect } from "react";
import { useSheetRef } from "./ModalSheet/SheetContext";
import { ChurchCard } from "./ChurchCard";
import ModalSheetContainer from "./ModalSheet/ModalSheetContainer";
import ModalSheetScroller from "./ModalSheet/ModalSheetScroller";
import ModalSheetDragZone from "./ModalSheet/ModalSheetDragZone";
import ChurchTile from "./ChurchTile";
import { useDateFilter } from "@/hooks/useDateFilter";
import { useSearchResults } from "@/hooks/useSearchResults";
import { AggregatedSearchResults } from "@/utils";
import { components } from "@/types";

const SKELETON_TILE_COUNT = 6;

function ChurchTileSkeleton() {
  return (
    <div className="w-full bg-paper/40 border border-hairline/30 rounded-2xl px-4 py-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="h-4 w-2/3 rounded bg-white/15" />
          <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function ModalSheet({
  selectedChurchUuid,
  initialChurchDetails,
  initialSearchResults,
}: {
  selectedChurchUuid?: string;
  initialChurchDetails?: components["schemas"]["ChurchDetails"];
  initialSearchResults?: AggregatedSearchResults | null;
}) {
  const { date, setDate } = useDateFilter();
  const sheetRef = useSheetRef();
  const { data: searchResults } = useSearchResults(initialSearchResults);

  useEffect(() => {
    if (selectedChurchUuid) sheetRef?.current?.snapTo(1);
  }, [selectedChurchUuid, sheetRef]);

  return (
    <ModalSheetContainer>
      {selectedChurchUuid ? (
        <ChurchCard uuid={selectedChurchUuid} initialData={initialChurchDetails} />
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
              {searchResults === undefined
                ? Array.from({ length: SKELETON_TILE_COUNT }).map((_, i) => (
                    <ChurchTileSkeleton key={i} />
                  ))
                : searchResults?.churches?.map((church) => (
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
