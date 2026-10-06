import { corridors, type CorridorKind } from "@/data/karachi/corridors";
import { events, type CityEvent } from "@/data/karachi/events";
import { landmarks } from "@/data/karachi/landmarks";
import { neighborhoods } from "@/data/karachi/neighborhoods";
import { profiles } from "@/data/karachi/profiles";
import type { Conditions, Simulation, Tone } from "@/types/city";
import type { Band } from "./city-state";
import { localParts } from "./time";

/**
 * CITY SYSTEMS - SIMULATION.
 *
 * There is no free, reliable, live data for Karachi traffic, flooding, power, water, transit, noise or incidents. So these
 * are deterministic *models*: weather + time of day + a few hand-set area assumptions (data/karachi/profiles.ts) + whatever
 * levers the user pulls in WHAT IF. Same inputs, same outputs - no randomness, no AI. Everything is labelled SIMULATION in
 * the UI and none of it is ever blended into the live readings.
 *
 * Each rule is written out below so it can be argued with.
 */

export type SystemKey = "traffic" | "flood" | "power" | "water" | "transit" | "noise" | "heat";

export type SystemMeta = {
  key: SystemKey;
  title: string;
  unit: string;
  /** one honest line about what the number is */
  blurb: string;
  bands: Band[];
};

const idxBands = (labels: [string, Tone][], limits: number[]): Band[] =>
  labels.map(([label, tone], i) => ({ max: limits[i] ?? Infinity, label, tone }));

export const SYSTEM_META: Record<SystemKey, SystemMeta> = {
  traffic: {
    key: "traffic", title: "TRAFFIC", unit: "congestion index 0-100",
    blurb: "Time-of-day shape x corridor weight x rain x your levers, squashed so doubling the load never exceeds 100.",
    bands: idxBands([["FREE", "calm"], ["LIGHT", "sea"], ["BUSY", "warn"], ["HEAVY", "hot"], ["GRIDLOCK", "alert"]], [25, 45, 65, 85]),
  },
  flood: {
    key: "flood", title: "FLOODING", unit: "ponding risk 0-100",
    blurb: "Rain over the last 6 h (plus the current rate) against an assumed drainage capacity per area. Not a flood forecast.",
    bands: idxBands([["NONE", "calm"], ["WATCH", "sea"], ["PONDING", "warn"], ["FLOODING", "hot"], ["SEVERE", "alert"]], [10, 30, 55, 80]),
  },
  power: {
    key: "power",
    title: "POWER", unit: "grid stress 0-100",
    blurb: "Cooling demand (heat, humidity) and the evening peak against supply. Risk per area scales with an assumed network vulnerability.",
    bands: idxBands([["STABLE", "calm"], ["STRAINED", "sea"], ["TIGHT", "warn"], ["SHEDDING LIKELY", "hot"], ["CRITICAL", "alert"]], [30, 50, 70, 85]),
  },
  water: {
    key: "water",
    title: "WATER", unit: "supply stress 0-100",
    blurb: "Demand rises with heat and dry air, against supply. Stress per area scales with an assumed network reliability.",
    bands: idxBands([["SECURE", "calm"], ["WATCH", "sea"], ["STRESSED", "warn"], ["SHORT", "hot"], ["CRITICAL", "alert"]], [30, 50, 70, 85]),
  },
  transit: {
    key: "transit",
    title: "TRANSIT", unit: "crowding index 0-100",
    blurb: "Commuter-shaped demand, lifted by rain and fuel prices, divided by service capacity.",
    bands: idxBands([["QUIET", "calm"], ["LIGHT", "sea"], ["BUSY", "warn"], ["CROWDED", "hot"], ["PACKED", "alert"]], [25, 45, 65, 85]),
  },
  noise: {
    key: "noise",
    title: "NOISE", unit: "estimated dBA",
    blurb: "A baseline for the land use, plus road traffic, evening street life and any event crowd. An estimate, not a meter reading.",
    bands: idxBands([["QUIET", "calm"], ["MODERATE", "sea"], ["LOUD", "warn"], ["VERY LOUD", "hot"]], [50, 60, 70]),
  },
  heat: {
    key: "heat",
    title: "HEAT ISLAND", unit: "°C added to the model reading",
    blurb: "Built-up and industrial land adds heat, trees and the sea breeze take it away. Strongest at night. The base temperature is real; the offset is modelled.",
    bands: idxBands([["COOL POCKET", "sea"], ["NEUTRAL", "calm"], ["WARM", "warn"], ["HOT SPOT", "hot"], ["INTENSE", "alert"]], [-0.5, 0.8, 1.8, 2.6]),
  },
};

