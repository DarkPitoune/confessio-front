import { selectedChurchAtom, setSelectedChurchAtom } from "@/store/atoms";
import { components } from "@/types";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { Sheet, SheetRef } from "react-modal-sheet";
import { ChurchCard } from "./ChurchCard";
import "./ModalSheet.css";

export function ModalSheet({
  searchResults
}: {
  searchResults: components["schemas"]["SearchResult"] | undefined;
}) {
  const [selectedChurch] = useAtom(selectedChurchAtom);
  const [, setSelectedChurch] = useAtom(setSelectedChurchAtom);
  const sheetRef = useRef<SheetRef>(null);

  useEffect(() => {
    if (selectedChurch) sheetRef.current?.snapTo(0);
  }, [selectedChurch]);

  return (
    <Sheet
      isOpen
      ref={sheetRef}
      snapPoints={[0.5, 140]}
      initialSnap={1}
      dragCloseThreshold={1}
      onClose={() => sheetRef.current?.snapTo(1)}
      style={{ zIndex: 30 }}
    >
      <Sheet.Container>
        <Sheet.Header />
        <Sheet.Content>
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
              <Sheet.Scroller draggableAt="top">
                <div className="px-6 py-4 space-y-4">
                  {searchResults?.churches?.map((item) => (
                    <button
                      onClick={() => setSelectedChurch(item)}
                      key={item.uuid}
                      className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900 mb-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">{item.address}</p>
                    </button>
                  ))}
                </div>
              </Sheet.Scroller>
            </>
          )}
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
}

export default ModalSheet;
