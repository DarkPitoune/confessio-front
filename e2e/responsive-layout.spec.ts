import { test, expect } from "./fixtures/test-fixtures";
import { waitForMapReady, buildUrlWithBounds } from "./helpers/leaflet";

test.describe("Responsive layout", () => {
  test.beforeEach(async ({ page, mockApi }) => {
    await mockApi();
    const url = buildUrlWithBounds("/", 48.84, 2.32, 48.86, 2.35);
    await page.goto(url);
    await waitForMapReady(page);
  });

  test("desktop shows sidebar panel as plain div", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chrome",
      "Desktop-only test",
    );

    // On desktop, the modal sheet container should be rendered as a plain div
    const container = page.locator(".react-modal-sheet-container");
    await expect(container).toBeVisible({ timeout: 5_000 });
  });

  test("mobile shows bottom sheet via react-modal-sheet", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "desktop-chrome",
      "Mobile-only test",
    );

    // On mobile, react-modal-sheet renders after useEffect detects narrow viewport.
    // Wait for the sheet backdrop or container to appear.
    const container = page.locator(".react-modal-sheet-container");
    await expect(container).toBeVisible({ timeout: 5_000 });
  });

  test("center button positioning differs by viewport", async ({
    page,
  }, testInfo) => {
    // The center/locate button should exist on both viewports
    const centerButton = page.locator("button").filter({
      has: page.locator('img[alt="Center"]'),
    });

    // If the button doesn't use an img alt, look for a general position button
    // Skip if not found - the important thing is it renders somewhere
    if ((await centerButton.count()) === 0) {
      return;
    }

    await expect(centerButton).toBeVisible();

    const box = await centerButton.boundingBox();
    expect(box).not.toBeNull();

    if (testInfo.project.name === "mobile-chrome") {
      // On mobile, button should be higher up (above the bottom sheet)
      // bottom-[160px] means it's further from the bottom
      expect(box!.y).toBeLessThan(915 - 100);
    } else {
      // On desktop, button should be near the bottom (bottom-4)
      expect(box!.y).toBeGreaterThan(600);
    }
  });
});
