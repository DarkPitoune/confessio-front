import { test, expect } from "./fixtures/test-fixtures";
import { waitForMapReady, buildUrlWithBounds } from "./helpers/leaflet";
import { expectUrlDate, expectUrlPath } from "./helpers/url";

const DATE_INPUT = "#date-filter";
const TILE_LINK = 'a[href^="/church/"]';

test.describe("Date filter", () => {
  test.beforeEach(async ({ page, mockApi }) => {
    await mockApi();
    const url = buildUrlWithBounds("/", 48.84, 2.32, 48.86, 2.35);
    await page.goto(url);
    await waitForMapReady(page);
  });

  test("setting date updates URL with date param", async ({ page }) => {
    await page.locator(DATE_INPUT).fill("2026-03-15");

    await expectUrlDate(page, "2026-03-15");
  });

  test("date triggers refetch with date_filter in request", async ({
    page,
  }) => {
    // Capture the next search API request URL
    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/front/api/search") &&
        req.url().includes("date_filter"),
    );

    await page.locator(DATE_INPUT).fill("2026-03-15");

    const request = await requestPromise;
    expect(request.url()).toContain("date_filter=2026-03-15");
  });

  test("clearing date removes param from URL", async ({ page }) => {
    // First set a date
    await page.locator(DATE_INPUT).fill("2026-03-15");
    await expectUrlDate(page, "2026-03-15");

    // Clear the date
    await page.locator(DATE_INPUT).fill("");

    // Date param should be gone
    await expect(async () => {
      const url = new URL(page.url());
      expect(url.searchParams.has("date")).toBe(false);
    }).toPass({ timeout: 5_000 });
  });

  test("date preserved across church navigation and back", async ({
    page,
  }) => {
    // Set a date
    await page.locator(DATE_INPUT).fill("2026-03-15");
    await expectUrlDate(page, "2026-03-15");

    // Wait for tiles and click one
    await expect(page.locator(TILE_LINK).first()).toBeVisible({
      timeout: 10_000,
    });
    await page.locator(TILE_LINK).first().click();

    // Date should still be in URL on church detail
    await expectUrlPath(page, /^\/church\//);
    await expectUrlDate(page, "2026-03-15");

    // Go back
    await page.goBack();

    // Date should still be preserved
    await expectUrlPath(page, "/");
    await expectUrlDate(page, "2026-03-15");
  });
});
