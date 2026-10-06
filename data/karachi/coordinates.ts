/** Geographic anchors for Karachi. STATIC REFERENCE DATA. */
export const KARACHI = {
  name: "Karachi",
  latitude: 24.8607,
  longitude: 67.0011,
  timezone: "Asia/Karachi",
  /** UTC+5, no daylight saving. */
  utcOffsetHours: 5,
} as const;

/** [west, south, east, north] - loose envelope around the urban area, keeps the camera in town. */
export const KARACHI_BOUNDS: [number, number, number, number] = [66.4, 24.4, 67.6, 25.3];

/** Where the camera starts (wide, flat) before the intro flight. */
export const DEFAULT_VIEW = {
  center: [67.03, 24.86] as [number, number],
  zoom: 9.6,
  pitch: 0,
  bearing: 0,
};

/** The camera we settle on after the intro flight. */
export const HERO_VIEW = {
  center: [67.04, 24.875] as [number, number],
  zoom: 11.1,
  pitch: 40,
  bearing: -16,
};

export function formatCoord(value: number, axis: "lat" | "lon"): string {
  const hemi = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  return `${Math.abs(value).toFixed(4)}° ${hemi}`;
}
