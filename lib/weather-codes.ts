export type SkyKind = "clear" | "cloud" | "fog" | "drizzle" | "rain" | "storm" | "snow";

export type Sky = { label: string; kind: SkyKind; /** 0-100, how much the sky adds to city "intensity" */ severity: number };

/** WMO weather interpretation codes, as used by Open-Meteo. */
export function describeWeather(code: number, isDay = true): Sky {
  if (code === 0) return { label: isDay ? "Clear" : "Clear night", kind: "clear", severity: 0 };
  if (code === 1) return { label: isDay ? "Mostly clear" : "Mostly clear night", kind: "clear", severity: 5 };
  if (code === 2) return { label: "Partly cloudy", kind: "cloud", severity: 12 };
  if (code === 3) return { label: "Overcast", kind: "cloud", severity: 22 };
  if (code === 45 || code === 48) return { label: "Fog", kind: "fog", severity: 45 };
  if (code >= 51 && code <= 55) return { label: "Drizzle", kind: "drizzle", severity: 40 };
  if (code === 56 || code === 57) return { label: "Freezing drizzle", kind: "drizzle", severity: 50 };
  if (code === 61) return { label: "Light rain", kind: "rain", severity: 50 };
  if (code === 63) return { label: "Rain", kind: "rain", severity: 65 };
  if (code === 65) return { label: "Heavy rain", kind: "rain", severity: 85 };
  if (code === 66 || code === 67) return { label: "Freezing rain", kind: "rain", severity: 75 };
  if (code >= 71 && code <= 77) return { label: "Snow", kind: "snow", severity: 70 };
  if (code === 80) return { label: "Light showers", kind: "rain", severity: 55 };
  if (code === 81) return { label: "Showers", kind: "rain", severity: 70 };
  if (code === 82) return { label: "Violent showers", kind: "rain", severity: 90 };
  if (code === 85 || code === 86) return { label: "Snow showers", kind: "snow", severity: 70 };
  if (code === 95) return { label: "Thunderstorm", kind: "storm", severity: 90 };
  if (code === 96 || code === 99) return { label: "Thunderstorm with hail", kind: "storm", severity: 100 };
  return { label: "Unknown", kind: "cloud", severity: 10 };
}

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

/** Meteorological direction (where the wind comes FROM) as a compass label. */
export function compass(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}
