"use client";

import { X } from "lucide-react";
import { SITE } from "@/lib/constants";
import { compass } from "@/lib/weather-codes";
import { formatClock, formatShortWeekday } from "@/lib/time";
import type { CityState, Conditions, Pulse, TimePhase } from "@/types/city";
import { useTween } from "@/components/ui/useTween";
import { CityClock } from "./CityClock";

type Props = {
  c: Conditions;
  state: CityState;
  pulse: Pulse;
  headlineText: string;
  simulated: boolean;
  now: number;
  phase: TimePhase;
  onExit: () => void;
};

/** "What is Karachi like right now?" - UI hidden, the map orbits behind a single, large answer. */
export function FocusMode({ c, state, pulse, headlineText, simulated, now, phase, onExit }: Props) {
  const temp = useTween(c.temperature);
  const stats: { label: string; value: string; sub?: string; tone?: string }[] = [
    { label: "HUMIDITY", value: state.humidity.label, sub: `${Math.round(c.humidity)}%`, tone: `tone-${state.humidity.tone}` },
    { label: "AIR", value: state.air.label, sub: c.usAqi === null ? "no data" : `AQI ${Math.round(c.usAqi)}`, tone: `tone-${state.air.tone}` },
    { label: "WIND", value: `${Math.round(c.windSpeed)} km/h`, sub: `from ${compass(c.windDirection)}` },
    { label: "RAIN", value: `${Math.round(c.precipitationProbability)}%`, sub: state.rain.label.toLowerCase(), tone: `tone-${state.rain.tone}` },
    { label: "PULSE", value: String(pulse.value), sub: pulse.label },
  ];

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-5 anim-fade sm:p-10" role="dialog" aria-label="Karachi right now" aria-modal="true">
      <div className="pointer-events-none absolute inset-0 scrim-focus-b" />
      <div className="pointer-events-none absolute inset-0 scrim-focus-l" />
      <div className="pointer-events-none absolute inset-0 scrim-focus-t" />

      <header className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="label !text-accent">{SITE.name.toUpperCase()} &middot; THE CITY, RIGHT NOW</p>
          <p className="urdu mt-3 text-3xl text-ink-dim" lang="ur" dir="rtl">{SITE.urdu}</p>
        </div>
        <div className="flex items-start gap-4">
          <CityClock now={now} phase={phase} variant="focus" />
          <button className="btn" onClick={onExit} aria-label="Exit focus mode" data-autofocus><X size={14} /> <span className="kbd">esc</span></button>
        </div>
      </header>

      <div className="relative z-10">
        <p className="label mb-3">
          {c.isNow ? "RIGHT NOW" : `${formatShortWeekday(c.t)} ${formatClock(c.t, { hour12: true })} · FORECAST`}
          {simulated && <span className="ml-3 !text-sodium stripes px-1.5 py-0.5">SIMULATION &mdash; NOT LIVE</span>}
        </p>
        <h1 className="focus-hero m-0 flex items-start" aria-label={`Karachi, ${Math.round(temp)} degrees. ${headlineText}`}>
          <span className={`num ${simulated ? "text-sodium" : ""}`}>{Math.round(temp)}</span>
          <span className="mt-[0.08em] text-[0.34em] tracking-normal text-accent">&deg;C</span>
        </h1>
        <p className="mt-6 text-3xl font-light tracking-tight sm:text-5xl">
          {headlineText} <span className="text-ink-faint">Feels like {Math.round(c.apparentTemperature)}&deg;.</span>
        </p>

        <dl className="m-0 mt-8 grid grid-cols-2 gap-x-8 gap-y-5 hair-t pt-5 sm:grid-cols-5">
          {stats.map((s, i) => (
            <div key={s.label} className="anim-rise" style={{ animationDelay: `${300 + i * 90}ms` }}>
              <dt className="label">{s.label}</dt>
              <dd className={`num m-0 mt-1 text-2xl font-light tracking-tight sm:text-3xl ${s.tone ?? ""}`}>{s.value}</dd>
              {s.sub && <dd className="mono m-0 mt-0.5 text-[11px] uppercase tracking-[0.12em] text-ink-faint">{s.sub}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
