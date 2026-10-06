import { KARACHI } from "@/data/karachi/coordinates";
import { neighborhoods } from "@/data/karachi/neighborhoods";
import fixture from "@/data/fixtures/weather.json";
import type { AreaWeather, DailyWeather, HourlyWeather, WeatherData } from "@/types/city";
import { OPEN_METEO_FORECAST, REVALIDATE } from "./constants";
import { fetchJson } from "./resilient";
import { DAY_MS, HOUR_MS, startOfLocalDay, startOfLocalHour } from "./time";

/* ───────────────────────────── raw Open-Meteo shapes (never leave this file) ───────────────────────────── */

type Num = number | null;
type RawMain = {
  current: Record<string, Num> & { time: number };
  hourly: Record<string, Num[]> & { time: number[] };
  daily: Record<string, Num[]> & { time: number[] };
};
type RawArea = {
  current: Record<string, Num> & { time: number };
  hourly: Record<string, Num[]> & { time: number[] };
};

const CURRENT_VARS = [
  "temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day", "precipitation", "rain",
  "weather_code", "cloud_cover", "pressure_msl", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
];
const HOURLY_VARS = [
  "temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation_probability", "precipitation",
  "weather_code", "cloud_cover", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "is_day",
];
const DAILY_VARS = [
  "sunrise", "sunset", "temperature_2m_max", "temperature_2m_min", "precipitation_probability_max",
  "weather_code", "uv_index_max",
];

const COMMON = `timezone=${encodeURIComponent(KARACHI.timezone)}&timeformat=unixtime&wind_speed_unit=kmh&forecast_days=3`;

