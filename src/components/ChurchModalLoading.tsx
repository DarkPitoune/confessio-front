"use client";

import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import ModalSheet from "./ModalSheet";
import { AggregatedSearchResults } from "@/utils";
import { components } from "@/types";

type ChurchDetails = components["schemas"]["ChurchDetails"];
type KnownChurch = AggregatedSearchResults["churches"][number];

// Look up everything we already know about a church on the client, by uuid:
// first the per-uuid entry seeded on marker pointerdown (and any completed
// detail fetch), then a scan of the live search-results queries. Used to
// optimistically render the modal header before the full details arrive.
const findKnownChurch = (
  qc: QueryClient,
  uuid: string,
): KnownChurch | ChurchDetails | undefined => {
  const seeded = qc.getQueryData<ChurchDetails>(["churchDetails", uuid]);
  if (seeded) return seeded;
  for (const [, data] of qc.getQueriesData<AggregatedSearchResults>({
    queryKey: ["churches"],
  })) {
    const hit = data?.churches.find((c) => c.uuid === uuid);
    if (hit) return hit;
  }
  return undefined;
};

// Instant loading boundary for the intercepted church modal. Shown the moment
// a pin is clicked while the server component fetches full details. It renders
// the same ModalSheet/ChurchCard shell pre-filled with the lightweight church
// we already hold, so there is no layout shift when page.tsx commits.
export default function ChurchModalLoading() {
  const pathname = usePathname();
  const uuid = pathname?.match(/\/church\/([^/]+)/)?.[1];
  const queryClient = useQueryClient();

  const known = uuid ? findKnownChurch(queryClient, uuid) : undefined;

  // A partial (ChurchOut) lacks schedules/website, so ChurchCard's
  // `"schedules" in church` initialData guard stays false and its schedule
  // area spins until the full ChurchDetails resolves. When nothing is known
  // (deep link / panned-away church), fall back to a placeholder so the header
  // renders empty and only fills in once the real page commits.
  const optimisticChurch = (known ?? {
    uuid: uuid ?? "",
    name: "",
    latitude: 0,
    longitude: 0,
    address: null,
    zipcode: null,
    city: null,
    events: [],
  }) as ChurchDetails;

  return <ModalSheet selectedChurch={optimisticChurch} />;
}
