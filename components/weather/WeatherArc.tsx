"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { HOUR_MS, formatClock, formatDuration, formatHourLabel, formatWeekday, localParts, startOfLocalHour } from "@/lib/time";
import type { DailyWeather, PrayerTime } from "@/types/city";
import { heatColor, type SeriesPoint } from "./series";

type Props = {
  day: DailyWeather | undefined;
  points: SeriesPoint[];
  selectedT: number | null;
  now: number;
  prayers: PrayerTime[];
  simulated: boolean;
  dayOffset: number;
  dayCount: number;
  compact?: boolean;
  loading?: boolean;
  onSelect: (t: number) => void;
  onDay: (d: number) => void;
};

const SIZE = 280;
const C = SIZE / 2;
const R_DAY = 120;
const R_BAR = 78;
const R_RAIN = 72;

/** hour-of-day (0..24, fractional) -> angle in radians, clockwise from the top. Noon at top, midnight at bottom. */
const ang = (h: number) => Math.PI + (h / 24) * Math.PI * 2;
const pt = (r: number, h: number): [number, number] => [C + r * Math.sin(ang(h)), C - r * Math.cos(ang(h))];
const f = (n: number) => n.toFixed(2);

/**
 * THE 24-HOUR CITY ARC.
 * A dial of one Karachi day, noon at the top. Outer arc = daylight (sunrise -> sunset). Radial bars = temperature,
 * coloured by heat. Inner ticks = rain chance. Inner line = Karachi Pulse. Drag the hand to move the whole city in time.
 */
