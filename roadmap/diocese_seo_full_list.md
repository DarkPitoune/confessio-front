# Diocese Pages — Full Church List for SEO

## Problem

`/diocese/[slug]` pages use the `/search` endpoint with diocese bounds. At that zoom level, the API returns mostly **aggregations** (grouped counts), not individual churches. Google sees a page with a few bubbles instead of a rich list of churches with schedules.

## Solution

### 1. New API endpoint

Add `/front/api/diocese/{slug}/churches` (or a `no_aggregate=true` flag on `/search`) that returns **all churches** within the diocese, without aggregation. This is only for server-side rendering — normal users zoomed out still see aggregations as usual.

### 2. ISR caching on Next.js side

Use Incremental Static Regeneration so the endpoint is hit minimally:

- `generateStaticParams` lists all diocese slugs → pages are pre-built at build time
- `revalidate = 3600` → cache is refreshed at most once per hour
- Result: ~100 diocese pages, each hitting the API once/hour max, not once/visitor

```ts
// diocese/[slug]/page.tsx
export const revalidate = 3600;

export async function generateStaticParams() {
  const dioceses = await fetchDioceses();
  return dioceses.map((d) => ({ slug: d.slug }));
}
```

### 3. Server-rendered church list

The `@modal/diocese/[slug]/page.tsx` server component renders the full church list with names, addresses, and next confession times — all indexable by Google without JS.

## Dependencies

- Backend: new endpoint or flag to bypass aggregation
- Frontend: swap the fetch in `@modal/diocese/[slug]/page.tsx` + add ISR config
