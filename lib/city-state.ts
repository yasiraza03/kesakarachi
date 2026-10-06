import type { CityState, Conditions, StateReading, Tone } from "@/types/city";
import { rhythmAt } from "./pulse";

/**
 * CITY STATE - deterministic rules, readable top to bottom. No AI.
 * Each band list is `value < max -> label`, evaluated in order. The same tables are rendered in the
 * in-app "method" drawer, so what you read there is exactly what runs here.
 */

export type Band = { max: number; label: string; tone: Tone };

export const HEAT_BANDS: Band[] = [
  { max: 14, label: "COLD", tone: "sea" },
  { max: 22, label: "COOL", tone: "sea" },
  { max: 28, label: "MILD", tone: "calm" },
  { max: 34, label: "WARM", tone: "warn" },
  { max: 40, label: "HIGH", tone: "hot" },
  { max: Infinity, label: "EXTREME", tone: "alert" },
]; // apparent temperature, degC

export const HUMIDITY_BANDS: Band[] = [
  { max: 35, label: "DRY", tone: "calm" },
  { max: 55, label: "COMFORT", tone: "calm" },
  { max: 70, label: "ELEVATED", tone: "warn" },
  { max: 85, label: "HIGH", tone: "hot" },
  { max: Infinity, label: "SATURATED", tone: "alert" },
]; // relative humidity, %

export const AIR_BANDS: Band[] = [
  { max: 51, label: "GOOD", tone: "sea" },
  { max: 101, label: "MODERATE", tone: "warn" },
  { max: 151, label: "SENSITIVE", tone: "hot" },
  { max: 201, label: "UNHEALTHY", tone: "alert" },
  { max: 301, label: "VERY UNHEALTHY", tone: "alert" },
  { max: Infinity, label: "HAZARDOUS", tone: "alert" },
]; // US AQI (modelled)

export const WIND_BANDS: Band[] = [
  { max: 8, label: "CALM", tone: "calm" },
  { max: 20, label: "BREEZY", tone: "sea" },
  { max: 32, label: "ACTIVE", tone: "sea" },
  { max: 50, label: "STRONG", tone: "warn" },
  { max: Infinity, label: "SEVERE", tone: "alert" },
]; // km/h

export const RAIN_BANDS: Band[] = [
  { max: 10, label: "NONE", tone: "calm" },
  { max: 30, label: "LOW", tone: "calm" },
  { max: 60, label: "POSSIBLE", tone: "sea" },
  { max: Infinity, label: "LIKELY", tone: "sea" },
]; // precipitation probability, % - overridden by FALLING / HEAVY when rain is measured

export const ACTIVITY_BANDS: Band[] = [
  { max: 20, label: "QUIET", tone: "calm" },
  { max: 40, label: "LOW", tone: "calm" },
  { max: 60, label: "MODERATE", tone: "sea" },
  { max: 80, label: "HIGH", tone: "warn" },
  { max: Infinity, label: "PEAK", tone: "hot" },
]; // assumed rhythm for this hour x traffic lever

export const COMFORT_BANDS: Band[] = [
  { max: 25, label: "VERY LOW", tone: "alert" },
  { max: 45, label: "LOW", tone: "hot" },
  { max: 65, label: "FAIR", tone: "warn" },
  { max: 85, label: "GOOD", tone: "sea" },
  { max: Infinity, label: "EXCELLENT", tone: "sea" },
]; // comfort score 0-100

const clamp = (x: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x));

function pick(value: number, bands: Band[]) {
  const index = bands.findIndex((b) => value < b.max);
  return { index, max: bands.length - 1, label: bands[index].label, tone: bands[index].tone };
}

/**
 * Comfort: starts at 100 and loses points.
 *   heat      apparent > 24: -3.75 per degC (max -60);  apparent < 14: -3 per degC (max -30)
 *   humidity  only when apparent > 26: -0.4 per % above 60 RH
 *   air       -0.25 per AQI point above 50 (max -25)
 *   rain      -0.1 per % chance, -5 per mm (max -15)
 *   wind      +0.4 per km/h when apparent > 28 (max +10) - sea breeze helps
 */
