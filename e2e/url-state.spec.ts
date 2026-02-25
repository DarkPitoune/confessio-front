import { test, expect } from "./fixtures/test-fixtures";
import {
  waitForMapReady,
  panMap,
  buildUrlWithBounds,
} from "./helpers/leaflet";
import { expectUrlBounds, expectUrlDate, expectUrlPath } from "./helpers/url";
import { CHURCH_UUID_1 } from "./fixtures/api-responses";

test.describe("URL state management", () => {
  test("bounds format is 4 comma-separated floats", async ({
    page,
    mockApi,
  }) => {
    await mockApi();
    await page.goto("/");
    await waitForMapReady(page);

    // Wait for bounds to appear in URL
    await expect(async () => {
      const url = new URL(page.url());
      const bounds = url.searchParams.get("bounds");
      expect(bounds).not.toBeNull();

      const parts = bounds!.split(",");
      expect(parts).toHaveLength(4);

      // Each part should be a valid float
      for (const part of parts) {
        expect(Number.isFinite(parseFloat(part))).toBe(true);
      }
    }).toPass({ timeout: 5_000 });
  });

  test("history.replaceState does not create browser history entries", async ({
    page,
    mockApi,
  }) => {
    await mockApi();
    const url = buildUrlWithBounds("/", 48.84, 2.32, 48.86, 2.35);
    await page.goto(url);
    await waitForMapReady(page);

    // Pan the map 3 times to trigger 3 replaceState calls
    await panMap(page, 100, 0);
    await panMap(page, 100, 0);
    await panMap(page, 100, 0);

    // Going back should leave the page entirely (go to about:blank or previous page)
    // since replaceState doesn't create history entries
    await page.goBack();

    // The URL should NOT be the same origin (we left the page)
    await expect(async () => {
      const currentUrl = page.url();
      // After going back from a page with only replaceState calls,
      // we should be at about:blank or a different origin
      expect(currentUrl).not.toContain("localhost:3000");
    }).toPass({ timeout: 5_000 });
  });

  test("bounds and date preserved on church navigation and back", async ({
    page,
    mockApi,
  }) => {
    await mockApi();
    const bounds = { south: 48.84, west: 2.32, north: 48.86, east: 2.35 };
    const url = buildUrlWithBounds("/", bounds.south, bounds.west, bounds.north, bounds.east, {
      date: "2026-03-15",
    });
    await page.goto(url);
    await waitForMapReady(page);

    // Wait for tiles to load
    const tileLink = page.locator('a[href^="/church/"]');
    await expect(tileLink.first()).toBeVisible({ timeout: 10_000 });

    // Navigate to church detail
    await tileLink.first().click();
    await expectUrlPath(page, /^\/church\//);

    // Bounds and date should still be in URL
    await expectUrlBounds(page, bounds);
    await expectUrlDate(page, "2026-03-15");

    // Go back
    await page.goBack();
    await expectUrlPath(page, "/");

    // Both params should be preserved
    await expectUrlBounds(page, bounds);
    await expectUrlDate(page, "2026-03-15");
  });

  test("direct URL navigation with all params works", async ({
    page,
    mockApi,
  }) => {
    await mockApi();
    const bounds = { south: 48.84, west: 2.32, north: 48.86, east: 2.35 };
    const url = buildUrlWithBounds(
      `/church/${CHURCH_UUID_1}`,
      bounds.south,
      bounds.west,
      bounds.north,
      bounds.east,
      { date: "2026-03-15" },
    );
    await page.goto(url);
    await waitForMapReady(page);

    // Church detail should render
    await expect(page.locator("h3").first()).toBeVisible({ timeout: 5_000 });

    // All params should be in URL
    await expectUrlBounds(page, bounds);
    await expectUrlDate(page, "2026-03-15");
    await expectUrlPath(page, `/church/${CHURCH_UUID_1}`);
  });
});
