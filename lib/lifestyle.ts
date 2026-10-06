import type { CityState, Conditions, DailyWeather, PrayerData, PrayerTime, Tone } from "@/types/city";
import { compass } from "./weather-codes";
import { formatClock, formatDuration } from "./time";

/**
 * "STREET READ" - a few plain, deterministic lines about what the numbers mean for being outside in Karachi.
 * Each line is a hand-written rule keyed to the same data as the rest of the app. No model, no invention.
 */
export type StreetLine = { tag: string; text: string; tone: Tone };

export function nextPrayer(prayer: PrayerData | null, now: number): (PrayerTime & { inMs: number }) | null {
  if (!prayer) return null;
  const next = prayer.times.find((p) => p.t > now);
  return next ? { ...next, inMs: next.t - now } : null;
}

export function streetRead(c: Conditions, s: CityState, day: DailyWeather | undefined, now: number): StreetLine[] {
  const lines: StreetLine[] = [];

  // Rain beats everything else.
  if (s.rain.index >= 5) {
    lines.push({ tag: "HEAVY RAIN", text: "Low-lying roads and underpasses can hold water. Check before you head out.", tone: "alert" });
  } else if (s.rain.index === 4) {
    lines.push({ tag: "RAINING", text: "Chai and pakoray weather. Allow extra time on the road.", tone: "sea" });
  } else if (s.rain.index === 3) {
    lines.push({ tag: "RAIN LIKELY", text: `${Math.round(c.precipitationProbability)}% chance this hour. Keep an umbrella close.`, tone: "sea" });
  }

  // Sea breeze: Karachi's afternoon relief arrives from the south-west.
  const fromSea = c.windDirection >= 180 && c.windDirection <= 270;
  if (fromSea && c.windSpeed >= 12) {
    lines.push({ tag: "SEA BREEZE", text: `${compass(c.windDirection)} at ${Math.round(c.windSpeed)} km/h. The coast feels it first.`, tone: "sea" });
  } else if (c.windSpeed < 8) {
    lines.push({ tag: "STILL AIR", text: "Almost no wind. Heat and humidity will sit on the city.", tone: "warn" });
  }

  if (s.heat.index >= 4) {
    lines.push({ tag: "HEAT", text: "Nimbu pani weather. Keep water with you and avoid the midday sun if you can.", tone: "hot" });
  } else if (s.heat.index <= 1 && s.rain.index < 3) {
    lines.push({ tag: "COOL", text: "Cool enough for chai on the roof, or a long walk along the sea.", tone: "sea" });
  }

  if (s.air.index >= 2) {
    lines.push({ tag: "HAZE", text: "Air is poor for sensitive groups. Think twice about long outdoor stretches.", tone: "hot" });
  }

  if (c.uvIndex !== null && c.uvIndex >= 8 && c.isDay) {
    lines.push({ tag: "UV", text: `UV index ${c.uvIndex.toFixed(0)}. Shade and sunscreen.`, tone: "warn" });
  }

  if (day) {
    if (now < day.sunset && c.isDay) {
      lines.push({
        tag: "SUNSET",
        text: `${formatClock(day.sunset)} - in ${formatDuration(day.sunset - now)}. Golden hour on the waterfront starts around ${formatClock(day.sunset - 50 * 60_000)}.`,
        tone: "warn",
      });
    } else if (now < day.sunrise) {
      lines.push({ tag: "SUNRISE", text: `${formatClock(day.sunrise)} - in ${formatDuration(day.sunrise - now)}.`, tone: "warn" });
    }
  }

  return lines.slice(0, 4);
}
