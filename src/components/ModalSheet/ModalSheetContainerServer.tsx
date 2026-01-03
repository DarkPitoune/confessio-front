function ModalSheetContainerServer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute top-[74px] z-30 w-[500px] px-4 pb-4 flex flex-col"
      style={{ maxHeight: "calc(100vh - 74px)" }}
    >
      <div className="react-modal-sheet-container flex flex-col min-h-0 pt-3">
        {children}
      </div>
    </div>
  );
}

export default ModalSheetContainerServer;
