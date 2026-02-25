import { test, expect } from "@playwright/test";
import { waitForMapReady } from "./helpers/leaflet";

const SEARCH_INPUT = 'input[placeholder="Chercher une église ou une ville"]';

/**
 * Smoke tests that hit the real API without mocking.
 * Run separately with: pnpm test --grep @smoke
 */
test.describe("@smoke Live API validation", () => {
  test("homepage loads with real Paris data and shows church tiles", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForMapReady(page);

    // Church tiles should appear from real API data
    const tileLink = page.locator('a[href^="/church/"]');
    await expect(tileLink.first()).toBeVisible({ timeout: 15_000 });
  });

  test("autocomplete returns results for 'Paris'", async ({ page }) => {
    await page.goto("/");
    await waitForMapReady(page);

    const input = page.locator(SEARCH_INPUT);
    await input.fill("Paris");

    // Wait for autocomplete results to appear
    const results = page.locator("ul li button");
    await expect(results.first()).toBeVisible({ timeout: 10_000 });

    // Should have at least one result
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });
});
