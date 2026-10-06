"use client";

import { ArrowUp, RotateCw } from "lucide-react";
import { formatClock, formatShortWeekday } from "@/lib/time";
import { compass, describeWeather } from "@/lib/weather-codes";
import { formatCoord, KARACHI } from "@/data/karachi/coordinates";
import type { CityState, Conditions, Meta } from "@/types/city";
import { Freshness } from "@/components/ui/Freshness";
import { Meter } from "@/components/ui/Meter";
import { WeatherGlyph } from "@/components/ui/WeatherGlyph";
import { useTween } from "@/components/ui/useTween";

type HeroProps = {
  c: Conditions | null;
  simulated: boolean;
  headlineText: string | null;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  compact?: boolean;
};

/** The big answer: what is Karachi like right now? Sits directly on the map, no card. */
export function WeatherHero({ c, simulated, headlineText, loading, failed, onRetry, compact = false }: HeroProps) {
  const temp = useTween(c?.temperature ?? 0);
  const feels = useTween(c?.apparentTemperature ?? 0);

  return (
    <section aria-label="Current conditions in Karachi" className={`anim-rise ${compact ? "[text-shadow:0_0_14px_rgb(7_16_20/0.95),0_0_3px_rgb(7_16_20)]" : ""}`}>
      <p className="label mb-2 hidden items-center gap-3 lg:flex">
        <span className="!text-accent">KARACHI</span>
        <span className="num">{formatCoord(KARACHI.latitude, "lat")}</span>
        <span className="num">{formatCoord(KARACHI.longitude, "lon")}</span>
      </p>

      {!c ? (
        loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading weather">
            <div className="skeleton h-28 w-52 lg:h-40" />
            <div className="skeleton h-4 w-48" />
          </div>
        ) : failed ? (
          <div className="max-w-xs">
            <p className="label !text-signal mb-2">WEATHER</p>
            <p className="text-2xl font-light leading-snug">Temporarily unavailable.</p>
            <p className="mt-2 text-sm text-ink-dim">The map and everything else keep working. We&apos;ll retry on their own.</p>
            <button className="btn mt-4" onClick={onRetry}>
              <RotateCw size={13} /> Retry now
            </button>
          </div>
        ) : null
      ) : (
        <>
          <div className="mb-1 flex items-center gap-2">
            {!c.isNow && (
              <span className="label !text-accent">
                {formatShortWeekday(c.t)} {formatClock(c.t, { hour12: true })} &middot; FORECAST
              </span>
            )}
            {simulated && <span className="label !text-sodium stripes px-1.5 py-0.5">SIMULATION</span>}
          </div>
          <h1 className="flex items-start leading-none" aria-label={`${Math.round(temp)} degrees Celsius`}>
            <span
              className={`num font-extralight tracking-[-0.06em] ${compact ? "text-[92px]" : "text-[clamp(96px,16vh,172px)]"} leading-[0.82] ${simulated ? "text-sodium" : ""}`}
            >
              {Math.round(temp)}
            </span>
            <span className={`mt-2 font-extralight text-accent ${compact ? "text-4xl" : "text-[clamp(32px,5vh,56px)]"}`}>&deg;</span>
            <span className="mono label mt-4 ml-1 !text-ink-dim">C</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="mono num text-sm tracking-wide">
              <span className="label mr-2">FEELS LIKE</span>
              {Math.round(feels)}&deg;
            </p>
            <p className="flex items-center gap-2 text-sm text-ink-dim">
              <WeatherGlyph kind={describeWeather(c.weatherCode, c.isDay).kind} isDay={c.isDay} size={22} className="text-accent" />
              {describeWeather(c.weatherCode, c.isDay).label}
            </p>
          </div>
          {headlineText && !compact && (
            <p className="mt-3 max-w-[22ch] text-[clamp(22px,3.2vh,30px)] font-light leading-tight tracking-tight text-ink">{headlineText}</p>
          )}
        </>
      )}
    </section>
  );
}

/* ───────────────────────────── readouts ───────────────────────────── */

