import { KARACHI } from "@/data/karachi/coordinates";
import type { HistoryData, HistoryDay, HistoryYear } from "@/types/city";
import { OPEN_METEO_ARCHIVE, REVALIDATE } from "./constants";
import { fetchJson } from "./resilient";
import { DAY_MS, localEpoch, localParts } from "./time";

/**
 * Historical weather - REAL data. Open-Meteo's archive API (ERA5 reanalysis, keyless).
 * One request covers ten years of daily highs, lows and rain; we reduce it server-side to what the UI needs:
 *   - the same calendar date (+/- WINDOW days) in each of the last ten years
 *   - the last 30 days
 * ERA5 trails real time by a few days, so the archive ends a little before today.
 */
type Raw = {
  daily: { time: string[]; temperature_2m_max: (number | null)[]; temperature_2m_min: (number | null)[]; precipitation_sum: (number | null)[] };
};

const WINDOW = 3;
const YEARS = 10;
const LAG_DAYS = 6;

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (t: number) => {
  const p = localParts(t);
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}`;
};
const parseDay = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return localEpoch(y, m - 1, d);
};

export async function loadHistory(now = Date.now()): Promise<HistoryData> {
  const today = localParts(now);
  const end = localEpoch(today.year, today.month, today.day) - LAG_DAYS * DAY_MS;
  const start = localEpoch(today.year - YEARS, 0, 1);

  const url =
    `${OPEN_METEO_ARCHIVE}?latitude=${KARACHI.latitude}&longitude=${KARACHI.longitude}` +
    `&start_date=${iso(start)}&end_date=${iso(end)}&timezone=${encodeURIComponent(KARACHI.timezone)}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum`;
  const raw = await fetchJson<Raw>(url, REVALIDATE.history);

  const d = raw.daily;
  const days: HistoryDay[] = d.time.flatMap((s, i) => {
    const tMax = d.temperature_2m_max[i];
    const tMin = d.temperature_2m_min[i];
    if (tMax === null || tMin === null) return [];
    return [{ t: parseDay(s), tMax, tMin, precip: d.precipitation_sum[i] ?? 0 }];
  });
  if (days.length < 365) throw new Error("history: archive returned too little data");

  const years: HistoryYear[] = [];
  for (let y = today.year - YEARS; y < today.year; y++) {
    const centre = localEpoch(y, today.month, today.day);
    const win = days.filter((x) => Math.abs(x.t - centre) <= WINDOW * DAY_MS);
    if (!win.length) continue;
    const avg = (f: (x: HistoryDay) => number) => win.reduce((s, x) => s + f(x), 0) / win.length;
    years.push({ year: y, tMax: avg((x) => x.tMax), tMin: avg((x) => x.tMin), precip: win.reduce((s, x) => s + x.precip, 0) });
  }
  if (!years.length) throw new Error("history: no comparable years");

  const mean = (f: (x: HistoryYear) => number) => years.reduce((s, x) => s + f(x), 0) / years.length;
  return {
    month: today.month,
    day: today.day,
    windowDays: WINDOW,
    years,
    normal: {
      tMax: mean((y) => y.tMax),
      tMin: mean((y) => y.tMin),
      precipPerDay: mean((y) => y.precip) / (WINDOW * 2 + 1),
    },
    last30: days.slice(-30),
    archiveEnd: days[days.length - 1].t,
    updatedAt: new Date(now).toISOString(),
  };
}
