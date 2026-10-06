"use client";

import { neighborhoods } from "@/data/karachi/neighborhoods";
import { SYSTEM_META, SYSTEM_ORDER, areaValue, bandFor, formatSystemValue, type SystemKey, type SystemsResult } from "@/lib/systems";
import { Drawer } from "@/components/ui/Drawer";
import { Meter } from "@/components/ui/Meter";
import type { FieldItem } from "@/components/map/types";
import { heatColor } from "@/components/weather/series";
import { normalise } from "./SystemsDrawer";

type Props = {
  open: boolean;
  onClose: () => void;
  ids: string[];
  onChange: (ids: string[]) => void;
  /** real weather-model reading per area at the viewed hour (temperature, apparent) */
  readings: Record<string, { temperature: number; apparent: number }> | null;
  systems: SystemsResult | null;
  viewLabel: string;
};

const MAX = 3;

export function CompareDrawer({ open, onClose, ids, onChange, readings, systems, viewLabel }: Props) {
  const chosen = ids.map((id) => neighborhoods.find((n) => n.id === id)).filter((n): n is (typeof neighborhoods)[number] => !!n);
  const toggle = (id: string) => onChange(ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= MAX ? [...ids.slice(1), id] : [...ids, id]);
  const cols = `92px repeat(${Math.max(1, chosen.length)}, minmax(0, 1fr))`;

  return (
    <Drawer open={open} onClose={onClose} title="Compare neighbourhoods" eyebrow={`UP TO ${MAX} · ${viewLabel}`} width={480}>
      <p className="label mb-2">PICK AREAS</p>
      <div className="mb-5 flex flex-wrap gap-1">
        {neighborhoods.map((n) => {
          const on = ids.includes(n.id);
          return (
            <button
              key={n.id}
              aria-pressed={on}
              onClick={() => toggle(n.id)}
              className={`mono h-7 border px-2 text-[10px] tracking-[0.08em] ${on ? "border-accent bg-accent/10 text-accent" : "border-rule text-ink-faint hover:text-ink"}`}
            >
              {n.name}
            </button>
          );
        })}
      </div>

      {chosen.length === 0 ? (
        <p className="text-sm text-ink-dim">Pick one or more areas to compare.</p>
      ) : (
        <div className="text-[12px]">
          <div className="grid gap-x-3 py-2" style={{ gridTemplateColumns: cols }}>
            <span />
            {chosen.map((n) => (
              <span key={n.id}>
                <span className="block text-[14px] leading-tight">{n.name}</span>
                <span className="label mt-0.5 block">{n.district}</span>
              </span>
            ))}
          </div>

          <p className="label !text-accent mb-0 mt-3">REAL &middot; WEATHER MODEL AT EACH POINT</p>
          {([
            ["TEMP", (id: string) => readings?.[id]?.temperature],
            ["FEELS LIKE", (id: string) => readings?.[id]?.apparent],
          ] as const).map(([label, get]) => {
            const vals = chosen.map((n) => get(n.id));
            return (
              <div key={label} className="grid items-center gap-x-3 py-2 hair-t" style={{ gridTemplateColumns: cols }}>
                <span className="label">{label}</span>
                {chosen.map((n, i) => {
                  const v = vals[i];
                  return (
                    <span key={n.id} className="num text-[18px] font-light" style={{ color: v === undefined ? undefined : heatColor(label === "TEMP" ? v + 4 : v) }}>
                      {v === undefined ? "—" : `${v.toFixed(1)}°`}
                    </span>
                  );
                })}
              </div>
            );
          })}

          <p className="label !text-sodium mb-0 mt-5">SIMULATED &middot; MODELLED FROM ASSUMPTIONS</p>
          {SYSTEM_ORDER.map((key: SystemKey) => {
            const vals = chosen.map((n) => (systems?.areas[n.id] ? areaValue(systems.areas[n.id], key) : null));
            const worst = Math.max(...vals.map((v) => (v === null ? -Infinity : v)));
            return (
              <div key={key} className="grid items-center gap-x-3 py-2 hair-t" style={{ gridTemplateColumns: cols }}>
                <span className="label">{SYSTEM_META[key].title}</span>
                {chosen.map((n, i) => {
                  const v = vals[i];
                  if (v === null) return <span key={n.id} className="text-ink-faint">&mdash;</span>;
                  const b = bandFor(key, v);
                  return (
                    <span key={n.id} className="block">
                      <span className={`mono num text-[13px] tone-${b.tone}`}>
                        {formatSystemValue(key, v)}
                        {key === "noise" && <span className="text-[10px] text-ink-faint"> dB</span>}
                        {chosen.length > 1 && v === worst && vals.some((x) => x !== worst) && <span className="ml-1 text-[9px] text-ink-faint">&#9650;</span>}
                      </span>
                      <Meter value={normalise(key, v)} segments={10} height={4} className={`mt-1 tone-${b.tone}`} />
                      <span className="mono mt-0.5 block text-[9.5px] tracking-[0.08em] text-ink-faint">{b.label}</span>
                    </span>
                  );
                })}
              </div>
            );
          })}
          <p className="label mt-4 normal-case leading-relaxed tracking-[0.03em]">
            &#9650; marks the highest value in a row. Temperatures are the same weather model sampled at each coordinate, so neighbours can read identically. The
            simulated rows come from the area assumptions in <span className="mono">data/karachi/profiles.ts</span>.
          </p>
        </div>
      )}
    </Drawer>
  );
}

export type { FieldItem };
