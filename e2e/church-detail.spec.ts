import { test, expect } from "./fixtures/test-fixtures";
import { waitForMapReady, buildUrlWithBounds } from "./helpers/leaflet";
import { expectUrlPath, expectUrlBounds } from "./helpers/url";
import { CHURCH_UUID_1 } from "./fixtures/api-responses";

const TILE_LINK = 'a[href^="/church/"]';
const CLOSE_BUTTON = 'img[alt="Close"]';
const GOOGLE_MAPS_LINK = 'a[href*="google.com/maps"]';

test.describe("Church detail", () => {
  test("clicking tile navigates to detail with church name visible", async ({
    page,
    mockApi,
  }) => {
    await mockApi();
    const url = buildUrlWithBounds("/", 48.84, 2.32, 48.86, 2.35);
    await page.goto(url);
    await waitForMapReady(page);

    // Wait for church tiles to appear
    await expect(page.locator(TILE_LINK).first()).toBeVisible({
      timeout: 10_000,
    });

    // Click the first church tile
    await page.locator(TILE_LINK).first().click();

    // URL should match /church/
    await expectUrlPath(page, /^\/church\//);

    // Church name heading should be visible
    await expect(page.locator("h3").first()).toBeVisible({ timeout: 5_000 });
  });

  test("detail shows schedules", async ({ page, mockApi }) => {
    await mockApi();
    const url = buildUrlWithBounds(
      `/church/${CHURCH_UUID_1}`,
      48.84,
      2.32,
      48.86,
      2.35,
    );
    await page.goto(url);
    await waitForMapReady(page);

    // Schedule entries should be visible as list items
    await expect(page.locator("ul.list-disc li").first()).toBeVisible({
      timeout: 5_000,
    });

    // There should be 2 schedule entries
    await expect(page.locator("ul.list-disc li")).toHaveCount(2);
  });

  test("detail shows Google Maps link with destination", async ({
    page,
    mockApi,
  }) => {
    await mockApi();
    const url = buildUrlWithBounds(
      `/church/${CHURCH_UUID_1}`,
      48.84,
      2.32,
      48.86,
      2.35,
    );
    await page.goto(url);
    await waitForMapReady(page);

    const gmapsLink = page.locator(GOOGLE_MAPS_LINK);
    await expect(gmapsLink).toBeVisible({ timeout: 5_000 });

    const href = await gmapsLink.getAttribute("href");
    expect(href).toContain("destination=");
  });

  test("close button returns to list with bounds preserved", async ({
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
    );
    await page.goto(url);
    await waitForMapReady(page);

    // Click close button
    const closeLink = page.locator("a").filter({ has: page.locator(CLOSE_BUTTON) });
    await expect(closeLink).toBeVisible({ timeout: 5_000 });
    await closeLink.click();

    // Should navigate back to list
    await expectUrlPath(page, "/");

    // Bounds should be preserved
    await expectUrlBounds(page, bounds);
  });

  test("deep link to /church/[uuid] with bounds works", async ({
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
    );
    await page.goto(url);
    await waitForMapReady(page);

    // Church detail should render
    await expect(page.locator("h3").first()).toBeVisible({ timeout: 5_000 });

    // Bounds should be in URL
    await expectUrlBounds(page, bounds);
  });
});
