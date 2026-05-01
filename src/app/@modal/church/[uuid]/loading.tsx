"use client";

import { useParams } from "next/navigation";
import ModalSheetWrapper from "@/components/ModalSheet/ModalSheetWrapper";

export default function Loading() {
  const params = useParams<{ uuid: string }>();
  return <ModalSheetWrapper selectedChurchUuid={params.uuid} />;
}
