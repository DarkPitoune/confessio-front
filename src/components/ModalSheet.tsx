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
            <h4 className="text-base font-semibold text-white px-4">
              Horaires de confession proches de vous
            </h4>
            <input
              type="date"
              className="w-full"
              value={dateFilterValue}
              onChange={({ target }) => setDateFilterValue(target.value)}
            />
          </div>
          <hr className="text-gray-500" />
          <ModalSheetScroller draggableAt="top">
            <div className="px-6 py-4 space-y-4">
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
