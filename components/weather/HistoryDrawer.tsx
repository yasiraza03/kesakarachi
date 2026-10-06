"use client";

import { Freshness } from "@/components/ui/Freshness";
import { Drawer } from "@/components/ui/Drawer";
import { formatDateLong, formatShortWeekday, localParts } from "@/lib/time";
import type { DailyWeather, HistoryData, Meta } from "@/types/city";
import { heatColor } from "./series";

type Props = {
  open: boolean;
  onClose: () => void;
  history: HistoryData | null;
  meta: Meta | null;
  stale: boolean;
  loading: boolean;
  now: number;
  /** today's forecast, to compare with the record */
  today: DailyWeather | undefined;
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Historical weather: REAL ERA5 archive data via Open-Meteo. Today's forecast against the same date in the last ten years. */
export function HistoryDrawer({ open, onClose, history, meta, stale, loading, now, today }: Props) {
  return (
    <Drawer open={open} onClose={onClose} title="This date, in the record" eyebrow="HISTORY · REAL ARCHIVE DATA" width={460}>
      {!history ? (
        loading ? (
          <div className="space-y-3" aria-busy="true"><div className="skeleton h-24" /><div className="skeleton h-40" /></div>
        ) : (
          <div>
            <p className="text-lg font-light">Archive temporarily unavailable.</p>
            <p className="mt-1 text-sm text-ink-dim">Everything else keeps working. Historical weather returns on the next refresh.</p>
          </div>
        )
      ) : (
        <HistoryBody history={history} meta={meta} stale={stale} now={now} today={today} />
      )}
    </Drawer>
  );
}

function HistoryBody({ history, meta, stale, now, today }: { history: HistoryData; meta: Meta | null; stale: boolean; now: number; today: DailyWeather | undefined }) {
  const { years, normal, last30 } = history;
  const forecastMax = today?.temperatureMax;
  const delta = forecastMax === undefined ? null : forecastMax - normal.tMax;
  const warmerThan = forecastMax === undefined ? null : years.filter((y) => y.tMax < forecastMax).length;

  const lo = Math.min(...years.map((y) => y.tMax), forecastMax ?? Infinity) - 1;
  const hi = Math.max(...years.map((y) => y.tMax), forecastMax ?? -Infinity) + 1;
  const x = (v: number) => ((v - lo) / (hi - lo)) * 280 + 10;

  const sorted = [...years].sort((a, b) => a.year - b.year);
  const t30Lo = Math.min(...last30.map((d) => d.tMin)) - 1;
  const t30Hi = Math.max(...last30.map((d) => d.tMax)) + 1;
  const y30 = (v: number) => 80 - ((v - t30Lo) / (t30Hi - t30Lo)) * 70;
  const maxP = Math.max(5, ...last30.map((d) => d.precip));

  return (
    <div>
      <p className="label">{MONTHS[history.month]} {history.day} &middot; &plusmn;{history.windowDays} DAYS &middot; LAST {years.length} YEARS</p>

      {delta !== null && (
        <section className="mt-3">
          <p className="num text-6xl font-extralight leading-none tracking-tight" style={{ color: heatColor(forecastMax! ) }}>
            {delta > 0 ? "+" : ""}{delta.toFixed(1)}&deg;
          </p>
          <p className="mt-3 text-[15px] leading-snug text-ink">
            Today&apos;s forecast high of <span className="num">{forecastMax!.toFixed(0)}&deg;</span> is {Math.abs(delta) < 0.5 ? "right on" : delta > 0 ? "above" : "below"} the{" "}
            <span className="num">{normal.tMax.toFixed(1)}&deg;</span> average for this time of year
            {warmerThan !== null && <>, warmer than {warmerThan} of the last {years.length} years at this date</>}.
          </p>
        </section>
      )}

      <h3 className="label !text-ink mb-2 mt-7">HIGH ON THIS DATE, EACH YEAR</h3>
      <svg viewBox="0 0 300 70" className="w-full" role="img" aria-label="Average high temperature around this date for each of the last ten years">
        <line x1="10" x2="290" y1="40" y2="40" stroke="var(--rule-strong)" />
        <line x1={x(normal.tMax)} x2={x(normal.tMax)} y1="18" y2="62" stroke="var(--ink-faint)" strokeDasharray="2 3" />
        {sorted.map((y) => (
          <g key={y.year}>
            <circle cx={x(y.tMax)} cy="40" r="5" fill={heatColor(y.tMax)} opacity="0.85" />
            <title>{`${y.year}: high ${y.tMax.toFixed(1)}°, low ${y.tMin.toFixed(1)}°`}</title>
          </g>
        ))}
        {forecastMax !== undefined && (
          <g>
            <path d={`M${x(forecastMax)} 30 l-5 -9 h10 z`} fill="var(--accent)" />
            <text x={x(forecastMax)} y="14" textAnchor="middle" fontSize="8" fill="var(--accent)" className="mono">TODAY</text>
          </g>
        )}
        <text x="10" y="66" fontSize="8" fill="var(--ink-faint)" className="mono">{lo.toFixed(0)}&deg;</text>
        <text x="290" y="66" textAnchor="end" fontSize="8" fill="var(--ink-faint)" className="mono">{hi.toFixed(0)}&deg;</text>
        <text x={x(normal.tMax)} y="66" textAnchor="middle" fontSize="8" fill="var(--ink-dim)" className="mono">AVG</text>
      </svg>
      <p className="mono mt-1 text-[11px] leading-relaxed text-ink-faint">
        Warmest: {[...sorted].sort((a, b) => b.tMax - a.tMax)[0].year} ({[...sorted].sort((a, b) => b.tMax - a.tMax)[0].tMax.toFixed(1)}&deg;) &middot; coolest:{" "}
        {[...sorted].sort((a, b) => a.tMax - b.tMax)[0].year} ({[...sorted].sort((a, b) => a.tMax - b.tMax)[0].tMax.toFixed(1)}&deg;) &middot; typical low {normal.tMin.toFixed(1)}&deg; &middot; rain on
        about {Math.round((years.filter((y) => y.precip > 1).length / years.length) * 100)}% of these windows
      </p>

      <h3 className="label !text-ink mb-2 mt-7">THE LAST 30 DAYS</h3>
      <svg viewBox="0 0 300 100" className="w-full" role="img" aria-label="Daily high and low temperature and rain over the last 30 days">
        {last30.map((d, i) => {
          const w = 300 / last30.length;
          const bx = i * w + 1;
          return (
            <g key={d.t}>
              <rect x={bx} y={y30(d.tMax)} width={w - 2} height={Math.max(1.5, y30(d.tMin) - y30(d.tMax))} fill={heatColor(d.tMax)} opacity="0.8" />
              {d.precip >= 0.5 && <rect x={bx} y={100 - Math.min(14, (d.precip / maxP) * 14)} width={w - 2} height={Math.min(14, (d.precip / maxP) * 14)} fill="#5e8fa3" />}
              <title>{`${formatShortWeekday(d.t)} ${localParts(d.t).day}: ${d.tMin.toFixed(0)}–${d.tMax.toFixed(0)}°, rain ${d.precip.toFixed(1)} mm`}</title>
            </g>
          );
        })}
      </svg>
      <p className="label mt-1 normal-case tracking-[0.03em]">Bars span each day&apos;s low to high; blue at the base is rainfall. Archive ends {formatDateLong(history.archiveEnd)}.</p>

      <Freshness label="HISTORY" meta={meta} stale={stale} now={now} className="mt-6" />
      <p className="label mt-2 normal-case leading-relaxed tracking-[0.03em]">
        ERA5 reanalysis via the Open-Meteo archive API (CC BY 4.0). It trails real time by a few days and is a gridded estimate, not a station record.
      </p>
    </div>
  );
}