const n = (v: Num | undefined, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

/* ───────────────────────────── normalisation ───────────────────────────── */

export function normalizeMain(raw: RawMain): Pick<WeatherData, "current" | "hourly" | "daily"> {
  const c = raw.current;
  const current = {
    t: c.time * 1000,
    temperature: n(c.temperature_2m),
    apparentTemperature: n(c.apparent_temperature),
    humidity: n(c.relative_humidity_2m),
    precipitation: n(c.precipitation),
    rain: n(c.rain),
    cloudCover: n(c.cloud_cover),
    pressure: n(c.pressure_msl),
    windSpeed: n(c.wind_speed_10m),
    windDirection: n(c.wind_direction_10m),
    windGusts: n(c.wind_gusts_10m),
    weatherCode: n(c.weather_code),
    isDay: n(c.is_day, 1) === 1,
  };

  const h = raw.hourly;
  const hourly: HourlyWeather[] = h.time.map((t, i) => ({
    t: t * 1000,
    temperature: n(h.temperature_2m[i]),
    apparentTemperature: n(h.apparent_temperature[i]),
    humidity: n(h.relative_humidity_2m[i]),
    precipitationProbability: n(h.precipitation_probability[i]),
    precipitation: n(h.precipitation[i]),
    cloudCover: n(h.cloud_cover[i]),
    windSpeed: n(h.wind_speed_10m[i]),
    windGusts: n(h.wind_gusts_10m[i]),
    windDirection: n(h.wind_direction_10m[i]),
    weatherCode: n(h.weather_code[i]),
    isDay: n(h.is_day[i], 1) === 1,
  }));

  const d = raw.daily;
  const daily: DailyWeather[] = d.time.map((t, i) => ({
    t: startOfLocalDay(t * 1000 + 6 * HOUR_MS),
    sunrise: n(d.sunrise[i]) * 1000,
    sunset: n(d.sunset[i]) * 1000,
    temperatureMax: n(d.temperature_2m_max[i]),
    temperatureMin: n(d.temperature_2m_min[i]),
    precipitationProbabilityMax: n(d.precipitation_probability_max[i]),
    weatherCode: n(d.weather_code[i]),
    uvIndexMax: n(d.uv_index_max[i]),
  }));

  return { current, hourly, daily };
}

function normalizeAreas(raws: RawArea[]): AreaWeather[] {
  return raws.map((r, i) => ({
    id: neighborhoods[i].id,
    current: {
      temperature: n(r.current.temperature_2m),
      apparentTemperature: n(r.current.apparent_temperature),
      windSpeed: n(r.current.wind_speed_10m),
    },
    temperature: r.hourly.temperature_2m.map((v) => n(v)),
    apparentTemperature: r.hourly.apparent_temperature.map((v) => n(v)),
  }));
}

/* ───────────────────────────── fetch ───────────────────────────── */

export async function loadWeather(): Promise<WeatherData> {
  const mainUrl =
    `${OPEN_METEO_FORECAST}?latitude=${KARACHI.latitude}&longitude=${KARACHI.longitude}&${COMMON}` +
    `&current=${CURRENT_VARS.join(",")}&hourly=${HOURLY_VARS.join(",")}&daily=${DAILY_VARS.join(",")}`;

  const lats = neighborhoods.map((a) => a.latitude).join(",");
  const lons = neighborhoods.map((a) => a.longitude).join(",");
  const areaUrl =
    `${OPEN_METEO_FORECAST}?latitude=${lats}&longitude=${lons}&${COMMON}` +
    `&current=temperature_2m,apparent_temperature,wind_speed_10m&hourly=temperature_2m,apparent_temperature`;

  // The neighbourhood batch is a bonus: if it fails the rest of the weather still ships.
  const [main, areaRaw] = await Promise.all([
    fetchJson<RawMain>(mainUrl, REVALIDATE.weather),
    fetchJson<RawArea[] | RawArea>(areaUrl, REVALIDATE.weather).catch((e) => {
      console.error("[weather] area batch failed:", e instanceof Error ? e.message : e);
      return null;
    }),
  ]);

  const norm = normalizeMain(main);
  const areas = areaRaw ? normalizeAreas(Array.isArray(areaRaw) ? areaRaw : [areaRaw]) : [];
  // Keep areas aligned with the main hourly axis; drop them if the lengths disagree.
  const aligned = areas.filter((a) => a.temperature.length === norm.hourly.length);

  return {
    location: { name: KARACHI.name, latitude: KARACHI.latitude, longitude: KARACHI.longitude, timezone: KARACHI.timezone },
    ...norm,
    areas: aligned,
    updatedAt: new Date().toISOString(),
  };
}

/* ───────────────────────────── fixture (offline reference) ───────────────────────────── */

type Fixture = {
  hourly: Omit<HourlyWeather, "t">[];
  daily: { sunriseMin: number; sunsetMin: number; tMax: number; tMin: number; pop: number; code: number; uv: number }[];
  pressure: number;
};

/** Rebase the bundled reference day onto the current Karachi date so every screen still renders. */
export function weatherFixture(now = Date.now()): WeatherData {
  const fx = fixture as unknown as Fixture;
  const day0 = startOfLocalDay(now);
  const hourly: HourlyWeather[] = fx.hourly.map((h, i) => ({ ...h, t: day0 + i * HOUR_MS }));
  const cur = hourly.find((h) => h.t === startOfLocalHour(now)) ?? hourly[12];
  const daily: DailyWeather[] = fx.daily.map((d, i) => ({
    t: day0 + i * DAY_MS,
    sunrise: day0 + i * DAY_MS + d.sunriseMin * 60_000,
    sunset: day0 + i * DAY_MS + d.sunsetMin * 60_000,
    temperatureMax: d.tMax,
    temperatureMin: d.tMin,
    precipitationProbabilityMax: d.pop,
    weatherCode: d.code,
    uvIndexMax: d.uv,
  }));
  return {
    location: { name: KARACHI.name, latitude: KARACHI.latitude, longitude: KARACHI.longitude, timezone: KARACHI.timezone },
    current: {
      t: cur.t,
      temperature: cur.temperature,
      apparentTemperature: cur.apparentTemperature,
      humidity: cur.humidity,
      precipitation: cur.precipitation,
      rain: cur.precipitation,
      cloudCover: cur.cloudCover,
      pressure: fx.pressure,
      windSpeed: cur.windSpeed,
      windDirection: cur.windDirection,
      windGusts: cur.windGusts,
      weatherCode: cur.weatherCode,
      isDay: cur.isDay,
    },
    hourly,
    daily,
    areas: [],
    updatedAt: new Date(now).toISOString(),
  };
}
