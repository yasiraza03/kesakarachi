"use client";

import { Drawer } from "@/components/ui/Drawer";
import type { LayerKey, LayerState } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  layers: LayerState;
  onToggle: (k: LayerKey) => void;
  hasAreaWeather: boolean;
  simActive: boolean;
};

const STACK: { key: LayerKey; name: string; blurb: string; tint: string }[] = [
  { key: "simulation", name: "SIMULATION", blurb: "Draw What-If values onto the map.", tint: "var(--c-sodium)" },
  { key: "air", name: "AIR", blurb: "Dust motes + haze scaled to modelled PM2.5.", tint: "var(--c-dust)" },
  { key: "weather", name: "WEATHER", blurb: "Temperature glow, wind streaks, rain.", tint: "var(--c-sunset)" },
  { key: "landmarks", name: "LANDMARKS", blurb: "Beaches, markets, hospitals, universities.", tint: "var(--c-foam)" },
  { key: "neighborhoods", name: "NEIGHBORHOODS", blurb: "Areas of the city, with local readings.", tint: "var(--c-concrete)" },
  { key: "roads", name: "ROADS", blurb: "The road and rail network.", tint: "var(--c-monsoon)" },
  { key: "base", name: "BASE", blurb: "Land use, buildings and labels.", tint: "var(--c-sea)" },
];

/** The city as a stack of strata: plates you light up or switch off, top layer first. */
export function MapLayers({ open, onClose, layers, onToggle, hasAreaWeather, simActive }: Props) {
  return (
    <Drawer open={open} onClose={onClose} title="Layers of the city" eyebrow="MAP" side="left" width={380}>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 pr-4 [perspective:900px]">
        {STACK.map((l, i) => {
          const on = layers[l.key];
          return (
            <li key={l.key} style={{ transform: `translateX(${i * 4}px)` }}>
              <button
                role="switch"
                aria-checked={on}
                onClick={() => onToggle(l.key)}
                className="group relative flex w-full items-center gap-4 border px-4 py-3 text-left transition-all duration-300"
                style={{
                  borderColor: on ? l.tint : "var(--rule)",
                  background: on ? `color-mix(in srgb, ${l.tint} 12%, transparent)` : "transparent",
                  transform: "rotateX(14deg)",
                }}
              >
                <span aria-hidden="true" className="block h-6 w-9 shrink-0 skew-x-[-24deg] border transition-all duration-300" style={{ borderColor: l.tint, background: on ? l.tint : "transparent", opacity: on ? 0.9 : 0.35 }} />
                <span className="min-w-0 flex-1">
                  <span className={`mono block text-[12px] tracking-[0.16em] ${on ? "text-ink" : "text-ink-faint"}`}>{l.name}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-ink-faint">
                    {l.blurb}
                    {l.key === "weather" && !hasAreaWeather && " (Per-area readings unavailable right now.)"}
                    {l.key === "simulation" && !simActive && " Open What If to use it."}
                  </span>
                </span>
                <span className="mono text-[10px] tracking-[0.14em] text-ink-faint">{on ? "ON" : "OFF"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="label mt-5 normal-case leading-relaxed tracking-[0.03em]">
        Wind and air are single city-wide readings drawn as a uniform field. Neighbourhood temperatures come from the same weather model sampled at each
        area&apos;s coordinates, so they differ only where the model resolves coast and terrain.
      </p>
    </Drawer>
  );
}
