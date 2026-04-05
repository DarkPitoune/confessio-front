# Map Tile Hosting — Self-Hosting Strategy

## Current Setup

- Using **MapTiler Cloud** via `@maptiler/leaflet-maptilersdk` with an API key
- No custom style specified — defaults to **MapTiler Streets** (clean, modern look)
- Not yet deployed to production

## Problem

MapTiler free tier allows 100,000 API requests/month. At ~5,000 visitors/month (~500k tile requests), the free tier won't be enough. Paid plans start at ~€25/month.

## Decision: Self-Host on NAS + Free Fallback

### Primary: Self-hosted vector tiles on NAS

- **Tile generation**: Use **Planetiler** to generate France vector tiles from Geofabrik OSM extract
- **Tile format**: `.mbtiles` or `.pmtiles` — OpenMapTiles schema
- **Tile server**: **tileserver-gl** (Docker) — serves pre-built vector tiles, no server-side rendering needed
- **Style**: **OSM Liberty** — open-source, clean modern look, targets OpenMapTiles schema
- **Fonts/sprites**: Self-hosted alongside tiles (~200 MB)
- **Reverse proxy**: Caddy (already in place on NAS)
- **Client rendering**: Swap `@maptiler/leaflet-maptilersdk` for **MapLibre GL** (renders vector tiles client-side via WebGL)

### Fallback: MapTiler free tier

- Keep existing MapTiler API key as backup tile source
- Client-side failover: on tile load error, swap tile URL to MapTiler
- Same OpenMapTiles schema — OSM Liberty style works with both sources
- Free tier (100k requests) is more than enough for occasional downtime bursts
- Not pixel-identical (minor differences in tile generation/data freshness) but visually very close

### Total cost: €0/month

## NAS Resource Impact

| Resource | Usage | Available |
|----------|-------|-----------|
| Disk | ~10-13 GB (tiles + fonts + sprites + Docker image) | 157 GB free |
| RAM | ~300-500 MB (tileserver-gl) | ~10 GB available |
| CPU | Negligible — serving static binary files | Idle (0.20 load) |
| Bandwidth | ~50-100 KB per tile, heavily cached by browsers | Fine for ~170 visits/day |

## Key Learnings

- **Vector tiles** send raw geometry (not images) to the browser. The client renders via WebGL. Much smaller (~10-50 KB vs 50-200 KB for raster), infinitely re-stylable, smooth zoom, and trivial server load.
- **OpenMapTiles schema** is the standard. MapTiler created it, Planetiler generates it, OSM Liberty targets it. All interoperable.
- **Fonts and sprites** must be hosted alongside tiles — vector styles need SDF glyph PBFs and sprite sheets to render labels/icons. If the NAS is down, these need to be available too (host on Vercel or CDN, or accept fallback may have label issues).
- **CORS headers** must be set in Caddy for MapLibre to load tiles from the NAS domain.
- **Tile freshness** is not a concern — OSM data for French churches barely changes. Update every few months at most.

## Implementation Steps

1. Download France `.mbtiles` from OpenMapTiles (or generate with Planetiler from Geofabrik PBF)
2. Set up tileserver-gl Docker container on NAS (`/srv/docker/tileserver/`)
3. Configure OSM Liberty style + download fonts/sprites
4. Add Caddy reverse proxy entry with CORS headers
5. Replace `@maptiler/leaflet-maptilersdk` with MapLibre GL in the app
6. Implement client-side failover to MapTiler free tier
7. Test both primary and fallback paths before launch