export const SYSTEM_ORDER: SystemKey[] = ["traffic", "flood", "power", "water", "transit", "noise", "heat"];

export function bandFor(key: SystemKey, value: number): Band {
  const bands = SYSTEM_META[key].bands;
  return bands.find((b) => value < b.max) ?? bands[bands.length - 1];
}

/* ───────────────────────────── helpers ───────────────────────────── */

const clamp = (x: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x));
const scale = (x: number, lo: number, hi: number) => clamp(((x - lo) / (hi - lo)) * 100) / 100;
const gauss = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s));
const saturate = (load: number, k: number) => 100 * (1 - Math.exp(-Math.max(0, load) / k));

function km(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Daily shapes, 0..1. These are assumptions about how Karachi moves, not measurements. */
export function dayShape(kind: CorridorKind, t: number): number {
  const { minutesOfDay, weekday } = localParts(t);
  const h = minutesOfDay / 60;
  let v: number;
  if (kind === "commuter") v = 0.06 + 0.5 * gauss(h, 13.5, 4) + 0.85 * gauss(h, 8.8, 1.4) + 0.9 * gauss(h, 18.6, 1.7);
  else if (kind === "commercial") v = 0.06 + 0.95 * gauss(h, 16.5, 4.2);
  else v = 0.05 + 0.95 * gauss(h, 20.5, 2.6) + 0.25 * gauss(h, 17, 2);
  if (weekday === 0) v *= 0.62; // Sunday
  else if (weekday === 6) v *= kind === "leisure" ? 1.1 : 0.8; // Saturday
  else if (weekday === 5 && h >= 12.5 && h <= 14.5) v *= 0.75; // Friday prayers lull
  return clamp(v, 0, 1.15);
}

export function isRushHour(t: number): boolean {
  const { minutesOfDay, weekday } = localParts(t);
  if (weekday === 0) return false;
  const h = minutesOfDay / 60;
  return (h >= 7 && h < 10.5) || (h >= 17 && h < 20.5);
}

/** How much of the "safer nights" effect applies at this hour: full late evening, fading toward dawn. */
function nightWeight(t: number): number {
  const h = localParts(t).minutesOfDay / 60;
  if (h >= 21 || h < 3) return 1;
  if ((h >= 19 && h < 21) || (h >= 3 && h < 5)) return 0.5;
  return 0;
}

function eventById(id: string | null): CityEvent | undefined {
  return id ? events.find((e) => e.id === id) : undefined;
}

function eventFalloff(areaId: string, ev: CityEvent | undefined): number {
  if (!ev) return 0;
  const lm = landmarks.find((l) => l.id === ev.landmarkId);
  const area = neighborhoods.find((n) => n.id === areaId);
  if (!lm || !area) return 0;
  return clamp(1 - km(area.latitude, area.longitude, lm.latitude, lm.longitude) / ev.radiusKm, 0, 1);
}

/**
 * The single "activity lever" (percent) that feeds Karachi Pulse and the activity row of City State:
 *   traffic lever
 * + safer-nights effect: each -1% in the incident index lifts late-evening activity 0.5%  (an assumption)
 * + event lift (citywide, small)
 * - fuel: every +10% on fuel price trims activity 1%
 */
export function activityLever(sim: Simulation, t: number): number {
  const sc = sim.scenario;
  const ev = eventById(sc.event);
  return sim.traffic + -sc.crime * 0.5 * nightWeight(t) + (ev?.activity ?? 0) - sc.fuel * 0.1;
}

/* ───────────────────────────── the model ───────────────────────────── */

export type CorridorState = { id: string; name: string; load: number; congestion: number; works: boolean };

export type AreaSystems = {
  id: string;
  traffic: number;
  flood: number;
  power: number;
  water: number;
  transit: number;
  noiseDb: number;
  heatAdj: number;
};

export type CitySystems = {
  traffic: number;
  flood: number;
  power: number;
  water: number;
  transit: number;
  noiseDb: number;
  /** mean heat-island offset, degC */
  heat: number;
  /** relative security-incident index, baseline 100. Not real crime data. */
  security: number;
};

export type SystemsResult = {
  corridors: CorridorState[];
  areas: Record<string, AreaSystems>;
  city: CitySystems;
  /** what is being applied, for display */
  eventName: string | null;
};

type Input = {
  c: Conditions;
  /** rain over the 6 hours up to now (mm), real + simulated */
  rain6h: number;
  sim: Simulation;
};

export function computeSystems({ c, rain6h, sim }: Input): SystemsResult {
  const sc = sim.scenario;
  const t = c.t;
  const h = localParts(t).minutesOfDay / 60;
  const rush = isRushHour(t);
  const ev = eventById(sc.event);
  const raining = c.precipitation >= 0.1;

  /* ── traffic: corridors ── */
  const rainFactor = clamp(c.precipitation * 0.09 + (rain6h > 5 ? 0.06 : 0) + (c.precipitation >= 4 ? 0.15 : 0), 0, 0.45);
  const fuelDamp = 1 - 0.2 * (sc.fuel / 100);
  const transitRelief = 1 - 0.06 * (sc.transit / 100);

  const corridorStates: CorridorState[] = corridors.map((cor) => {
    let load = 100 * dayShape(cor.kind, t) * (0.5 + 0.5 * cor.weight);
    load *= 1 + rainFactor;
    load *= 1 + sim.traffic / 100;
    if (sc.corridor.id === cor.id && (!sc.corridor.rushOnly || rush)) load *= 1 + sc.corridor.boost / 100;
    if (ev?.corridors[cor.id]) load *= 1 + ev.corridors[cor.id] / 100;
    load *= fuelDamp * transitRelief;
    if (sc.works === cor.id) load /= 0.7; // a lane in three closed
    else if (sc.works) load *= 1.04; // diversions spill onto neighbours
    return { id: cor.id, name: cor.name, load, congestion: saturate(load, 70), works: sc.works === cor.id };
  });
  const loadOf = (id: string) => corridorStates.find((x) => x.id === id)?.load ?? 0;

  /* ── city-wide demand curves ── */
  const apparent = c.apparentTemperature;
  const peak = Math.max(0.25, gauss(h, 21, 2.3), 0.7 * gauss(h, 14.5, 2.5));
  const powerDemand = scale(apparent, 24, 44) * 60 + peak * 30 + scale(c.humidity, 40, 90) * 10;
  const powerStress = clamp(powerDemand * 0.85 * (100 / (100 + sc.grid)));

  const waterDemand = scale(apparent, 22, 44) * 55 + scale(100 - c.humidity, 10, 70) * 15 + 25;
  const waterStress = clamp(waterDemand * 0.8 * (100 / (100 + sc.water)));

  const transitDemand = 100 * dayShape("commuter", t) * (raining ? 1.25 : 1) * (1 + sc.fuel * 0.004);
  const transitCity = saturate(transitDemand / (1 + sc.transit / 100), 80);

  const isDark = !c.isDay;
  const nightF = isDark ? 1 : 0.7;

  /* ── areas ── */
  const areas: Record<string, AreaSystems> = {};
  for (const n of neighborhoods) {
    const pr = profiles[n.id];
    if (!pr) continue;
    const served = corridors.filter((cor) => cor.serves.includes(n.id));
    const fall = eventFalloff(n.id, ev);

    // traffic: average load of the corridors it leans on, scaled by how built-up it is, plus event pull
    const meanLoad = served.length ? served.reduce((s, cor) => s + loadOf(cor.id), 0) / served.length : 100 * dayShape("commuter", t) * 0.5;
    const trafficLoad = meanLoad * (0.7 + 0.5 * pr.density) * (1 + (ev ? (ev.traffic / 100) * fall : 0));
    const traffic = saturate(trafficLoad, 70);

    // flood: rain-load vs assumed drainage; low-lying areas pool first
    const rainLoad = rain6h + 2 * c.precipitation;
    const flood = clamp((rainLoad / 40) * 100 * (0.35 + 0.9 * pr.lowLying) * (1 / (1 + sc.drainage / 100)));

    const power = clamp(powerStress * (0.55 + 0.9 * pr.gridVuln));
    const water = clamp(waterStress * (0.5 + 0.9 * pr.waterVuln));

    const transit = clamp(transitCity * (0.6 + 0.6 * pr.density) + (ev ? ev.traffic * 0.3 * fall : 0));

    const evening = h >= 19 && h < 24 ? pr.nightlife * 7 : 0;
    const noiseDb = clamp(38 + 0.28 * traffic + 6 * pr.industrial + 3 * pr.density + evening + (ev ? ev.noiseDb * fall : 0), 35, 90);

    const seaCool = pr.coastal * (c.windSpeed >= 10 ? 1.3 : 0.8);
    const heatAdj = clamp((2.2 * pr.density + 1.2 * pr.industrial - 1.6 * pr.green - seaCool) * nightF, -2.5, 3);

    areas[n.id] = { id: n.id, traffic, flood, power, water, transit, noiseDb, heatAdj };
  }

  const list = Object.values(areas);
  const mean = (f: (a: AreaSystems) => number) => (list.length ? list.reduce((s, a) => s + f(a), 0) / list.length : 0);
  const topMean = (f: (a: AreaSystems) => number, k: number) => {
    const v = list.map(f).sort((a, b) => b - a).slice(0, k);
    return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
  };

  const city: CitySystems = {
    traffic: mean((a) => a.traffic),
    flood: topMean((a) => a.flood, 3), // a city floods where it floods: report the worst few, not the average
    power: powerStress,
    water: waterStress,
    transit: transitCity,
    noiseDb: mean((a) => a.noiseDb),
    heat: mean((a) => a.heatAdj),
    security: 100 * (1 + sc.crime / 100),
  };

  return { corridors: corridorStates, areas, city, eventName: ev?.name ?? null };
}

/** Value of one system for an area, in the units of SYSTEM_META. */
export function areaValue(a: AreaSystems, key: SystemKey): number {
  return key === "noise" ? a.noiseDb : key === "heat" ? a.heatAdj : a[key];
}

export function cityValue(c: CitySystems, key: SystemKey): number {
  return key === "noise" ? c.noiseDb : key === "heat" ? c.heat : c[key];
}

export function formatSystemValue(key: SystemKey, v: number): string {
  if (key === "noise") return `${Math.round(v)}`;
  if (key === "heat") return `${v > 0 ? "+" : ""}${v.toFixed(1)}°`;
  return `${Math.round(v)}`;
}

/** Rain over the six hours up to t, from the hourly grid (mm). */
export function rainLast6h(hourly: { t: number; precipitation: number }[], t: number): number {
  const hourStart = Math.floor((t + 5 * 3_600_000) / 3_600_000) * 3_600_000 - 5 * 3_600_000;
  let sum = 0;
  for (const h of hourly) if (h.t <= hourStart && h.t > hourStart - 6 * 3_600_000) sum += h.precipitation;
  return sum;
}
