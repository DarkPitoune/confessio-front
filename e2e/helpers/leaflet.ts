import { type Page } from "@playwright/test";

/**
 * Waits for the Leaflet map to be ready: container visible and at least one tile loaded.
 */
export async function waitForMapReady(page: Page): Promise<void> {
  await page.locator(".leaflet-container").waitFor({ state: "visible" });
  await page
    .locator(".leaflet-tile-loaded")
    .first()
    .waitFor({ state: "attached", timeout: 15_000 });
}

/**
 * Pans the map by dragging from center by (dx, dy) pixels in 10 incremental steps.
 * This triggers Leaflet's native moveend event.
 */
export async function panMap(
  page: Page,
  dx: number,
  dy: number,
): Promise<void> {
  const container = page.locator(".leaflet-container");
  const box = await container.boundingBox();
  if (!box) throw new Error("Map container not found");

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const steps = 10;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      startX + (dx * i) / steps,
      startY + (dy * i) / steps,
    );
  }
  await page.mouse.up();

  // Wait a tick for Leaflet moveend to fire and replaceState to update URL
  await page.waitForTimeout(500);
}

/**
 * Returns a locator for all church marker elements on the map.
 */
export function getChurchMarkers(page: Page) {
  return page.locator(".church-marker");
}

/**
 * Returns a locator for all aggregation marker elements on the map.
 */
export function getAggregationMarkers(page: Page) {
  return page.locator(".aggregation-marker-count");
}

/**
 * Builds a URL string with bounds query parameter.
 */
export function buildUrlWithBounds(
  path: string,
  south: number,
  west: number,
  north: number,
  east: number,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams({
    bounds: `${south},${west},${north},${east}`,
    ...extraParams,
  });
  return `${path}?${params.toString()}`;
}
