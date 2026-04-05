# Gradual Rollout Plan: New Confessio Frontend

## Context

The new frontend (`confessio-bottom-sheet`) will replace the current `confessio.fr`. Before a full cutover, we need a gradual rollout with real user traffic — cookie-based canary routing, a bail-out mechanism, and analytics to measure success. Both frontends share the same backend API at `https://confessio.fr/front/api`.

## Architecture

```
confessio.fr (Vercel, OLD repo)
  └── middleware.ts (Edge Middleware)
        ├── cookie "confessio-variant" == "old"  → serve old frontend
        ├── cookie "confessio-variant" == "new"  → rewrite to new frontend
        └── no cookie → roll dice (CANARY_PERCENT%), set cookie, route accordingly
```

The rewrite is invisible — users always see `confessio.fr` in the URL bar. Both frontends share the domain, so cookies work seamlessly.

---

## Phase 1: Canary Middleware (OLD repo)

**Create `middleware.ts`** in this repo:

- Read `confessio-variant` cookie
- If `"old"` → `NextResponse.next()`
- If `"new"` → `NextResponse.rewrite()` to the new Vercel deployment URL
- If absent → random roll against `CANARY_PERCENT` env var, set sticky cookie (30 days), route
- Must rewrite ALL requests (including `/_next/static/`) for "new" users so assets load correctly
- Exclude only `/front/api/*` from the matcher (backend must not be rewritten)

**Vercel env var (OLD project):** `CANARY_PERCENT = 10`

---

## Phase 2: Bail-Out Banner (NEW repo)

**Create `src/components/CanaryBanner.tsx`**

- Small dismissible banner: *"Vous testez la nouvelle version de Confessio ! [Revenir a l'ancienne version]"*
- On click: set `confessio-variant=old` cookie, fire Umami event `bailout-click`, navigate to `confessio.fr` (triggers middleware, which now sees "old" cookie)
- Dismissible for the session (local state — reappears next visit)

**Modify `src/app/layout.tsx`**

- Add `<CanaryBanner />` to the body

**On the OLD repo (optional):**

- Add a subtle "Essayer la nouvelle version" link that sets `confessio-variant=new` cookie and reloads

---

## Phase 3: Umami Analytics (NEW repo)

**Modify `src/app/layout.tsx`**

- Add Umami tracking script via `next/script`:
  ```tsx
  <Script src="https://umami.pcdhebrail.fr/script.js"
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          strategy="afterInteractive" />
  ```

**Create `src/lib/analytics.ts`**

- Thin typed wrapper around `window.umami.track()`

**Create `src/umami.d.ts`**

- TypeScript declarations for `window.umami`

**Key events to track:**

| Event | Trigger | Why |
|-------|---------|-----|
| `bailout-click` | User clicks "revenir a l'ancienne version" | **Primary success metric** — bail-out rate |
| `church-view` | User opens a church detail | Core engagement |
| `search` | User searches | Core engagement |

**Vercel env var (NEW project):** `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

**NAS:** Create a new website entry in Umami dashboard for the new frontend.

---

## Phase 4: Bugsink Error Tracking (self-hosted on NAS + NEW repo)

### NAS: Deploy Bugsink

- Deploy as a single Docker container on the NAS (`/srv/docker/bugsink/`)
- Uses SQLite by default — no external DB needed
- Very lightweight (runs fine on modest hardware)
- Add Caddy reverse proxy entry (e.g., `bugsink.pcdhebrail.fr`)

### NEW repo: Sentry SDK pointing to Bugsink

Bugsink is fully compatible with Sentry SDKs — same protocol, just a different DSN.

**Install:** `pnpm add @sentry/nextjs`

**Create:**
- `sentry.client.config.ts` — client-side init with Bugsink DSN
- `sentry.server.config.ts` — server-side init with Bugsink DSN

**Modify `next.config.ts`** — wrap with `withSentryConfig` (disable source map upload since Bugsink doesn't support it the same way — use `hideSourceMaps: false` for readable stack traces)

**Vercel env var:** `NEXT_PUBLIC_SENTRY_DSN` (pointing to `https://bugsink.pcdhebrail.fr/...`)

### Why Bugsink over Sentry Cloud

- Fully self-hosted — data stays on your NAS
- No free tier limits (Sentry free = 5k errors/mo)
- Same SDK, zero code difference — just a different DSN
- Single container, SQLite, ~minimal RAM

---

## Phase 5: Ramp Up

| Stage | CANARY_PERCENT | Duration | Gate to proceed |
|-------|---------------|----------|-----------------|
| 1 | 10% | 1-2 weeks | Bail-out rate < 10%, no error spikes |
| 2 | 25% | 1 week | Same criteria |
| 3 | 50% | 1 week | Same criteria |
| 4 | 100% | 2 weeks | Confirm stability |
| Done | Migrate domain | — | Point confessio.fr to new Vercel project, remove middleware |

Adjusting the percentage is a single env var change in Vercel dashboard — no redeploy needed.

---

## Files to Create/Modify

**NEW repo (confessio-bottom-sheet):**

| File | Action |
|------|--------|
| `src/components/CanaryBanner.tsx` | Create — bail-out banner |
| `src/lib/analytics.ts` | Create — Umami event wrapper |
| `src/umami.d.ts` | Create — TypeScript declarations |
| `src/app/layout.tsx` | Modify — add banner + Umami script |
| `next.config.ts` | Modify — Sentry/Bugsink config |
| `sentry.client.config.ts` | Create — client error tracking |
| `sentry.server.config.ts` | Create — server error tracking |

**OLD repo (confessio.fr):**

| File | Action |
|------|--------|
| `middleware.ts` | Create — canary routing logic |

**NAS:**

| Action | Details |
|--------|---------|
| Deploy Bugsink | Docker container at `/srv/docker/bugsink/` |
| Caddy entry | `bugsink.pcdhebrail.fr` → Bugsink container |
| Umami website | Create new website entry for the new frontend |

---

## Known Challenges

1. **Asset rewriting**: The middleware must rewrite `/_next/static/*` requests too for "new" users, otherwise JS/CSS won't load. This means the middleware runs on every request for canary users — acceptable at this traffic level.
2. **Umami URL**: Need to confirm the exact Umami script URL on the NAS.
3. **Bugsink source maps**: Bugsink may not support Sentry's source map upload protocol. Stack traces will still work but may show minified names. Workaround: don't minify in production, or use `hideSourceMaps: false`.

---

## Verification

1. Deploy middleware on old repo → visit confessio.fr in incognito → check cookie is set → verify routing works
2. Force cookie to `new` manually → confirm new frontend loads under confessio.fr domain
3. Click bail-out banner → confirm cookie flips to `old` and old frontend loads
4. Check Umami dashboard → confirm page views and `bailout-click` events appear
5. Trigger a JS error → confirm it shows in Bugsink
6. Change `CANARY_PERCENT` in Vercel → confirm new visitors get the updated ratio
