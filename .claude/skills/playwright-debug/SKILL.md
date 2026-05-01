---
name: playwright-debug
description: Drive the running dev server with a one-off Playwright script to verify a hypothesis about UI behavior — navigation timing, hydration, render order, click handlers, network sequencing. Use when "I think X is happening" needs to become "I see X happening" and the answer can't be read off the source.
---

# Playwright debug script

Use this when you've made a UI change (or are diagnosing a bug) and need to
**check what actually happens in the browser**, not what you think happens.
Source-reading and `curl` are fine for static SSR output, but anything
involving timing, transitions, render order, click handlers, or "I added
this but can't tell if it fired" needs a real browser.

This is a **debugging tool, not a test**. The script lives for one
investigation, gets you an answer, then gets deleted. If the assertion is
worth keeping as a regression test, port it to `tests/` afterwards — but
don't conflate the two: tests are stable contracts, debug scripts are
disposable instrumentation.

## When to reach for it

- Click → something happens, but you can't tell if it happens at the right
  time. (Was that a 270ms or a 30ms transition? Did the seed land before
  the navigation committed?)
- A render only appears under specific conditions and you want to capture
  the DOM at exact timestamps after an event.
- You want to verify network sequencing — which request fires first, was
  this URL prefetched, did the RSC payload arrive before or after the
  user-visible swap.
- You want to see what `useEffect` / `useQuery` / hydration actually does
  on real navigation, with React 19 / Turbopack timing as it really is.

## When **not** to reach for it

- The question can be answered by `curl` (SSR HTML, response headers, JSON-LD
  presence) — use `curl`, don't spin up a browser.
- The behavior is already covered by `tests/seo.spec.ts` or another existing
  playwright test — extend that test instead.
- You're going to assert on this forever — write a real test in `tests/`,
  not an ad-hoc script.

## Recipe

The setup we already have makes this cheap: `@playwright/test` is a devDep,
`chromium` is installed for the SEO suite, the dev server is the only
prerequisite.

### 1. Make sure the dev server is up

```bash
pnpm dev   # default :3000, falls back to :3001 if busy
```

Check the output for `Local: http://localhost:<port>` and use that port in
the script. Don't hardcode 3000.

### 2. Drop the script at the worktree root

`debug-something.mjs` (or any name with `debug-` prefix so it's obvious it's
disposable). The `@playwright/test` package only resolves from the project
node_modules, so the script must live inside the project, not in `/tmp`.

### 3. Use the canonical skeleton

```js
import { chromium } from "@playwright/test";

const URL = "http://localhost:3000/?bounds=48.78,2.18,48.9,2.48";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

// ── Instrumentation ──────────────────────────────────────────────────
page.on("console", (msg) => console.log(`[browser ${msg.type()}]`, msg.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("request", (req) => {
  // Filter to the URLs you care about — never log every chunk.
  const u = req.url();
  if (u.includes("/front/api/")) console.log(`[req] ${u}`);
});
page.on("response", (res) => {
  if (res.url().includes("/front/api/")) {
    console.log(`[res] ${res.url()} ${res.status()}`);
  }
});

// ── Drive the page ───────────────────────────────────────────────────
console.log(">>> goto", URL);
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector(".church-marker, .empty-church-marker");
console.log(">>> markers visible");

// Snapshot before
const before = await page.evaluate(() => {
  const sheet = document.querySelector(".react-modal-sheet-container");
  return { pathname: location.pathname, html: sheet?.innerHTML?.slice(0, 200) };
});
console.log(">>> BEFORE", before);

// Trigger
const t0 = Date.now();
await page.locator(".church-marker").first().click();
console.log(`>>> clicked (${Date.now() - t0}ms)`);

// Snapshot at +50ms / +200ms / +500ms / +1s / +2s — adjust the
// granularity to the timing you're investigating.
for (const delay of [50, 200, 500, 1000, 2000]) {
  await page.waitForTimeout(delay === 50 ? 50 : 150 /* delta */);
  const snap = await page.evaluate(() => {
    const sheet = document.querySelector(".react-modal-sheet-container");
    return {
      pathname: location.pathname,
      h3: sheet?.querySelector("h3")?.textContent,
      hasSpinner: !!sheet?.querySelector(".animate-spin"),
      hasSchedules: !!sheet?.querySelector(".rounded-xl.bg-paper"),
    };
  });
  console.log(`>>> +${delay}ms`, JSON.stringify(snap));
}

await browser.close();
```

### 4. Run it

```bash
node debug-something.mjs 2>&1 | grep -E "^>>>|^\[req\]|^\[res\]"
```

The grep keeps the output focused on the events you care about. Drop the
filter when something unexpected happens and you need the full noise.

### 5. Delete the script when done

```bash
rm debug-something.mjs
```

If you found something worth asserting on forever, port the assertion to a
new test in `tests/`. Don't commit the debug script.

## Patterns that come up

**Snapshot at fixed offsets after an event.** Use a `for` loop with
`waitForTimeout` between snapshots. Fixed offsets (50/200/500/1000/2000ms)
beat single waits because you see the *progression* — when the loader
appears, when the data lands, when the URL commits.

**Read DOM state via `page.evaluate`.** Cheap and synchronous in the browser.
Always return a small JSON-serialisable object — don't return DOM nodes.

**Watch network with `page.on("request"|"response")`.** Filter aggressively;
Next dev mode emits dozens of HMR/chunk requests you don't care about.
Track timings by stamping `Date.now()` in the request handler and computing
the delta in the response handler.

**Throttle the network** to reproduce slow-connection bugs:

```js
await ctx.route("**/*", (route) =>
  setTimeout(() => route.continue(), 2000)
); // crude 2s-per-request throttle
```

For more realistic profiles, use Chrome DevTools Protocol via
`ctx.newCDPSession(page)` and `Network.emulateNetworkConditions`.

**Spot when navigation committed**, not just when click resolved:

```js
await page.waitForFunction(() => location.pathname.startsWith("/church/"));
```

`page.locator(...).click()` resolves once the DOM event fires, not when
React's transition commits — those are different timings, and confusing
them is the whole reason you're writing the script.

## Lessons from when this saved us

The optimistic-modal feature shipped looking correct: `tsc` clean, build
clean, SEO tests pass, `curl` shows full SSR HTML. User reports that
clicking a marker has a ~500ms delay with no loading state. A 5-minute
playwright script revealed the actual sequence:

```
+50ms   pathname: "/"      h3: <stale>   spinner: false
+200ms  pathname: "/"      h3: <stale>   spinner: false
+500ms  pathname: "/church/UUID"  h3: <church>  spinner: false  schedules: true
```

The pathname not changing for 200ms+ told us the navigation itself was
being held, not that loading.tsx was failing to render. That pointed
straight at the `children` slot still awaiting its `fetchApi` and blocking
the parallel-route transition. One missing `loading.tsx` later, the
problem was solved. We would not have found it from source-reading alone.
