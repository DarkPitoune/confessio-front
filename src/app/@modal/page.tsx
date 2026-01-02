import { Suspense } from "react";
import ModalSheet from "@/components/ModalSheet";
import { fetchChurchesWithWebsites, parseBoundsParam } from "@/utils";

export default async function ModalDefault({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const bounds = await searchParams.then(({ bounds }: { bounds?: string }) =>
    parseBoundsParam(bounds || null),
  );
  const initialSearchResults = bounds
    ? await fetchChurchesWithWebsites({
        min_lat: bounds.south,
        max_lat: bounds.north,
        min_lng: bounds.east,
        max_lng: bounds.west,
      })
    : { aggregations: [], churches: [] };
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ModalSheet originalSearchResults={initialSearchResults} />
    </Suspense>
  );
}
