"use client";
import { useEffect, useRef } from "react";
import { SheetRef } from "react-modal-sheet";
import { ChurchCard } from "./ChurchCard";
import ModalSheetContainer from "./ModalSheet/ModalSheetContainer";
import ModalSheetScroller from "./ModalSheet/ModalSheetScroller";
import { AggregatedSearchResults } from "@/utils";
import ChurchTile from "./ChurchTile";
import { useDateFilter } from "@/hooks/useDateFilter";
import { components } from "@/types";
import { useSearchResults } from "@/hooks/useSearchResults";

function ModalSheet({
  originalSearchResults,
  selectedChurch,
}: {
  originalSearchResults?: AggregatedSearchResults | null | undefined;
  selectedChurch?: components["schemas"]["ChurchDetails"];
}) {
  const { date, setDate } = useDateFilter();
  const sheetRef = useRef<SheetRef>(null);
  const { data: searchResults } = useSearchResults();
  console.log("render MODAL SHEET", {
    originalSearchResults,
    selectedChurch,
  });

  const displayedSearchResults = searchResults
    ? searchResults
    : originalSearchResults;

  useEffect(() => {
    if (selectedChurch) sheetRef.current?.snapTo(0);
  }, [selectedChurch]);

  return (
    <ModalSheetContainer>
      {selectedChurch ? (
        <ChurchCard church={selectedChurch} />
      ) : (
        <>
          <div className="flex flex-col gap-2">
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
                value={date?.toISOString().split("T")[0] || ""}
                onChange={({ target }) =>
                  setDate(target.value ? new Date(target.value) : null)
                }
              />
            </div>
          </div>
          <hr className="text-gray-500" />
          <ModalSheetScroller draggableAt="top">
            <div className="p-4 space-y-4">
              {displayedSearchResults?.churches?.map((church) => (
                <ChurchTile key={church.uuid} church={church} />
              ))}
            </div>
          </ModalSheetScroller>
        </>
      )}
    </ModalSheetContainer>
  );
}

export default ModalSheet;
