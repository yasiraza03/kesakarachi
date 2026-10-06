import type { Conditions, Pulse, PulseComponent } from "@/types/city";
import { localParts } from "./time";
import { describeWeather } from "./weather-codes";

/**
 * KARACHI PULSE - an experimental composite index (0-100). NOT an official metric.
 *
 *   pulse = sum(weight_i x score_i)         each score_i is 0-100
 *
 *   rhythm    32%  assumed daily activity curve of the city (a fixed table, see RHYTHM), x traffic lever
 *   heat      20%  apparent temperature,   18 degC -> 0   .. 46 degC -> 100
 *   air       14%  US AQI,                 0 -> 0         .. 200     -> 100
 *   humidity   8%  relative humidity,      30% -> 0       .. 90%     -> 100
 *   wind       8%  max(wind, 0.6 x gust),  0 -> 0         .. 45 km/h -> 100
 *   rain      12%  max(chance x 0.5, mm/h x 25)
 *   sky        6%  weather-code severity (clear 0 .. thunderstorm 90-100)
 *
 * The weights are a judgement call, chosen to make the number move in a way that feels right. They are
 * printed in the app so nobody mistakes this for science.
 */

/**
 * Assumed activity by local hour (0-100). A modelling assumption about city rhythm - not measured data.
 * Karachi is a late-night city, so the evening shoulder is long.
 */
export const RHYTHM: readonly number[] = [
  38, 28, 18, 12, 12, 20, 36, 55, 74, 86, 84, 80,
  78, 76, 70, 72, 78, 88, 94, 96, 94, 88, 76, 56,
];

export const PULSE_WEIGHTS = { rhythm: 0.32, heat: 0.2, air: 0.14, humidity: 0.08, wind: 0.08, rain: 0.12, sky: 0.06 } as const;

export const PULSE_BANDS = [
  { max: 20, label: "DORMANT" },
  { max: 40, label: "CALM" },
  { max: 60, label: "STEADY" },
  { max: 80, label: "ACTIVE" },
  { max: Infinity, label: "SURGING" },
] as const;

const clamp = (x: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x));
const scale = (x: number, lo: number, hi: number) => clamp(((x - lo) / (hi - lo)) * 100);

export function rhythmAt(t: number): number {
  const { hour, minutesOfDay } = localParts(t);
  const a = RHYTHM[hour];
  const b = RHYTHM[(hour + 1) % 24];
  const f = (minutesOfDay - hour * 60) / 60;
  return a + (b - a) * f;
}

export function pulseLabel(value: number): string {
  return PULSE_BANDS.find((b) => value < b.max)!.label;
}

export function computePulse(c: Conditions, opts: { traffic?: number } = {}): Pulse {
  const traffic = opts.traffic ?? 0;
  const rhythm = clamp(rhythmAt(c.t) * (1 + traffic / 100));
  const sky = describeWeather(c.weatherCode, c.isDay);
  const aqi = c.usAqi;

  const raw: [keyof typeof PULSE_WEIGHTS, string, number, string][] = [
    ["rhythm", "City rhythm", rhythm, traffic ? `assumed curve x ${(1 + traffic / 100).toFixed(2)} traffic lever` : "assumed curve for this hour"],
    ["heat", "Heat", scale(c.apparentTemperature, 18, 46), `feels like ${c.apparentTemperature.toFixed(0)}°C`],
    ["air", "Air", aqi === null ? 0 : scale(aqi, 0, 200), aqi === null ? "no air data - counted as 0" : `US AQI ${Math.round(aqi)}`],
    ["humidity", "Humidity", scale(c.humidity, 30, 90), `${Math.round(c.humidity)}% RH`],
    ["wind", "Wind", scale(Math.max(c.windSpeed, c.windGusts * 0.6), 0, 45), `${Math.round(c.windSpeed)} km/h, gusts ${Math.round(c.windGusts)}`],
    ["rain", "Rain", clamp(Math.max(c.precipitationProbability * 0.5, c.precipitation * 25)), `${Math.round(c.precipitationProbability)}% chance, ${c.precipitation.toFixed(1)} mm`],
    ["sky", "Sky", sky.severity, sky.label],
  ];

  const components: PulseComponent[] = raw.map(([key, label, score, detail]) => ({
    key,
    label,
    weight: PULSE_WEIGHTS[key],
    score,
    detail,
  }));

  const value = Math.round(components.reduce((sum, p) => sum + p.weight * p.score, 0));
  return { value, label: pulseLabel(value), components };
}
