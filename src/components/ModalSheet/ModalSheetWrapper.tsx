"use client";

import { Suspense } from "react";
import ModalSheet from "../ModalSheet";
import { AggregatedSearchResults } from "@/utils";
import { components } from "@/types";

function ModalSheetWrapper({
  originalSearchResults,
  selectedChurchUuid,
  serverChurchData,
}: {
  originalSearchResults?: AggregatedSearchResults | null | undefined;
  selectedChurchUuid?: string;
  serverChurchData?: components["schemas"]["ChurchDetails"];
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ModalSheet
        originalSearchResults={originalSearchResults}
        selectedChurchUuid={selectedChurchUuid}
        serverChurchData={serverChurchData}
      />
    </Suspense>
  );
}

export default ModalSheetWrapper;
