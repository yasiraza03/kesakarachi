import { corridors } from "@/data/karachi/corridors";
import { events } from "@/data/karachi/events";
import type { Conditions, Scenario, Simulation } from "@/types/city";

/**
 * WHAT IF? - a deterministic what-if layer. No randomness, no model, no AI.
 * Every rule below is the entire weather simulation (city-systems rules live in lib/systems.ts).
 *
 *   temperature  +N degC on air temperature; apparent temperature moves by the *physical* delta
 *                (Steadman formula), not by N, so humidity and wind still matter.
 *   humidity     +N percentage points relative humidity (capped at 100%).
 *   rain         a floor on rain probability. 50% and up also assumes light rain falling
 *                (0.5 mm/h at 50, 5 mm/h at 100); the sky is set to rain and cloud cover to >= 80%.
 *   traffic      +N% load on the city-activity (rhythm) component of Karachi Pulse and on every corridor.
 *                There is no live traffic data - this is purely a lever.
 */

export const NO_SCENARIO: Scenario = {
  crime: 0,
  fuel: 0,
  transit: 0,
  grid: 0,
  water: 0,
  drainage: 0,
  corridor: { id: null, boost: 0, rushOnly: true },
  event: null,
  works: null,
};

export const NO_SIM: Simulation = { temperature: 0, humidity: 0, rain: null, traffic: 0, scenario: NO_SCENARIO };

export const SIM_STEPS = {
  temperature: [0, 2, 5] as const,
  humidity: [0, 10, 20] as const,
  rain: [null, 25, 50, 100] as const,
  traffic: [0, 20, 50] as const,
  crime: [-40, -20, 0, 20] as const,
  fuel: [0, 10, 25, 50] as const,
  transit: [0, 25, 50] as const,
  grid: [0, -10, -25] as const,
  water: [0, -15, -30] as const,
  drainage: [-25, 0, 25] as const,
  boost: [0, 20, 40, 60] as const,
};

export function isScenarioActive(s: Scenario): boolean {
  return (
    s.crime !== 0 || s.fuel !== 0 || s.transit !== 0 || s.grid !== 0 || s.water !== 0 || s.drainage !== 0 ||
    (s.corridor.id !== null && s.corridor.boost !== 0) || s.event !== null || s.works !== null
  );
}

export function isSimActive(s: Simulation): boolean {
  return s.temperature !== 0 || s.humidity !== 0 || s.rain !== null || s.traffic !== 0 || isScenarioActive(s.scenario);
}

/** Does the weather part of the simulation change anything? (The systems part never changes the weather itself.) */
export function isWeatherSimActive(s: Simulation): boolean {
  return s.temperature !== 0 || s.humidity !== 0 || s.rain !== null;
}

/** Steadman (1994) apparent temperature, the non-radiative form used by the Australian BoM. */
export function steadmanApparent(tempC: number, rh: number, windKmh: number): number {
  const e = (rh / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  return tempC + 0.33 * e - 0.7 * (windKmh / 3.6) - 4.0;
}

export function applySimulation(c: Conditions, s: Simulation): Conditions {
  if (!isWeatherSimActive(s)) return c;

  const temperature = c.temperature + s.temperature;
  const humidity = Math.min(100, c.humidity + s.humidity);
  const apparentTemperature =
    c.apparentTemperature +
    (steadmanApparent(temperature, humidity, c.windSpeed) - steadmanApparent(c.temperature, c.humidity, c.windSpeed));

  let { precipitation, precipitationProbability, weatherCode, cloudCover } = c;
  if (s.rain !== null) {
    precipitationProbability = Math.max(precipitationProbability, s.rain);
    const assumed = s.rain === 100 ? 5 : s.rain === 50 ? 0.5 : 0;
    precipitation = Math.max(precipitation, assumed);
    if (s.rain >= 50) {
      cloudCover = Math.max(cloudCover, 80);
      if (weatherCode < 61) weatherCode = s.rain === 100 ? 65 : 61;
    }
  }

  return { ...c, temperature, humidity, apparentTemperature, precipitation, precipitationProbability, weatherCode, cloudCover };
}

export function simSummary(s: Simulation): string[] {
  const out: string[] = [];
  const sc = s.scenario;
  if (s.temperature) out.push(`TEMP +${s.temperature}°C`);
  if (s.humidity) out.push(`HUMIDITY +${s.humidity}%`);
  if (s.rain !== null) out.push(`RAIN ≥${s.rain}%`);
  if (s.traffic) out.push(`TRAFFIC +${s.traffic}%`);
  if (sc.corridor.id && sc.corridor.boost) {
    const c = corridors.find((x) => x.id === sc.corridor.id);
    out.push(`${(c?.name ?? sc.corridor.id).toUpperCase()} +${sc.corridor.boost}%${sc.corridor.rushOnly ? " RUSH" : ""}`);
  }
  if (sc.works) out.push(`ROADWORKS ${(corridors.find((x) => x.id === sc.works)?.name ?? "").toUpperCase()}`);
  if (sc.event) out.push(`EVENT ${(events.find((e) => e.id === sc.event)?.name ?? "").toUpperCase()}`);
  if (sc.crime) out.push(`INCIDENTS ${sc.crime > 0 ? "+" : ""}${sc.crime}%`);
  if (sc.fuel) out.push(`FUEL +${sc.fuel}%`);
  if (sc.transit) out.push(`TRANSIT +${sc.transit}%`);
  if (sc.grid) out.push(`POWER ${sc.grid}%`);
  if (sc.water) out.push(`WATER ${sc.water}%`);
  if (sc.drainage) out.push(`DRAINAGE ${sc.drainage > 0 ? "+" : ""}${sc.drainage}%`);
  return out;
}
