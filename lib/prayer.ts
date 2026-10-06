import { KARACHI } from "@/data/karachi/coordinates";
import type { PrayerData, PrayerName, PrayerTime } from "@/types/city";
import { ALADHAN_TIMINGS, REVALIDATE } from "./constants";
import { fetchJson } from "./resilient";
import { DAY_MS, localEpoch, localParts } from "./time";

/**
 * Aladhan, method 1 = University of Islamic Sciences, Karachi; school 1 = Hanafi (Asr).
 * Free and keyless. No fixture: a made-up prayer time would be worse than none.
 */
type Raw = { code: number; data: { timings: Record<string, string> } };

const NAMES: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const pad = (n: number) => String(n).padStart(2, "0");

function parse(timings: Record<string, string>, dayStart: number): PrayerTime[] {
  const p = localParts(dayStart);
  return NAMES.flatMap((name) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(timings[name] ?? "");
    if (!m) return [];
    return [{ name, t: localEpoch(p.year, p.month, p.day, Number(m[1]), Number(m[2])) }];
  });
}

export async function loadPrayer(now = Date.now()): Promise<PrayerData> {
  const local = localParts(now);
  const dayStart = localEpoch(local.year, local.month, local.day);

  const dateParam = (t: number) => {
    const p = localParts(t);
    return `${pad(p.day)}-${pad(p.month + 1)}-${p.year}`;
  };
  const q = `latitude=${KARACHI.latitude}&longitude=${KARACHI.longitude}&method=1&school=1&timezonestring=${encodeURIComponent(KARACHI.timezone)}`;

  const [today, tomorrow] = await Promise.all([
    fetchJson<Raw>(`${ALADHAN_TIMINGS}/${dateParam(dayStart)}?${q}`, REVALIDATE.prayer),
    fetchJson<Raw>(`${ALADHAN_TIMINGS}/${dateParam(dayStart + DAY_MS)}?${q}`, REVALIDATE.prayer),
  ]);

  const times = [...parse(today.data.timings, dayStart), ...parse(tomorrow.data.timings, dayStart + DAY_MS)];
  if (times.length < 5) throw new Error("prayer: unexpected payload");
  return {
    method: "University of Islamic Sciences, Karachi (Hanafi Asr)",
    times,
    updatedAt: new Date().toISOString(),
  };
}
