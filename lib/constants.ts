export const SITE = {
  name: "kesakarachi",
  tagline: "The city, right now.",
  description:
    "A living interface for Karachi: weather, modelled air quality and a deterministic city state, drawn over the map.",
  urdu: "کراچی",
} as const;

/** Server-side cache windows (seconds). Match the `revalidate` exports in the route handlers. */
export const REVALIDATE = {
  weather: 600,
  air: 1200,
  prayer: 6 * 3600,
  history: 24 * 3600,
} as const;

/** Client refetch cadence (ms). The Next.js route handlers are cached, so these are cheap. */
export const REFRESH_MS = {
  weather: 10 * 60_000,
  air: 20 * 60_000,
  prayer: 6 * 3_600_000,
  history: 12 * 3_600_000,
} as const;

/** Upstream request timeout (ms). */
export const UPSTREAM_TIMEOUT_MS = 8000;

export const OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast";
export const OPEN_METEO_AIR = "https://air-quality-api.open-meteo.com/v1/air-quality";
export const OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
export const ALADHAN_TIMINGS = "https://api.aladhan.com/v1/timings";

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
