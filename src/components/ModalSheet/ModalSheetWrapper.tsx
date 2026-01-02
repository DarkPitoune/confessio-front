"use client";

import { Suspense } from "react";
import ModalSheet from "../ModalSheet";
import { AggregatedSearchResults } from "@/utils";
import { components } from "@/types";

function ModalSheetWrapper({
  originalSearchResults,
  originalSelectedChurch,
}: {
  originalSearchResults?: AggregatedSearchResults | null | undefined;
  originalSelectedChurch?: components["schemas"]["ChurchDetails"];
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ModalSheet
        originalSearchResults={originalSearchResults}
        originalSelectedChurch={originalSelectedChurch}
      />
    </Suspense>
  );
}

export default ModalSheetWrapper;
