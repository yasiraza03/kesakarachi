import { KARACHI } from "@/data/karachi/coordinates";
import fixture from "@/data/fixtures/air.json";
import type { AirData, AirReading } from "@/types/city";
import { OPEN_METEO_AIR, REVALIDATE } from "./constants";
import { fetchJson } from "./resilient";
import { HOUR_MS, startOfLocalDay, startOfLocalHour } from "./time";

type Num = number | null;
type Raw = {
  current: Record<string, Num> & { time: number };
  hourly: Record<string, Num[]> & { time: number[] };
};

const VARS = [
  "pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone",
  "dust", "aerosol_optical_depth", "uv_index", "us_aqi", "european_aqi",
];

const num = (v: Num | undefined): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * US AQI sub-index from PM2.5 (EPA breakpoints). Used only when the upstream model omits `us_aqi`.
 */
export function usAqiFromPm25(pm: number): number {
  const bands: [number, number, number, number][] = [
    [0, 9.0, 0, 50],
    [9.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 125.4, 151, 200],
    [125.5, 225.4, 201, 300],
    [225.5, 325.4, 301, 500],
  ];
  const c = Math.max(0, pm);
  for (const [cLo, cHi, iLo, iHi] of bands) {
    if (c <= cHi) return Math.round(((iHi - iLo) / (cHi - cLo)) * (Math.max(c, cLo) - cLo) + iLo);
  }
  return 500;
}

function reading(t: number, src: Record<string, Num | undefined>): AirReading {
  const pm25 = num(src.pm2_5) ?? 0;
  return {
    t,
    pm25,
    pm10: num(src.pm10) ?? 0,
    usAqi: num(src.us_aqi) ?? usAqiFromPm25(pm25),
    europeanAqi: num(src.european_aqi),
    carbonMonoxide: num(src.carbon_monoxide),
    nitrogenDioxide: num(src.nitrogen_dioxide),
    sulphurDioxide: num(src.sulphur_dioxide),
    ozone: num(src.ozone),
    dust: num(src.dust),
    aerosolOpticalDepth: num(src.aerosol_optical_depth),
    uvIndex: num(src.uv_index),
  };
}

export function normalizeAir(raw: Raw): AirData {
  const h = raw.hourly;
  const hourly = h.time.map((t, i) => {
    const row: Record<string, Num | undefined> = {};
    for (const v of VARS) row[v] = h[v]?.[i];
    return reading(t * 1000, row);
  });
  return {
    kind: "modelled",
    current: reading(raw.current.time * 1000, raw.current),
    hourly,
    updatedAt: new Date().toISOString(),
  };
}

export async function loadAir(): Promise<AirData> {
  const url =
    `${OPEN_METEO_AIR}?latitude=${KARACHI.latitude}&longitude=${KARACHI.longitude}` +
    `&timezone=${encodeURIComponent(KARACHI.timezone)}&timeformat=unixtime&forecast_days=3` +
    `&current=${VARS.join(",")}&hourly=${VARS.join(",")}`;
  const raw = await fetchJson<Raw>(url, REVALIDATE.air);
  return normalizeAir(raw);
}

type Fixture = { hourly: Omit<AirReading, "t">[] };

/** Bundled reference day, rebased to today. Flagged `fixture` by the caller. */
export function airFixture(now = Date.now()): AirData {
  const fx = fixture as unknown as Fixture;
  const day0 = startOfLocalDay(now);
  const hourly = fx.hourly.map((h, i) => ({ ...h, t: day0 + i * HOUR_MS }));
  const cur = hourly.find((h) => h.t === startOfLocalHour(now)) ?? hourly[12];
  return { kind: "modelled", current: cur, hourly, updatedAt: new Date(now).toISOString() };
}
