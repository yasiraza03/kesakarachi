# kesakarachi — working notes

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4 + MapLibre GL. Deploys to Vercel as-is. No backend, no env vars, no paid APIs.

## Rules of the project (do not break these)
- **Never present simulated data as live.** Anything from `lib/systems.ts` (traffic, flooding, power, water, transit, noise, heat island, incident index, events) is SIMULATION and must be labelled so in the UI. No area-level crime data or map, ever.
- Every upstream call goes through `lib/resilient.ts` (timeout + Next cache + last-good + fixture). Prayer times and history deliberately have **no fixture**.
- Components consume `types/city.ts`, never raw provider payloads.
- Each module must fail alone: weather down must not break map/air/prayer/history.
- Respect `prefers-reduced-motion`; keep keyboard + screen-reader paths working.

## Map notes
- MapLibre v6 finds its worker next to its own module URL, which bundlers don't emit. `scripts/copy-maplibre-worker.mjs` (postinstall/predev/prebuild) copies it to `public/maplibre/` (gitignored); `KarachiMap` calls `setWorkerUrl`.
- The palette/layers are applied on `style.load` (not `load`) to avoid a flash of Liberty's cream background. `components/map/map-style.ts` classifies Liberty layer ids and re-paints them per time-of-day phase.
- Traffic corridors are *not* stored as geometry: `data/karachi/corridors.ts` has name tokens matched against the `transportation_name` tile layer.
- In dev, the map is exposed as `window.__kkmap` for debugging.

## Where things live
- `lib/pulse.ts`, `lib/city-state.ts`, `lib/simulation.ts`: deterministic weather-side engines. `lib/systems.ts`: simulated city systems. `lib/conditions.ts` builds the single `Conditions` snapshot every engine reads.
- `data/karachi/profiles.ts`: hand-set 0–1 area assumptions feeding the simulations. Qualitative, not measured.
- `components/CityApp.tsx` is the orchestrator (state, engines, layout switch desktop/mobile, keyboard).
- `.scratch/` is gitignored scratch space.

## Commands
`npm run dev` · `npm run lint` · `npm run build` · `node scripts/generate-fixtures.mjs` (regenerates `data/fixtures/*.json`).
