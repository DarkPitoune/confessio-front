import type { components } from "../../src/types";

type SearchResult = components["schemas"]["SearchResult"];
type ChurchDetails = components["schemas"]["ChurchDetails"];
type AutocompleteItem = components["schemas"]["AutocompleteItem"];
type ChurchOut = components["schemas"]["ChurchOut"];
type WebsiteOut = components["schemas"]["WebsiteOut"];
type EventOut = components["schemas"]["EventOut"];
type AggregationOut = components["schemas"]["AggregationOut"];
type ScheduleOut = components["schemas"]["ScheduleOut"];

/**
 * Returns a future ISO date string relative to now.
 */
export function futureDate(
  daysFromNow: number,
  hours: number,
  minutes: number,
): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

const CHURCH_UUID_1 = "11111111-1111-1111-1111-111111111111";
const CHURCH_UUID_2 = "22222222-2222-2222-2222-222222222222";
const WEBSITE_UUID_1 = "aaaa1111-1111-1111-1111-111111111111";
const WEBSITE_UUID_2 = "aaaa2222-2222-2222-2222-222222222222";

/**
 * Creates a mock search result with 2 churches, their websites with events,
 * and no aggregations by default.
 */
export function makeSearchResult(
  overrides?: Partial<SearchResult>,
): SearchResult {
  const churches: ChurchOut[] = [
    {
      uuid: CHURCH_UUID_1,
      name: "Eglise Saint-Sulpice",
      latitude: 48.8511,
      longitude: 2.3346,
      address: "2 Rue Palatine",
      zipcode: "75006",
      city: "Paris",
      website_uuid: WEBSITE_UUID_1,
    },
    {
      uuid: CHURCH_UUID_2,
      name: "Eglise Notre-Dame des Champs",
      latitude: 48.8453,
      longitude: 2.3284,
      address: "91 Boulevard du Montparnasse",
      zipcode: "75006",
      city: "Paris",
      website_uuid: WEBSITE_UUID_2,
    },
  ];

  const events1: EventOut[] = [
    {
      church_uuid: CHURCH_UUID_1,
      is_church_explicitly_other: false,
      start: futureDate(1, 14, 30),
      end: futureDate(1, 16, 0),
      source_has_been_moderated: true,
    },
    {
      church_uuid: CHURCH_UUID_1,
      is_church_explicitly_other: false,
      start: futureDate(3, 10, 0),
      end: futureDate(3, 11, 30),
      source_has_been_moderated: true,
    },
  ];

  const events2: EventOut[] = [
    {
      church_uuid: CHURCH_UUID_2,
      is_church_explicitly_other: false,
      start: futureDate(2, 9, 0),
      end: null,
      source_has_been_moderated: false,
    },
  ];

  const websites: WebsiteOut[] = [
    {
      uuid: WEBSITE_UUID_1,
      name: "Paroisse Saint-Sulpice",
      events: events1,
      has_more_events: false,
      reports_count: [],
    },
    {
      uuid: WEBSITE_UUID_2,
      name: "Paroisse Notre-Dame des Champs",
      events: events2,
      has_more_events: false,
      reports_count: [],
    },
  ];

  const aggregations: AggregationOut[] = [];

  return {
    churches,
    websites,
    aggregations,
    ...overrides,
  };
}

/**
 * Creates a mock search result that contains only aggregations (no individual churches).
 */
export function makeAggregationResult(): SearchResult {
  return {
    churches: [],
    websites: [],
    aggregations: [
      {
        type: "municipality",
        name: "Paris 6e",
        church_count: 15,
        centroid_latitude: 48.849,
        centroid_longitude: 2.332,
        min_latitude: 48.845,
        max_latitude: 48.855,
        min_longitude: 2.325,
        max_longitude: 2.34,
      },
    ],
  };
}

/**
 * Creates mock church details for a given UUID.
 */
export function makeChurchDetails(
  uuid: string,
): ChurchDetails {
  const schedules: ScheduleOut[] = [
    {
      explanation: "Le samedi de 10h00 a 12h00",
      parsing_uuids: ["parse-uuid-1"],
    },
    {
      explanation: "Le mercredi de 16h00 a 18h00",
      parsing_uuids: ["parse-uuid-2"],
    },
  ];

  return {
    uuid,
    name: "Eglise Saint-Sulpice",
    latitude: 48.8511,
    longitude: 2.3346,
    address: "2 Rue Palatine",
    zipcode: "75006",
    city: "Paris",
    website_uuid: WEBSITE_UUID_1,
    schedules,
  };
}

/**
 * Creates mock autocomplete results: 1 church + 1 municipality.
 */
export function makeAutocompleteResults(): AutocompleteItem[] {
  return [
    {
      type: "church",
      name: "Saint-Sulpice",
      context: "Paris 6e",
      url: `/church/${CHURCH_UUID_1}`,
      latitude: 48.8511,
      longitude: 2.3346,
    },
    {
      type: "municipality",
      name: "Saint-Germain-en-Laye",
      context: "Yvelines",
      url: "/municipality/saint-germain-en-laye",
      latitude: 48.8986,
      longitude: 2.0935,
    },
  ];
}

export { CHURCH_UUID_1, CHURCH_UUID_2, WEBSITE_UUID_1, WEBSITE_UUID_2 };
