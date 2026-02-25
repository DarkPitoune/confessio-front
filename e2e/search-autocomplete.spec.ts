import { test, expect } from "./fixtures/test-fixtures";
import { waitForMapReady, buildUrlWithBounds } from "./helpers/leaflet";
import { expectUrlPath } from "./helpers/url";
import { CHURCH_UUID_1 } from "./fixtures/api-responses";

const SEARCH_INPUT = 'input[placeholder="Chercher une église ou une ville"]';
const RESULT_BUTTONS = "ul li button";
const CHURCH_ICON = 'img[alt="Église"]';
const CITY_ICON = 'img[alt="Ville"]';
const CLEAR_BUTTON = 'button[aria-label="Clear search"]';

test.describe("Search autocomplete", () => {
  test.beforeEach(async ({ page, mockApi }) => {
    await mockApi();
    const url = buildUrlWithBounds("/", 48.84, 2.32, 48.86, 2.35);
    await page.goto(url);
    await waitForMapReady(page);
  });

  test("typing shows autocomplete results after debounce", async ({
    page,
  }) => {
    const input = page.locator(SEARCH_INPUT);
    await input.fill("Saint");

    // Wait for debounce and results to appear
    await expect(page.locator(RESULT_BUTTONS).first()).toBeVisible({
      timeout: 5_000,
    });

    // Both church and city icons should be present
    await expect(page.locator(CHURCH_ICON).first()).toBeVisible();
    await expect(page.locator(CITY_ICON).first()).toBeVisible();
  });

  test("clicking church result updates input value to church name", async ({
    page,
  }) => {
    const input = page.locator(SEARCH_INPUT);
    await input.fill("Saint");

    // Wait for results
    await expect(page.locator(RESULT_BUTTONS).first()).toBeVisible({
      timeout: 5_000,
    });

    // Find and click the church result (has church icon)
    const churchResult = page
      .locator("ul li")
      .filter({ has: page.locator(CHURCH_ICON) })
      .locator("button");
    await churchResult.first().click();

    // Input should update to the church name
    await expect(input).toHaveValue("Saint-Sulpice");
  });

  test("clicking municipality result updates input value", async ({
    page,
  }) => {
    const input = page.locator(SEARCH_INPUT);
    await input.fill("Saint");

    await expect(page.locator(RESULT_BUTTONS).first()).toBeVisible({
      timeout: 5_000,
    });

    // Find and click the municipality result (has city icon)
    const cityResult = page
      .locator("ul li")
      .filter({ has: page.locator(CITY_ICON) })
      .locator("button");
    await cityResult.first().click();

    await expect(input).toHaveValue("Saint-Germain-en-Laye");
  });

  test("clear button resets search", async ({ page }) => {
    const input = page.locator(SEARCH_INPUT);
    await input.fill("Saint");

    // Wait for results
    await expect(page.locator(RESULT_BUTTONS).first()).toBeVisible({
      timeout: 5_000,
    });

    // Click clear button
    await page.locator(CLEAR_BUTTON).click();

    // Input should be empty
    await expect(input).toHaveValue("");

    // Results should be hidden
    await expect(page.locator(RESULT_BUTTONS)).toBeHidden();
  });

  test("results hide on blur when clicking the map", async ({ page }) => {
    const input = page.locator(SEARCH_INPUT);
    await input.fill("Saint");

    await expect(page.locator(RESULT_BUTTONS).first()).toBeVisible({
      timeout: 5_000,
    });

    // Click on the map to blur the input
    await page.locator(".leaflet-container").click({ position: { x: 100, y: 100 } });

    // Results should be hidden
    await expect(page.locator(RESULT_BUTTONS)).toBeHidden();
  });

  test("typing on church detail page navigates back to home", async ({
    page,
  }) => {
    // Navigate to a church detail page
    const url = buildUrlWithBounds(
      `/church/${CHURCH_UUID_1}`,
      48.84,
      2.32,
      48.86,
      2.35,
    );
    await page.goto(url);
    await waitForMapReady(page);

    const input = page.locator(SEARCH_INPUT);
    await input.fill("Saint");

    // Should navigate back to home
    await expectUrlPath(page, "/");
  });
});
