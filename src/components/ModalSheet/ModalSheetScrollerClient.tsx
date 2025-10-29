import { Sheet } from "react-modal-sheet";

function ModalSheetScrollerClient({ children }: { children: React.ReactNode }) {
  return <Sheet.Scroller>{children}</Sheet.Scroller>;
}

export default ModalSheetScrollerClient;