export function comfortScore(c: Conditions): number {
  const a = c.apparentTemperature;
  const heatPen = a > 24 ? Math.min(60, (a - 24) * 3.75) : a < 14 ? Math.min(30, (14 - a) * 3) : 0;
  const humPen = a > 26 ? Math.max(0, c.humidity - 60) * 0.4 : 0;
  const airPen = c.usAqi === null ? 0 : Math.min(25, Math.max(0, c.usAqi - 50) * 0.25);
  const rainPen = Math.min(15, c.precipitationProbability * 0.1 + c.precipitation * 5);
  const relief = a > 28 ? Math.min(10, c.windSpeed * 0.4) : 0;
  return clamp(100 - heatPen - humPen - airPen - rainPen + relief);
}

export function computeCityState(c: Conditions, opts: { traffic?: number } = {}): CityState {
  const traffic = opts.traffic ?? 0;

  const heat = pick(c.apparentTemperature, HEAT_BANDS);
  const humidity = pick(c.humidity, HUMIDITY_BANDS);
  const wind = pick(c.windSpeed, WIND_BANDS);
  const activityValue = clamp(rhythmAt(c.t) * (1 + traffic / 100));
  const activity = pick(activityValue, ACTIVITY_BANDS);
  const comfortValue = comfortScore(c);
  const comfort = pick(comfortValue, COMFORT_BANDS);

  // Rain: measured rainfall beats probability.
  let rain: StateReading;
  if (c.precipitation >= 4) {
    rain = { key: "rain", title: "RAIN", label: "HEAVY", index: 5, max: 5, tone: "alert", detail: `${c.precipitation.toFixed(1)} mm falling` };
  } else if (c.precipitation >= 0.1) {
    rain = { key: "rain", title: "RAIN", label: "FALLING", index: 4, max: 5, tone: "sea", detail: `${c.precipitation.toFixed(1)} mm, ${Math.round(c.precipitationProbability)}% chance` };
  } else {
    const r = pick(c.precipitationProbability, RAIN_BANDS);
    rain = { key: "rain", title: "RAIN", label: r.label, index: r.index, max: 5, tone: r.tone, detail: `${Math.round(c.precipitationProbability)}% chance` };
  }

  let air: StateReading;
  if (c.usAqi === null) {
    air = { key: "air", title: "AIR", label: "NO DATA", index: 0, max: AIR_BANDS.length - 1, tone: "calm", detail: "modelled air unavailable" };
  } else {
    const a = pick(c.usAqi, AIR_BANDS);
    air = {
      key: "air", title: "AIR", label: a.label, index: a.index, max: a.max, tone: a.tone,
      detail: `AQI ${Math.round(c.usAqi)}${c.pm25 !== null ? ` · PM2.5 ${c.pm25.toFixed(0)} µg/m³` : ""}`,
    };
  }

  return {
    heat: { key: "heat", title: "HEAT", ...heat, detail: `feels like ${c.apparentTemperature.toFixed(0)}°C` },
    humidity: { key: "humidity", title: "HUMIDITY", ...humidity, detail: `${Math.round(c.humidity)}% RH` },
    air,
    wind: { key: "wind", title: "WIND", ...wind, detail: `${Math.round(c.windSpeed)} km/h, gusts ${Math.round(c.windGusts)}` },
    rain,
    activity: {
      key: "activity", title: "CITY ACTIVITY", ...activity,
      detail: traffic ? `assumed rhythm +${traffic}% (simulated)` : "assumed rhythm for this hour",
    },
    comfort: { key: "comfort", title: "COMFORT", ...comfort, detail: `score ${Math.round(comfortValue)}/100` },
  };
}

export const STATE_ORDER: (keyof CityState)[] = ["heat", "humidity", "air", "wind", "rain", "activity", "comfort"];

/** One-line deterministic headline: "Hot, humid, hazy." */
export function headline(s: CityState): string {
  const parts: string[] = [];
  const heatWord: Record<string, string> = { COLD: "Cold", COOL: "Cool", MILD: "Mild", WARM: "Warm", HIGH: "Hot", EXTREME: "Scorching" };
  parts.push(heatWord[s.heat.label]);
  if (s.humidity.index >= 3) parts.push("humid");
  else if (s.humidity.index === 0) parts.push("dry");
  if (s.rain.index >= 4) parts.push("raining");
  else if (s.rain.index === 3) parts.push("rain on the way");
  if (s.air.index >= 2) parts.push("smoggy");
  else if (s.air.index === 1) parts.push("hazy");
  if (s.wind.index >= 3) parts.push("windy");
  else if (s.wind.index === 2 && s.heat.index >= 3) parts.push("sea breeze");
  return parts.join(", ") + ".";
}
