import ModalSheetWrapper from "@/components/ModalSheet/ModalSheetWrapper";

// Shown instantly during client-side navigation while the server component streams.
// Pass a placeholder UUID so the sheet shows the loading spinner state.
export default function ChurchModalLoading() {
  return <ModalSheetWrapper selectedChurchUuid="loading" />;
}
