import ModalSheetWrapper from "@/components/ModalSheet/ModalSheetWrapper";
import { fetchChurchesWithWebsites, parseBoundsParam } from "@/utils";

// The list depends on map bounds + date params from the URL — render
// per-request so the SSR HTML always reflects the requested area.
export const dynamic = "force-dynamic";

export default async function ModalDefault({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { bounds: boundsParam, date: dateParam } = await searchParams;
  const bounds = parseBoundsParam(
    Array.isArray(boundsParam) ? boundsParam[0] ?? null : boundsParam ?? null,
  );
  const rawDate = Array.isArray(dateParam) ? dateParam[0] : dateParam;
  const dateFilter = rawDate ? rawDate.split("T")[0] ?? null : null;

  const initialSearchResults = bounds
    ? await fetchChurchesWithWebsites({
        min_lat: bounds.south,
        max_lat: bounds.north,
        min_lng: bounds.east,
        max_lng: bounds.west,
        date_filter: dateFilter ?? undefined,
      })
    : null;

  return (
    <ModalSheetWrapper initialSearchResults={initialSearchResults} />
  );
}
