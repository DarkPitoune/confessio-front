import { Sheet, SheetRef } from "react-modal-sheet";
import { components } from "@/types";
import { useRef } from "react";

export function ModalSheet({
  searchResults
}: {
  searchResults: components["schemas"]["SearchResult"] | undefined;
}) {
  const sheetRef = useRef<SheetRef>(null);

  return (
    <Sheet
      isOpen
      ref={sheetRef}
      snapPoints={[-30, 0.2]}
      initialSnap={1}
      dragCloseThreshold={1}
      onClose={() => sheetRef.current?.snapTo(1)}
    >
      <Sheet.Container>
        <Sheet.Header />
        <Sheet.Content>
          <Sheet.Scroller draggableAt="both">
            <div className="px-6 py-4 space-y-4">
              {searchResults?.churches?.map((item) => (
                <div
                  key={item.uuid}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600">{item.address}</p>
                </div>
              ))}
            </div>
          </Sheet.Scroller>
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
}

export default ModalSheet;
