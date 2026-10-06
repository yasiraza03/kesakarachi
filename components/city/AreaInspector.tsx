"use client";

import { X } from "lucide-react";
import { CATEGORY_STYLE, landmarks } from "@/data/karachi/landmarks";
import { neighborhoods } from "@/data/karachi/neighborhoods";
import { formatCoord } from "@/data/karachi/coordinates";
import { heatColor } from "@/components/weather/series";
import type { AreaReading, Selection } from "@/components/map/types";
import { SYSTEM_META, areaValue, bandFor, formatSystemValue, type AreaSystems, type SystemKey } from "@/lib/systems";

type Props = {
  selection: Selection;
  reading: AreaReading | undefined;
  systems: AreaSystems | undefined;
  simulated: boolean;
  viewLabel: string;
  cityTemp: number | null;
  onClose: () => void;
};

/** Inspect an area or landmark. Static facts + the model reading for that coordinate, labelled as such. */
export function AreaInspector({ selection, reading, systems, simulated, viewLabel, cityTemp, onClose }: Props) {
  if (!selection) return null;
  const area = selection.kind === "area" ? neighborhoods.find((n) => n.id === selection.id) : null;
  const lm = selection.kind === "landmark" ? landmarks.find((l) => l.id === selection.id) : null;
  const item = area ?? lm;
  if (!item) return null;

  const diff = reading && cityTemp !== null ? reading.temperature - cityTemp : null;

  return (
    <aside aria-label={`${item.name} details`} className="panel-solid ticks anim-up w-full p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label !text-accent">
            {area ? `AREA · ${area.district.toUpperCase()}` : `${CATEGORY_STYLE[lm!.category].label.toUpperCase()} · LANDMARK`}
          </p>
          <h2 className="mt-1 text-2xl font-light leading-tight tracking-tight">{item.name}</h2>
        </div>
        <button className="btn !h-7 !px-2" onClick={onClose} aria-label="Close details"><X size={13} /></button>
      </div>
      <p className="mt-2 text-[13px] leading-snug text-ink-dim">{item.note}</p>

      {area && (
        <div className="mt-3 hair-t pt-3">
          {reading ? (
            <>
              <div className="flex items-baseline justify-between">
                <p className="label">MODEL READING &middot; {viewLabel}</p>
                {simulated && <p className="label !text-sodium">SIMULATED</p>}
              </div>
              <div className="mt-1 flex items-end gap-4">
                <p className="num text-4xl font-extralight leading-none" style={{ color: heatColor(reading.apparent) }}>{Math.round(reading.temperature)}&deg;</p>
                <p className="mono pb-0.5 text-[11px] leading-snug text-ink-dim">
                  feels {Math.round(reading.apparent)}&deg;
                  {diff !== null && Math.abs(diff) >= 0.5 && (
                    <>
                      <br />
                      {diff > 0 ? "+" : ""}{diff.toFixed(1)}&deg; vs city centre
                    </>
                  )}
                </p>
              </div>
              <p className="label mt-2 normal-case leading-relaxed tracking-[0.03em]">
                Weather-model grid point at this coordinate, not a street thermometer. Close neighbours can read identically.
              </p>
            </>
          ) : (
            <p className="label normal-case tracking-[0.03em]">Per-area model readings are unavailable right now.</p>
          )}
        </div>
      )}

      {area && systems && (
        <div className="mt-3 hair-t pt-3">
          <p className="label !text-sodium mb-2">SIMULATED &middot; NOT LIVE DATA</p>
          <dl className="m-0 grid grid-cols-3 gap-x-3 gap-y-2">
            {(["traffic", "flood", "power", "water", "noise", "heat"] as SystemKey[]).map((k) => {
              const v = areaValue(systems, k);
              const b = bandFor(k, v);
              return (
                <div key={k}>
                  <dt className="label">{SYSTEM_META[k].title}</dt>
                  <dd className={`mono m-0 mt-0.5 text-[10.5px] tracking-[0.06em] tone-${b.tone}`}>
                    {b.label}
                    <span className="num ml-1 text-ink-faint">{formatSystemValue(k, v)}{k === "noise" ? " dB" : ""}</span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      <p className="mono num mt-3 text-[10.5px] tracking-wide text-ink-faint">
        {formatCoord(item.latitude, "lat")} &nbsp; {formatCoord(item.longitude, "lon")} &nbsp;&middot;&nbsp; STATIC REFERENCE DATA
      </p>
    </aside>
  );
}
