import { type Page, expect } from "@playwright/test";

/**
 * Asserts that the URL contains bounds matching the expected values within a tolerance.
 * Uses expect().toPass() for polling since bounds are updated via history.replaceState.
 */
export async function expectUrlBounds(
  page: Page,
  expected: { south: number; west: number; north: number; east: number },
  tolerance = 0.01,
): Promise<void> {
  await expect(async () => {
    const url = new URL(page.url());
    const boundsParam = url.searchParams.get("bounds");
    expect(boundsParam).not.toBeNull();

    const parts = boundsParam!.split(",").map(Number);
    expect(parts).toHaveLength(4);

    const [south, west, north, east] = parts as [
      number,
      number,
      number,
      number,
    ];
    expect(south).toBeCloseTo(expected.south, -Math.log10(tolerance));
    expect(west).toBeCloseTo(expected.west, -Math.log10(tolerance));
    expect(north).toBeCloseTo(expected.north, -Math.log10(tolerance));
    expect(east).toBeCloseTo(expected.east, -Math.log10(tolerance));
  }).toPass({ timeout: 5_000 });
}

/**
 * Asserts that the URL contains the expected date parameter.
 */
export async function expectUrlDate(
  page: Page,
  dateString: string,
): Promise<void> {
  await expect(async () => {
    const url = new URL(page.url());
    expect(url.searchParams.get("date")).toBe(dateString);
  }).toPass({ timeout: 5_000 });
}

/**
 * Asserts that the URL pathname matches the expected path or regex.
 */
export async function expectUrlPath(
  page: Page,
  pathOrRegex: string | RegExp,
): Promise<void> {
  await expect(async () => {
    const url = new URL(page.url());
    if (typeof pathOrRegex === "string") {
      expect(url.pathname).toBe(pathOrRegex);
    } else {
      expect(url.pathname).toMatch(pathOrRegex);
    }
  }).toPass({ timeout: 5_000 });
}
