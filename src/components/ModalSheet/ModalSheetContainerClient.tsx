import { useRef } from "react";
import { Sheet, SheetRef } from "react-modal-sheet";

function ModalSheetContainerClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const sheetRef = useRef<SheetRef>(null);

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
        <Sheet.Content>{children}</Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
}

export default ModalSheetContainerClient;
