"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { HOUR_MS, formatHourLabel, formatShortWeekday, localParts, startOfLocalHour } from "@/lib/time";
import { describeWeather } from "@/lib/weather-codes";
import type { DailyWeather } from "@/types/city";
import { WeatherGlyph } from "@/components/ui/WeatherGlyph";
import type { SeriesPoint } from "./series";

type Props = {
  series: SeriesPoint[];
  daily: DailyWeather[];
  now: number;
  /** epoch ms of the selected hour start, or null for NOW */
  selectedT: number | null;
  simulated: boolean;
  onSelect: (t: number | null) => void;
  onStep: (dir: -1 | 1) => void;
  /** explanatory caption under the strip (hidden in the cramped desktop dock) */
  hint?: boolean;
};

const CELL = 68;

/** Horizontally scrollable, draggable hourly strip. Selecting an hour re-times the whole city. */
export function WeatherTimeline({ series, daily, now, selectedT, simulated, onSelect, onStep, hint = true }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const nowHour = startOfLocalHour(now);
  const visible = series.filter((p) => p.t >= nowHour);
  const selHour = selectedT === null ? nowHour : startOfLocalHour(selectedT);

  // keep the selected hour in view (keyboard stepping, dial scrubbing)
  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (el && scroller.current) {
      const box = scroller.current;
      const left = el.offsetLeft - box.clientWidth / 2 + CELL / 2;
      box.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }, [selHour]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !scroller.current) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startScroll: scroller.current.scrollLeft };
    scroller.current.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || !scroller.current) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    scroller.current.scrollLeft = d.startScroll - dx;
  };
  const end = (e: React.PointerEvent) => {
    drag.current.active = false;
    scroller.current?.releasePointerCapture?.(e.pointerId);
  };

  return (
    <section aria-label="Weather timeline" className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="label !text-ink">
          TIMELINE <span className="ml-2 hidden text-ink-faint sm:inline">DRAG TO SCRUB &middot; THE CITY FOLLOWS</span>
        </h2>
        <div className="flex items-center gap-1.5">
          {simulated && <span className="label !text-sodium stripes px-1.5 py-0.5">SIM TEMPS</span>}
          <button className="btn !h-7 !px-2" onClick={() => onStep(-1)} aria-label="Previous hour"><ChevronLeft size={13} /><span className="kbd hidden sm:grid">&larr;</span></button>
          <button className="btn !h-7 !px-2" onClick={() => onStep(1)} aria-label="Next hour"><ChevronRight size={13} /><span className="kbd hidden sm:grid">&rarr;</span></button>
          <button className="btn !h-7" data-active={selectedT === null} onClick={() => onSelect(null)}>
            NOW <span className="kbd hidden sm:grid">N</span>
          </button>
        </div>
      </div>

      {visible.length === 0 && <p className="label py-6">NO FORECAST YET &middot; WAITING FOR WEATHER</p>}
      <div
        ref={scroller}
        className="scroll-x relative cursor-grab select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.stopPropagation();
            e.preventDefault();
            drag.current.moved = false;
          }
        }}
      >
        <ol className="m-0 flex list-none p-0" style={{ width: visible.length * CELL }}>
          {visible.map((p) => {
            const isNowCell = p.t === nowHour;
            const selected = p.t === selHour;
            const sky = describeWeather(p.code, p.isDay);
            const parts = localParts(p.t);
            const day = daily.find((d) => d.t <= p.t && p.t < d.t + 24 * HOUR_MS);
            const isSunrise = day && day.sunrise >= p.t && day.sunrise < p.t + HOUR_MS;
            const isSunset = day && day.sunset >= p.t && day.sunset < p.t + HOUR_MS;
            return (
              <li key={p.t} className="relative shrink-0" style={{ width: CELL }}>
                {parts.hour === 0 && !isNowCell && (
                  <span className="label absolute -top-0.5 left-1.5 z-10 !text-accent">{formatShortWeekday(p.t)}</span>
                )}
                <button
                  aria-pressed={selected}
                  aria-label={`${isNowCell ? "Now" : formatHourLabel(p.t)}: ${Math.round(p.temperature)} degrees, ${sky.label}, ${Math.round(p.rain)} percent rain`}
                  onClick={() => onSelect(isNowCell ? null : p.t)}
                  className={`group relative flex h-[118px] w-full flex-col items-start justify-between px-2 pb-2 pt-4 text-left transition-colors ${p.isDay ? "" : "bg-black/20"} ${selected ? "bg-accent/10" : "hover:bg-ink/5"}`}
                  style={{ borderLeft: "1px solid var(--rule)" }}
                >
                  <span className={`absolute inset-x-0 top-0 h-[2px] ${selected ? "bg-accent" : "bg-transparent"}`} />
                  <span className={`mono text-[10.5px] tracking-[0.1em] ${selected ? "text-accent" : isNowCell ? "text-ink" : "text-ink-faint"}`}>
                    {isNowCell ? "NOW" : formatHourLabel(p.t)}
                  </span>
                  <WeatherGlyph kind={sky.kind} isDay={p.isDay} size={20} animate={false} className={selected ? "text-accent" : "text-ink-dim"} />
                  <span className={`num text-[19px] font-light leading-none ${simulated ? "text-sodium" : ""}`}>{Math.round(p.temperature)}&deg;</span>
                  <span className="flex w-full items-end justify-between">
                    <span className={`mono num text-[10px] ${p.rain >= 30 ? "text-monsoon" : "text-ink-faint"}`}>{Math.round(p.rain)}%</span>
                    <span className="block w-[7px] bg-accent/70" style={{ height: Math.max(2, p.pulse * 0.26) }} title={`pulse ${p.pulse}`} />
                  </span>
                  {(isSunrise || isSunset) && (
                    <span className="mono absolute right-1.5 top-1.5 text-[9px] tracking-[0.1em] text-sodium">{isSunrise ? "↑ SUN" : "↓ SUN"}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      {hint && (
      <p className="label mt-1.5 normal-case tracking-[0.03em]">
        Per hour: sky, temperature, rain chance (blue when &ge;30%) and the Karachi Pulse for that hour (bar).
      </p>
      )}
    </section>
  );
}
