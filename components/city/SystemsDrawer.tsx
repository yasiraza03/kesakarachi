"use client";

import { neighborhoods } from "@/data/karachi/neighborhoods";
import {
  SYSTEM_META, SYSTEM_ORDER, areaValue, bandFor, cityValue, formatSystemValue, type SystemKey, type SystemsResult,
} from "@/lib/systems";
import { Drawer } from "@/components/ui/Drawer";
import { Meter } from "@/components/ui/Meter";
import type { Lens } from "@/components/map/types";

type Props = {
  open: boolean;
  onClose: () => void;
  systems: SystemsResult | null;
  lens: Lens;
  onLens: (l: Lens) => void;
  onPickArea: (id: string) => void;
  viewLabel: string;
};

/** 0..1 for a bar, whatever the unit. */
export function normalise(key: SystemKey, v: number): number {
  if (key === "noise") return (v - 35) / 55;
  if (key === "heat") return (v + 2.5) / 5.5;
  return v / 100;
}

export function SystemsDrawer({ open, onClose, systems, lens, onLens, onPickArea, viewLabel }: Props) {
  const key: SystemKey = lens === "weather" ? "traffic" : lens;
  const meta = SYSTEM_META[key];

  const hot = systems
    ? neighborhoods
        .map((n) => ({ n, v: systems.areas[n.id] ? areaValue(systems.areas[n.id], key) : null }))
        .filter((x): x is { n: (typeof neighborhoods)[number]; v: number } => x.v !== null)
        .sort((a, b) => b.v - a.v)
        .slice(0, 8)
    : [];
  const cityV = systems ? cityValue(systems.city, key) : null;
  const cityBand = cityV === null ? null : bandFor(key, cityV);

  return (
    <Drawer open={open} onClose={onClose} title="City systems" eyebrow="SIMULATION · MODELLED, NOT LIVE" tone="sim" width={440}>
      <div className="stripes mb-4 border border-sodium/40 px-3 py-2">
        <p className="label !text-sodium">SIMULATION</p>
        <p className="mt-1 text-[12.5px] leading-snug text-ink-dim">
          No free live feed exists for these. They are deterministic models over today&apos;s real weather, the time of day and hand-set area assumptions &mdash; for{" "}
          <span className="mono text-ink">{viewLabel}</span>. Pull levers in <span className="text-sodium">What if</span> to change them.
        </p>
      </div>

      <div role="tablist" aria-label="System" className="mb-4 flex flex-wrap gap-1">
        {SYSTEM_ORDER.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={key === k && lens !== "weather"}
            onClick={() => onLens(k)}
            className={`mono h-8 border px-2.5 text-[10.5px] tracking-[0.12em] ${key === k && lens !== "weather" ? "border-sodium bg-sodium/10 text-sodium" : "border-rule text-ink-dim hover:text-ink"}`}
          >
            {SYSTEM_META[k].title}
          </button>
        ))}
        <button onClick={() => onLens("weather")} className={`mono h-8 border px-2.5 text-[10.5px] tracking-[0.12em] ${lens === "weather" ? "border-accent text-accent" : "border-rule text-ink-faint hover:text-ink"}`}>
          MAP: WEATHER
        </button>
      </div>

      {systems && cityV !== null && cityBand && (
        <section aria-label={`${meta.title} citywide`}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="label">{meta.title} &middot; CITYWIDE</p>
              <p className={`num mt-1 text-6xl font-extralight leading-none tracking-tight tone-${cityBand.tone}`}>{formatSystemValue(key, cityV)}</p>
            </div>
            <div className="pb-1 text-right">
              <p className={`mono text-[13px] tracking-[0.16em] tone-${cityBand.tone}`}>{cityBand.label}</p>
              <p className="label mt-1 normal-case tracking-[0.03em]">{meta.unit}</p>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">{meta.blurb}</p>
          {key === "traffic" && systems.eventName && <p className="label mt-2 !text-sodium">EVENT ACTIVE &middot; {systems.eventName.toUpperCase()}</p>}

          <h3 className="label !text-ink mb-2 mt-6">{key === "heat" ? "HOTTEST AREAS" : "WORST AREAS"} &middot; TAP TO FLY THERE</h3>
          <ul className="m-0 list-none p-0">
            {hot.map(({ n, v }) => {
              const b = bandFor(key, v);
              return (
                <li key={n.id}>
                  <button className="grid w-full grid-cols-[1fr_96px_64px] items-center gap-3 py-2 text-left hair-t hover:bg-ink/5" onClick={() => onPickArea(n.id)}>
                    <span className="text-[13px]">{n.name}</span>
                    <Meter value={normalise(key, v)} segments={12} height={6} className={`tone-${b.tone}`} />
                    <span className={`mono num text-right text-[12px] tone-${b.tone}`}>{formatSystemValue(key, v)}{key === "noise" && <span className="text-[10px] text-ink-faint"> dB</span>}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {key === "traffic" && (
            <>
              <h3 className="label !text-ink mb-2 mt-6">CORRIDORS &middot; REAL ROADS, SIMULATED LOAD</h3>
              <ul className="m-0 list-none p-0">
                {[...systems.corridors].sort((a, b) => b.congestion - a.congestion).map((c) => {
                  const b = bandFor("traffic", c.congestion);
                  return (
                    <li key={c.id} className="grid grid-cols-[1fr_96px_64px] items-center gap-3 py-2 hair-t">
                      <span className="text-[13px]">
                        {c.name}
                        {c.works && <span className="mono ml-2 text-[10px] tracking-[0.1em] text-sodium">ROADWORKS</span>}
                      </span>
                      <Meter value={c.congestion / 100} segments={12} height={6} className={`tone-${b.tone}`} />
                      <span className={`mono text-right text-[11px] tracking-[0.06em] tone-${b.tone}`}>{b.label}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <div className="mt-6 border border-rule p-3">
            <p className="label !text-ink">SECURITY &middot; RELATIVE INDEX</p>
            <p className="mt-1.5 flex items-baseline gap-3">
              <span className="num text-3xl font-extralight">{systems.city.security}</span>
              <span className="mono text-[11px] text-ink-faint">baseline 100</span>
            </p>
            <p className="mt-1.5 text-[12px] leading-snug text-ink-faint">
              There is deliberately no area-by-area crime map: we have no reliable data and won&apos;t invent one. This is only a lever. Lowering it nudges late-evening
              activity up in Karachi Pulse.
            </p>
          </div>
        </section>
      )}
      {!systems && <p className="text-sm text-ink-dim">Waiting for weather: the models need it as input.</p>}

      <p className="label mt-6 normal-case leading-relaxed tracking-[0.03em]">
        Area inputs are qualitative assumptions in <span className="mono">data/karachi/profiles.ts</span>. They are not measurements. The map is showing this system
        while this tab is open.
      </p>
    </Drawer>
  );
}
