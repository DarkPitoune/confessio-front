import { test as base, type Route } from "@playwright/test";
import {
  makeSearchResult,
  makeAutocompleteResults,
  makeChurchDetails,
} from "./api-responses";
import type { components } from "../../src/types";

type SearchResult = components["schemas"]["SearchResult"];
type ChurchDetails = components["schemas"]["ChurchDetails"];
type AutocompleteItem = components["schemas"]["AutocompleteItem"];

type MockApiOptions = {
  searchResult?: SearchResult;
  autocompleteResults?: AutocompleteItem[];
  churchDetails?: (uuid: string) => ChurchDetails;
};

/**
 * Custom Playwright fixture that provides a `mockApi` function.
 *
 * page.route() only intercepts client-side (browser) fetches, NOT Next.js SSR fetches.
 * This means SSR data comes from the real API, while client-side TanStack Query
 * refetches are intercepted and return mock data.
 */
export const test = base.extend<{ mockApi: (opts?: MockApiOptions) => Promise<void> }>({
  mockApi: async ({ page }, use) => {
    const setupMocks = async (opts?: MockApiOptions) => {
      // Mock search API
      await page.route("**/front/api/search**", async (route: Route) => {
        const body = opts?.searchResult ?? makeSearchResult();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });

      // Mock autocomplete API
      await page.route("**/front/api/autocomplete**", async (route: Route) => {
        const body = opts?.autocompleteResults ?? makeAutocompleteResults();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });

      // Mock church details API
      await page.route("**/front/api/church/**", async (route: Route) => {
        const url = new URL(route.request().url());
        const pathParts = url.pathname.split("/");
        const uuid = pathParts[pathParts.length - 1] ?? "unknown";

        const body = opts?.churchDetails
          ? opts.churchDetails(uuid)
          : makeChurchDetails(uuid);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });
    };

    await use(setupMocks);
  },
});

export { expect } from "@playwright/test";
