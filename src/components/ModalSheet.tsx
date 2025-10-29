import { selectedChurchAtom, setSelectedChurchAtom } from "@/store/atoms";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { SheetRef } from "react-modal-sheet";
import { ChurchCard } from "./ChurchCard";
import ModalSheetContainer from "./ModalSheet/ModalSheetContainer";
import ModalSheetScroller from "./ModalSheet/ModalSheetScroller";
import { AggregatedSearchResults } from "@/utils";

function ModalSheet({
  searchResults,
}: {
  searchResults:AggregatedSearchResults | null|undefined 
}) {
  const [selectedChurch] = useAtom(selectedChurchAtom);
  const [, setSelectedChurch] = useAtom(setSelectedChurchAtom);
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
            <input type="date" className="w-full" />
          </div>
          <hr className="text-gray-500" />
          <ModalSheetScroller draggableAt="top">
          <div className="px-6 py-4 space-y-4">
            {searchResults?.churches?.map((item) => (
              <button
                onClick={() => setSelectedChurch(item)}
                key={item.uuid}
                className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.address}</p>
              </button>
            ))}
          </div>
        </ModalSheetScroller>
        </>
      )}
    </ModalSheetContainer>
  );
}

export default ModalSheet;
