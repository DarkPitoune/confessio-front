import { components } from "@/types";
import { useRef, useState } from "react";
import { Sheet, SheetRef } from "react-modal-sheet";
import "./ModalSheet.css";

export function ModalSheet({
  searchResults,
}: {
  searchResults: components["schemas"]["SearchResult"] | undefined;
}) {
  const sheetRef = useRef<SheetRef>(null);
  const [selectedChurch, setSelectedChurch] = useState<
    components["schemas"]["SearchResult"]["churches"][number] | undefined
  >(undefined);

  return (
    <Sheet
      isOpen
      ref={sheetRef}
      snapPoints={[0.5, 140]}
      initialSnap={1}
      dragCloseThreshold={1}
      onClose={() => sheetRef.current?.snapTo(1)}
    >
      <Sheet.Container>
        <Sheet.Header />
        <Sheet.Content>
          {selectedChurch ? (
            <>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {selectedChurch.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedChurch.address}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-white">
                Horaires de confession proche de vous
              </div>
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