type ReadoutsProps = {
  c: Conditions | null;
  state: CityState | null;
  pressure: number | null;
  loading: boolean;
  weatherMeta: Meta | null;
  weatherStale: boolean;
  airMeta: Meta | null;
  airStale: boolean;
  now: number;
};

function Row({ label, children, meta, delay }: { label: string; children: React.ReactNode; meta?: React.ReactNode; delay: number }) {
  return (
    <div className="anim-rise grid grid-cols-[88px_1fr] items-baseline gap-x-3 py-[7px] hair-t" style={{ animationDelay: `${delay}ms` }}>
      <dt className="label">{label}</dt>
      <dd className="m-0 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">{children}</div>
        {meta && <div className="mono mt-0.5 text-[11px] leading-snug text-ink-faint">{meta}</div>}
      </dd>
    </div>
  );
}

export function Readouts({ c, state, pressure, loading, weatherMeta, weatherStale, airMeta, airStale, now }: ReadoutsProps) {
  if ((!c || !state) && !loading) {
    return <p className="label pt-2">READOUTS &middot; WAITING FOR WEATHER</p>;
  }
  if (!c || !state) {
    return (
      <div className="space-y-3 pt-2" aria-busy="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="skeleton h-9" />
        ))}
      </div>
    );
  }
  const dirTo = (c.windDirection + 180) % 360;

  return (
    <div>
      <dl className="m-0">
        <Row label="HUMIDITY" delay={80} meta={state.humidity.label}>
          <span className="num text-xl font-light">{Math.round(c.humidity)}<span className="text-sm text-ink-dim">%</span></span>
          <span className="w-24"><Meter value={c.humidity / 100} segments={14} height={6} className="text-accent" /></span>
        </Row>
        <Row label="WIND" delay={140} meta={`${compass(c.windDirection)} · gusts ${Math.round(c.windGusts)} km/h · ${state.wind.label}`}>
          <span className="num text-xl font-light">{Math.round(c.windSpeed)}<span className="ml-1 text-sm text-ink-dim">km/h</span></span>
          <ArrowUp size={18} className="text-accent transition-transform duration-700" style={{ transform: `rotate(${dirTo}deg)` }} aria-label={`blowing from ${compass(c.windDirection)}`} />
        </Row>
        <Row label="RAIN" delay={200} meta={`${c.precipitation.toFixed(1)} mm now · ${state.rain.label}`}>
          <span className="num text-xl font-light">{Math.round(c.precipitationProbability)}<span className="text-sm text-ink-dim">%</span></span>
          <span className="w-24"><Meter value={c.precipitationProbability / 100} segments={14} height={6} className="text-monsoon" /></span>
        </Row>
        <Row label="AIR" delay={260} meta={c.usAqi === null ? "modelled air quality unavailable" : `AQI ${Math.round(c.usAqi)} · PM2.5 ${c.pm25?.toFixed(0)} µg/m³ · PM10 ${c.pm10?.toFixed(0)} · MODELLED`}>
          <span className={`text-xl font-light tone-${state.air.tone}`}>{state.air.label}</span>
          {c.pm25 !== null && <span className="num text-sm text-ink-dim">{c.pm25.toFixed(0)} <span className="text-[11px]">PM2.5</span></span>}
        </Row>
        <Row label="UV / PRESS." delay={320} meta={pressure ? `${Math.round(pressure)} hPa sea-level` : undefined}>
          <span className="num text-xl font-light">{c.uvIndex === null ? "—" : c.uvIndex.toFixed(0)}<span className="ml-1 text-sm text-ink-dim">UV</span></span>
          <span className="num text-sm text-ink-dim">{c.isDay ? "daylight" : "night"}</span>
        </Row>
      </dl>
      <div className="mt-3 space-y-1.5">
        <Freshness label="WEATHER" meta={weatherMeta} stale={weatherStale} now={now} />
        <Freshness label="AIR" meta={airMeta} stale={airStale} now={now} />
      </div>
    </div>
  );
}
