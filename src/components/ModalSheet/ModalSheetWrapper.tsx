"use client";

import { Suspense } from "react";
import ModalSheet from "../ModalSheet";
import { AggregatedSearchResults } from "@/utils";
import { components } from "@/types";

function ModalSheetWrapper({
  selectedChurchUuid,
  initialChurchDetails,
  initialSearchResults,
}: {
  selectedChurchUuid?: string;
  initialChurchDetails?: components["schemas"]["ChurchDetails"];
  initialSearchResults?: AggregatedSearchResults | null;
}) {
  return (
    <Suspense fallback={null}>
      <ModalSheet
        selectedChurchUuid={selectedChurchUuid}
        initialChurchDetails={initialChurchDetails}
        initialSearchResults={initialSearchResults}
      />
    </Suspense>
  );
}

export default ModalSheetWrapper;
