import { dateFilterAtom, selectedChurchAtom } from "@/store/atoms";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { SheetRef } from "react-modal-sheet";
import { ChurchCard } from "./ChurchCard";
import ModalSheetContainer from "./ModalSheet/ModalSheetContainer";
import ModalSheetScroller from "./ModalSheet/ModalSheetScroller";
import { AggregatedSearchResults } from "@/utils";
import ChurchTile from "./ChurchTile";

function ModalSheet({
  searchResults,
}: {
  searchResults: AggregatedSearchResults | null | undefined;
}) {
  const [selectedChurch] = useAtom(selectedChurchAtom);
  const [dateFilterValue, setDateFilterValue] = useAtom(dateFilterAtom);
  const sheetRef = useRef<SheetRef>(null);

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
                value={dateFilterValue}
                onChange={({ target }) => setDateFilterValue(target.value)}
              />
            </div>
          </div>
          <hr className="text-gray-500" />
          <ModalSheetScroller draggableAt="top">
            <div className="p-4 space-y-4">
              {searchResults?.churches?.map((church) => (
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
