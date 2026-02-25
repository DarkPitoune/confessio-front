import { test, expect } from "./fixtures/test-fixtures";
import {
  waitForMapReady,
  panMap,
  getChurchMarkers,
  getAggregationMarkers,
  buildUrlWithBounds,
} from "./helpers/leaflet";
import { expectUrlBounds, expectUrlPath } from "./helpers/url";
import { makeAggregationResult } from "./fixtures/api-responses";

test.describe("Map navigation", () => {
  test("map loads with default Paris bounds", async ({ page }) => {
    await page.goto("/");
    await waitForMapReady(page);

    await expect(page.locator(".leaflet-container")).toBeVisible();
  });

  test("map loads with custom bounds from URL", async ({ page }) => {
    const url = buildUrlWithBounds("/", 48.84, 2.32, 48.86, 2.35);
    await page.goto(url);
    await waitForMapReady(page);

    await expectUrlBounds(page, {
      south: 48.84,
      west: 2.32,
      north: 48.86,
      east: 2.35,
    });
  });

  test("dragging map updates URL bounds via history.replaceState", async ({
    page,
    mockApi,
  }) => {
    await mockApi();
    const url = buildUrlWithBounds("/", 48.84, 2.32, 48.86, 2.35);
    await page.goto(url);
    await waitForMapReady(page);

    // Capture initial bounds
    const initialUrl = new URL(page.url());
    const initialBounds = initialUrl.searchParams.get("bounds");

    // Pan the map 200px to the right
    await panMap(page, 200, 0);

    // Bounds should have changed
    await expect(async () => {
      const currentUrl = new URL(page.url());
      const currentBounds = currentUrl.searchParams.get("bounds");
      expect(currentBounds).not.toBeNull();
      expect(currentBounds).not.toBe(initialBounds);
    }).toPass({ timeout: 5_000 });
  });

  test("church markers appear as DOM elements", async ({ page, mockApi }) => {
    await mockApi();
    const url = buildUrlWithBounds("/", 48.84, 2.32, 48.86, 2.35);
    await page.goto(url);
    await waitForMapReady(page);

    // Wait for client-side refetch to render markers
    await expect(getChurchMarkers(page).first()).toBeVisible({ timeout: 10_000 });
  });

  test("clicking church marker navigates to /church/[uuid]", async ({
    page,
    mockApi,
  }) => {
    await mockApi();
    const url = buildUrlWithBounds("/", 48.84, 2.32, 48.86, 2.35);
    await page.goto(url);
    await waitForMapReady(page);

    // Wait for markers to appear
    await expect(getChurchMarkers(page).first()).toBeVisible({ timeout: 10_000 });

    // Click the first church marker
    await getChurchMarkers(page).first().click();

    await expectUrlPath(page, /^\/church\//);
  });

  test("aggregation markers show count and clicking zooms in", async ({
    page,
    mockApi,
  }) => {
    await mockApi({ searchResult: makeAggregationResult() });
    const url = buildUrlWithBounds("/", 48.84, 2.32, 48.86, 2.35);
    await page.goto(url);
    await waitForMapReady(page);

    // Wait for aggregation markers
    const markers = getAggregationMarkers(page);
    await expect(markers.first()).toBeVisible({ timeout: 10_000 });

    // Verify the marker shows a count
    await expect(markers.first()).toContainText("15");

    // Capture bounds before click
    const beforeUrl = new URL(page.url());
    const beforeBounds = beforeUrl.searchParams.get("bounds");

    // Click the aggregation marker to zoom in
    await markers.first().click();

    // Bounds should change (zoom tighter)
    await expect(async () => {
      const afterUrl = new URL(page.url());
      const afterBounds = afterUrl.searchParams.get("bounds");
      expect(afterBounds).not.toBeNull();
      expect(afterBounds).not.toBe(beforeBounds);
    }).toPass({ timeout: 5_000 });
  });
});