export function WeatherArc({ day, points, selectedT, now, prayers, simulated, dayOffset, dayCount, compact = false, loading = false, onSelect, onDay }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  if (!day || points.length === 0) {
    return (
      <section aria-label="24-hour city arc">
        <h2 className="label !text-ink mb-2">24-HOUR CITY ARC</h2>
        {loading ? (
          <div className="skeleton mx-auto aspect-square w-full max-w-[280px] rounded-full opacity-60" />
        ) : (
          <p className="label mt-3">UNAVAILABLE &middot; WAITING FOR WEATHER</p>
        )}
      </section>
    );
  }

  const nowHour = startOfLocalHour(now);
  const selHour = startOfLocalHour(selectedT ?? nowHour);
  const insideDay = selHour >= day.t && selHour < day.t + 24 * HOUR_MS;
  const selH = insideDay ? (selHour - day.t) / HOUR_MS : null;
  const sel = insideDay ? points.find((p) => p.t === selHour) : undefined;

  const sunriseH = localParts(day.sunrise).minutesOfDay / 60;
  const sunsetH = localParts(day.sunset).minutesOfDay / 60;
  const tMin = Math.min(...points.map((p) => p.temperature));
  const tMax = Math.max(...points.map((p) => p.temperature));
  const span = Math.max(1, tMax - tMin);

  const [x1, y1] = pt(R_DAY, sunriseH);
  const [x2, y2] = pt(R_DAY, sunsetH);
  const daylightArc = `M${f(x1)} ${f(y1)} A${R_DAY} ${R_DAY} 0 ${sunsetH - sunriseH > 12 ? 1 : 0} 1 ${f(x2)} ${f(y2)}`;

  const pulsePath =
    points
      .map((p, i) => {
        const [x, y] = pt(30 + p.pulse * 0.2, i + 0.5);
        return `${i === 0 ? "M" : "L"}${f(x)} ${f(y)}`;
      })
      .join(" ") + " Z";

  const hourFromEvent = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const phi = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
    return Math.floor((((phi / (Math.PI * 2)) * 24 + 12) % 24));
  };
  const pick = (e: React.PointerEvent) => onSelect(day.t + hourFromEvent(e) * HOUR_MS);

  const dayName = dayOffset === 0 ? "TODAY" : dayOffset === 1 ? "TOMORROW" : formatWeekday(day.t);
  const [hx, hy] = selH === null ? [C, C] : pt(R_DAY + 2, selH + 0.5);
  const [hx0, hy0] = selH === null ? [C, C] : pt(24, selH + 0.5);

  return (
    <section aria-label="24-hour city arc" className="min-w-0">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="label !text-ink">24-HOUR CITY ARC</h2>
        <div className="flex items-center gap-1">
          <button className="btn !h-7 !px-1.5" onClick={() => onDay(dayOffset - 1)} disabled={dayOffset <= 0} aria-label="Previous day" style={{ opacity: dayOffset <= 0 ? 0.35 : 1 }}>
            <ChevronLeft size={13} />
          </button>
          <span className="label w-[74px] text-center !text-ink">{dayName}</span>
          <button className="btn !h-7 !px-1.5" onClick={() => onDay(dayOffset + 1)} disabled={dayOffset >= dayCount - 1} aria-label="Next day" style={{ opacity: dayOffset >= dayCount - 1 ? 0.35 : 1 }}>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className={compact ? "flex items-center gap-5" : ""}>
      <svg
        ref={ref}
        viewBox={`-14 -14 ${SIZE + 28} ${SIZE + 28}`}
        className={`block touch-none select-none ${compact ? "w-[158px] shrink-0" : "mx-auto w-full max-w-[280px]"}`}
        role="slider"
        tabIndex={0}
        aria-label="City time of day. Drag or use arrow keys."
        aria-valuemin={0}
        aria-valuemax={23}
        aria-valuenow={selH ?? 0}
        aria-valuetext={sel ? `${formatHourLabel(sel.t)}, ${Math.round(sel.temperature)} degrees, pulse ${sel.pulse}` : "no hour selected on this day"}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => dragging.current && pick(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        style={{ cursor: "pointer" }}
      >
        {/* faint rings */}
        <circle cx={C} cy={C} r={R_DAY} fill="none" stroke="var(--rule)" strokeWidth="3" />
        <circle cx={C} cy={C} r={R_BAR} fill="none" stroke="var(--rule)" strokeWidth="0.75" strokeDasharray="1 3" />
        <circle cx={C} cy={C} r={52} fill="none" stroke="var(--rule)" strokeWidth="0.75" strokeDasharray="1 3" />

        {/* daylight */}
        <path d={daylightArc} fill="none" stroke="var(--accent-2)" strokeWidth="3" strokeLinecap="butt" opacity="0.9" />

        {/* hour ticks + labels */}
        {Array.from({ length: 24 }, (_, h) => {
          const major = h % 6 === 0;
          const [ax, ay] = pt(R_DAY + 5, h);
          const [bx, by] = pt(R_DAY + (major ? 11 : 8), h);
          return <line key={h} x1={f(ax)} y1={f(ay)} x2={f(bx)} y2={f(by)} stroke="var(--ink-faint)" strokeWidth={major ? 1 : 0.75} />;
        })}
        {[0, 6, 12, 18].map((h) => {
          const [tx, ty] = pt(R_DAY + 20, h);
          return (
            <text key={h} x={f(tx)} y={f(ty)} textAnchor="middle" dominantBaseline="central" className="mono" fontSize="9" fill="var(--ink-faint)">
              {String(h).padStart(2, "0")}
            </text>
          );
        })}

        {/* prayer ticks (Aladhan, University of Islamic Sciences Karachi) */}
        {prayers
          .filter((p) => p.t >= day.t && p.t < day.t + 24 * HOUR_MS)
          .map((p) => {
            const h = (p.t - day.t) / HOUR_MS;
            const [ax, ay] = pt(R_DAY - 7, h);
            const [bx, by] = pt(R_DAY + 5, h);
            return (
              <g key={p.name}>
                <title>{`${p.name} ${formatClock(p.t)}`}</title>
                <line x1={f(ax)} y1={f(ay)} x2={f(bx)} y2={f(by)} stroke="var(--c-foam, #a9d8d0)" strokeWidth="2" />
              </g>
            );
          })}

        {/* rain chance: ticks growing inward */}
        {points.map((p, i) => {
          if (p.rain < 5) return null;
          const [ax, ay] = pt(R_RAIN, i + 0.5);
          const [bx, by] = pt(R_RAIN - 3 - p.rain * 0.16, i + 0.5);
          return <line key={p.t} x1={f(ax)} y1={f(ay)} x2={f(bx)} y2={f(by)} stroke="#5e8fa3" strokeWidth="5" strokeLinecap="butt" opacity="0.85" />;
        })}

        {/* temperature: radial bars */}
        {points.map((p, i) => {
          const len = 8 + ((p.temperature - tMin) / span) * 22;
          const [ax, ay] = pt(R_BAR, i + 0.5);
          const [bx, by] = pt(R_BAR + len, i + 0.5);
          const isSel = selH !== null && Math.floor(selH) === i;
          return (
            <line
              key={p.t}
              x1={f(ax)} y1={f(ay)} x2={f(bx)} y2={f(by)}
              stroke={isSel ? "var(--ink)" : heatColor(p.apparent)}
              strokeWidth="6.4"
              opacity={isSel ? 1 : simulated ? 0.95 : 0.85}
            />
          );
        })}

        {/* pulse line */}
        <path d={pulsePath} fill="var(--accent)" fillOpacity="0.1" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round" />

        {/* hand */}
        {selH !== null && (
          <g>
            <line x1={f(hx0)} y1={f(hy0)} x2={f(hx)} y2={f(hy)} stroke="var(--ink)" strokeWidth="1" opacity="0.7" />
            <circle cx={f(hx)} cy={f(hy)} r="4.5" fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.6" />
          </g>
        )}

        {/* now marker */}
        {nowHour >= day.t && nowHour < day.t + 24 * HOUR_MS && (() => {
          const [nx, ny] = pt(R_DAY + 24, (nowHour - day.t) / HOUR_MS + 0.5);
          return <circle cx={f(nx)} cy={f(ny)} r="2.2" fill="var(--c-sodium, #f2b84b)" className="blink" />;
        })()}

        {/* centre readout */}
        <text x={C} y={C - 8} textAnchor="middle" className="mono" fontSize="13" fill="var(--ink)">
          {sel ? formatHourLabel(sel.t) : "—"}
        </text>
        <text x={C} y={C + 14} textAnchor="middle" fontSize="21" fontWeight="200" fill={simulated ? "var(--c-sodium, #f2b84b)" : "var(--ink)"} className="num">
          {sel ? `${Math.round(sel.temperature)}°` : ""}
        </text>
      </svg>

      <dl className={`mono m-0 text-[11px] ${compact ? "grid gap-3" : "mt-2 grid grid-cols-3 gap-2"}`}>
        <div>
          <dt className="label">SUNRISE</dt>
          <dd className="num m-0 text-[15px] text-accent2">{formatClock(day.sunrise)}</dd>
        </div>
        <div>
          <dt className="label">SUNSET</dt>
          <dd className="num m-0 text-[15px] text-accent2">{formatClock(day.sunset)}</dd>
        </div>
        <div>
          <dt className="label">DAYLIGHT</dt>
          <dd className="num m-0 text-[15px]">{formatDuration(day.sunset - day.sunrise)}</dd>
        </div>
      </dl>
      </div>
      {!compact && (
      <p className="label mt-2 normal-case leading-relaxed tracking-[0.03em]">
        Bars: temperature (coloured by heat) &middot; blue ticks inside: rain chance &middot; inner line: Karachi Pulse &middot; gold arc: daylight
        {prayers.length > 0 && <> &middot; <span style={{ color: "#a9d8d0" }}>green ticks</span>: prayer times</>}
      </p>
      )}
    </section>
  );
}
