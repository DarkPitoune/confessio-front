import ModalSheetWrapper from "@/components/ModalSheet/ModalSheetWrapper";
import {
  fetchChurchesWithWebsites,
  fetchDioceseBySlug,
  dioceseToBounds,
} from "@/utils";

export const dynamic = "force-dynamic";

export default async function DiocesModalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const diocese = await fetchDioceseBySlug(slug);

  if (!diocese) {
    return <ModalSheetWrapper originalSearchResults={{ aggregations: [], churches: [] }} />;
  }

  const bounds = dioceseToBounds(diocese);
  const initialSearchResults = await fetchChurchesWithWebsites({
    min_lat: bounds.south,
    max_lat: bounds.north,
    min_lng: bounds.west,
    max_lng: bounds.east,
  });

  return <ModalSheetWrapper originalSearchResults={initialSearchResults} />;
}
