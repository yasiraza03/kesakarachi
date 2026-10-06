import type { AirData, AirReading, Conditions, HourlyWeather, WeatherData } from "@/types/city";
import { HOUR_MS, startOfLocalHour } from "./time";

/** Nearest hourly row at/before t. */
function hourlyAt<T extends { t: number }>(rows: T[], t: number): T | undefined {
  if (!rows.length) return undefined;
  const h = startOfLocalHour(t);
  let best = rows[0];
  for (const r of rows) {
    if (r.t <= h) best = r;
    else break;
  }
  return Math.abs(best.t - h) > 2 * HOUR_MS ? undefined : best;
}

function airAt(air: AirData | null, t: number, isNow: boolean): AirReading | null {
  if (!air) return null;
  if (isNow) return air.current;
  return hourlyAt(air.hourly, t) ?? null;
}

/**
 * One consistent snapshot of the city at time `t` (null = right now).
 * "Now" prefers the `current` block (fresher than the hourly grid); any other time reads the hourly grid.
 */
export function conditionsAt(weather: WeatherData | null, air: AirData | null, t: number | null, now: number): Conditions | null {
  if (!weather) return null;
  const isNow = t === null || startOfLocalHour(t) === startOfLocalHour(now);
  const at = isNow ? now : (t as number);

  const h: HourlyWeather | undefined = hourlyAt(weather.hourly, at);
  const a = airAt(air, at, isNow);
  const base = {
    usAqi: a?.usAqi ?? null,
    pm25: a?.pm25 ?? null,
    pm10: a?.pm10 ?? null,
    uvIndex: a?.uvIndex ?? null,
  };

  if (isNow) {
    const c = weather.current;
    return {
      t: at,
      isNow: true,
      temperature: c.temperature,
      apparentTemperature: c.apparentTemperature,
      humidity: c.humidity,
      precipitation: c.precipitation,
      precipitationProbability: h?.precipitationProbability ?? 0,
      cloudCover: c.cloudCover,
      windSpeed: c.windSpeed,
      windGusts: c.windGusts,
      windDirection: c.windDirection,
      weatherCode: c.weatherCode,
      isDay: c.isDay,
      ...base,
    };
  }
  if (!h) return null;
  return {
    t: at,
    isNow: false,
    temperature: h.temperature,
    apparentTemperature: h.apparentTemperature,
    humidity: h.humidity,
    precipitation: h.precipitation,
    precipitationProbability: h.precipitationProbability,
    cloudCover: h.cloudCover,
    windSpeed: h.windSpeed,
    windGusts: h.windGusts,
    windDirection: h.windDirection,
    weatherCode: h.weatherCode,
    isDay: h.isDay,
    ...base,
  };
}

/** Conditions for a specific hourly row (always the hourly grid) - used to draw the 24 h arc. */
export function conditionsFromHour(h: HourlyWeather, air: AirData | null): Conditions {
  const a = air ? hourlyAt(air.hourly, h.t) : undefined;
  return {
    t: h.t + 30 * 60_000,
    isNow: false,
    temperature: h.temperature,
    apparentTemperature: h.apparentTemperature,
    humidity: h.humidity,
    precipitation: h.precipitation,
    precipitationProbability: h.precipitationProbability,
    cloudCover: h.cloudCover,
    windSpeed: h.windSpeed,
    windGusts: h.windGusts,
    windDirection: h.windDirection,
    weatherCode: h.weatherCode,
    isDay: h.isDay,
    usAqi: a?.usAqi ?? null,
    pm25: a?.pm25 ?? null,
    pm10: a?.pm10 ?? null,
    uvIndex: a?.uvIndex ?? null,
  };
}
