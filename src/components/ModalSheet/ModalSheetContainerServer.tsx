function ModalSheetContainerServer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute top-[74px] bottom-0 z-[700] w-[500px] px-4 pb-4 flex flex-col">
      <div className="react-modal-sheet-container flex flex-col min-h-0 pt-3">
        {children}
      </div>
    </div>
  );
}

export default ModalSheetContainerServer;
