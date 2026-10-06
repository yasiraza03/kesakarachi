"use client";

import { AIR_BANDS } from "@/lib/city-state";
import { HOUR_MS, formatHourLabel, startOfLocalHour } from "@/lib/time";
import type { AirData, AirReading, Meta } from "@/types/city";
import { Freshness } from "@/components/ui/Freshness";
import { Meter } from "@/components/ui/Meter";

type Props = {
  air: AirData | null;
  meta: Meta | null;
  stale: boolean;
  now: number;
  selectedT: number | null;
  loading: boolean;
};

/** WHO 2021 global air quality guideline values, 24-hour mean (ug/m3). */
const WHO = { pm25: 15, pm10: 45 };

const POLLUTANTS: { key: keyof AirReading; label: string; unit: string; digits: number }[] = [
  { key: "nitrogenDioxide", label: "NO₂", unit: "µg/m³", digits: 0 },
  { key: "ozone", label: "O₃", unit: "µg/m³", digits: 0 },
  { key: "sulphurDioxide", label: "SO₂", unit: "µg/m³", digits: 0 },
  { key: "carbonMonoxide", label: "CO", unit: "µg/m³", digits: 0 },
  { key: "dust", label: "DUST", unit: "µg/m³", digits: 0 },
  { key: "aerosolOpticalDepth", label: "AOD", unit: "", digits: 2 },
];

export function AirQuality({ air, meta, stale, now, selectedT, loading }: Props) {
  if (!air) {
    return (
      <section aria-label="Modelled air quality">
        <h2 className="label !text-ink">MODELLED AIR QUALITY</h2>
        {loading ? (
          <div className="mt-3 space-y-2" aria-busy="true">
            <div className="skeleton h-16" />
            <div className="skeleton h-4" />
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-lg font-light">Temporarily unavailable.</p>
            <p className="mt-1 text-sm text-ink-dim">Weather and the map are unaffected. Air will return on the next refresh.</p>
          </div>
        )}
      </section>
    );
  }

  const nowHour = startOfLocalHour(now);
  const selHour = selectedT === null ? nowHour : startOfLocalHour(selectedT);
  const r = selHour === nowHour ? air.current : (air.hourly.find((h) => h.t === selHour) ?? air.current);
  const band = AIR_BANDS.find((b) => r.usAqi < b.max)!;
  const series = air.hourly.filter((h) => h.t >= nowHour - 3 * HOUR_MS).slice(0, 48);
  const maxAqi = Math.max(150, ...series.map((s) => s.usAqi));

  return (
    <section aria-label="Modelled air quality">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="label !text-ink">MODELLED AIR QUALITY</h2>
          <p className="label mt-1 normal-case tracking-[0.03em]">CAMS atmospheric model &middot; not a ground-station reading</p>
        </div>
        <div className="text-right">
          <p className={`num text-5xl font-extralight leading-none tracking-tight tone-${band.tone}`}>{Math.round(r.usAqi)}</p>
          <p className={`mono mt-1 text-[11px] tracking-[0.14em] tone-${band.tone}`}>US AQI &middot; {band.label}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {([["PM2.5", r.pm25, WHO.pm25], ["PM10", r.pm10, WHO.pm10]] as const).map(([name, v, who]) => (
          <div key={name}>
            <div className="flex items-baseline justify-between">
              <span className="label !text-ink">{name}</span>
              <span className="num text-lg font-light">
                {v.toFixed(0)} <span className="text-[11px] text-ink-dim">&micro;g/m&sup3;</span>
              </span>
            </div>
            <Meter value={v / (who * 4)} segments={32} height={7} className={`mt-1.5 ${v / who >= 2 ? "tone-hot" : v / who >= 1 ? "tone-warn" : "tone-sea"}`} />
            <p className="mono mt-1 text-[11px] text-ink-faint">
              {(v / who).toFixed(1)}&times; the WHO 24-hour guideline ({who} &micro;g/m&sup3;)
            </p>
          </div>
        ))}
      </div>

      <dl className="m-0 mt-5 grid grid-cols-3 gap-x-4 gap-y-3">
        {POLLUTANTS.map((p) => {
          const val = r[p.key] as number | null;
          return (
            <div key={p.key}>
              <dt className="label">{p.label}</dt>
              <dd className="num m-0 text-[15px] font-light">
                {val === null ? "—" : val.toFixed(p.digits)}
                {p.unit && val !== null && <span className="ml-0.5 text-[10px] text-ink-faint"> {p.unit.replace("µg/m³", "µg")}</span>}
              </dd>
            </div>
          );
        })}
      </dl>

      {series.length > 4 && (
        <div className="mt-6">
          <p className="label mb-1.5">US AQI &middot; NEXT 48 H (MODELLED)</p>
          <svg viewBox="0 0 300 64" className="w-full" role="img" aria-label="Forecast US AQI over the next 48 hours">
            {series.map((s, i) => {
              const h = (s.usAqi / maxAqi) * 56;
              const b = AIR_BANDS.find((x) => s.usAqi < x.max)!;
              const sel = s.t === selHour;
              return (
                <rect
                  key={s.t}
                  x={(i / series.length) * 300 + 0.5}
                  y={60 - h}
                  width={300 / series.length - 1.5}
                  height={Math.max(1.5, h)}
                  fill={`var(--tone-${b.tone})`}
                  opacity={sel ? 1 : 0.55}
                />
              );
            })}
            <line x1="0" x2="300" y1="60.5" y2="60.5" stroke="var(--rule-strong)" />
          </svg>
          <div className="mono mt-1 flex justify-between text-[10px] text-ink-faint">
            <span>{formatHourLabel(series[0].t)}</span>
            <span>{formatHourLabel(series[Math.floor(series.length / 2)].t)}</span>
            <span>{formatHourLabel(series[series.length - 1].t)}</span>
          </div>
        </div>
      )}

      <Freshness label="AIR" meta={meta} stale={stale} now={now} className="mt-4" />
    </section>
  );
}
