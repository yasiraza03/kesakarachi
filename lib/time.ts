import type { DailyWeather, TimePhase } from "@/types/city";

/**
 * Karachi is UTC+5 with no daylight saving, so local time is plain arithmetic.
 * Doing it by hand (instead of Intl) keeps server and browser output identical.
 */
export const KARACHI_OFFSET_MS = 5 * 3_600_000;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

export type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
  /** minutes since local midnight (fractional) */
  minutesOfDay: number;
};

export function localParts(t: number): LocalParts {
  const d = new Date(t + KARACHI_OFFSET_MS);
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const second = d.getUTCSeconds();
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    hour,
    minute,
    second,
    weekday: d.getUTCDay(),
    minutesOfDay: hour * 60 + minute + second / 60,
  };
}

export function startOfLocalDay(t: number): number {
  return Math.floor((t + KARACHI_OFFSET_MS) / DAY_MS) * DAY_MS - KARACHI_OFFSET_MS;
}

export function startOfLocalHour(t: number): number {
  return Math.floor((t + KARACHI_OFFSET_MS) / HOUR_MS) * HOUR_MS - KARACHI_OFFSET_MS;
}

/** Local epoch for "Y-M-D hh:mm" in Karachi. */
export function localEpoch(year: number, month: number, day: number, hour = 0, minute = 0): number {
  return Date.UTC(year, month, day, hour, minute) - KARACHI_OFFSET_MS;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatClock(t: number, opts: { seconds?: boolean; hour12?: boolean } = {}): string {
  const p = localParts(t);
  if (opts.hour12) {
    const h = p.hour % 12 === 0 ? 12 : p.hour % 12;
    const suffix = p.hour < 12 ? "AM" : "PM";
    return opts.seconds ? `${h}:${pad(p.minute)}:${pad(p.second)} ${suffix}` : `${h}:${pad(p.minute)} ${suffix}`;
  }
  return opts.seconds ? `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}` : `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "1 PM" */
export function formatHourLabel(t: number): string {
  const p = localParts(t);
  const h = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${h} ${p.hour < 12 ? "AM" : "PM"}`;
}

export function formatWeekday(t: number): string {
  return DAYS[localParts(t).weekday];
}

export function formatShortWeekday(t: number): string {
  return DAYS[localParts(t).weekday].slice(0, 3);
}

/** "06 OCTOBER 2026" */
export function formatDateLong(t: number): string {
  const p = localParts(t);
  return `${pad(p.day)} ${MONTHS[p.month]} ${p.year}`;
}

/** "Updated 7 min ago" style text. Never claims more precision than we have. */
export function formatAgo(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h < 24) return rem >= 10 ? `${h} h ${rem} min ago` : `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/* ───────────────────────────── time of day ───────────────────────────── */

export const PHASE_ORDER: TimePhase[] = ["DAWN", "MORNING", "AFTERNOON", "SUNSET", "EVENING", "NIGHT"];

/**
 * Phase rules (all in local minutes-of-day; sunrise/sunset come from Open-Meteo when we have them):
 *   DAWN       sunrise-45m  .. sunrise+45m
 *   MORNING    ..12:00
 *   AFTERNOON  ..sunset-75m
 *   SUNSET     ..sunset+30m
 *   EVENING    ..21:30
 *   NIGHT      everything else
 */
export function timePhase(t: number, day?: Pick<DailyWeather, "sunrise" | "sunset">): TimePhase {
  const m = localParts(t).minutesOfDay;
  const sunrise = day ? localParts(day.sunrise).minutesOfDay : 6 * 60 + 20;
  const sunset = day ? localParts(day.sunset).minutesOfDay : 18 * 60;
  if (m >= sunrise - 45 && m < sunrise + 45) return "DAWN";
  if (m >= sunrise + 45 && m < 12 * 60) return "MORNING";
  if (m >= 12 * 60 && m < sunset - 75) return "AFTERNOON";
  if (m >= sunset - 75 && m < sunset + 30) return "SUNSET";
  if (m >= sunset + 30 && m < 21 * 60 + 30) return "EVENING";
  return "NIGHT";
}

/** The daily entry that contains time t (by local date), if any. */
export function dayFor(t: number, daily: DailyWeather[]): DailyWeather | undefined {
  const start = startOfLocalDay(t);
  return daily.find((d) => d.t === start);
}
