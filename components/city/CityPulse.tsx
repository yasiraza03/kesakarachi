"use client";

import { Info } from "lucide-react";
import type { Pulse } from "@/types/city";
import { Meter } from "@/components/ui/Meter";
import { useTween } from "@/components/ui/useTween";

type Props = {
  pulse: Pulse | null;
  /** pulse without the simulation applied, to show "74 -> 86" */
  basePulse: Pulse | null;
  simulated: boolean;
  loading: boolean;
  onInfo: () => void;
};

export function CityPulse({ pulse, basePulse, simulated, loading, onInfo }: Props) {
  const v = useTween(pulse?.value ?? 0, 800);
  const drivers = pulse
    ? [...pulse.components].map((p) => ({ ...p, contrib: p.weight * p.score })).sort((a, b) => b.contrib - a.contrib).slice(0, 3)
    : [];
  const delta = pulse && basePulse && simulated ? pulse.value - basePulse.value : 0;

  return (
    <section aria-label="Karachi Pulse" className="anim-rise">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="label !text-ink">KARACHI PULSE</h2>
          <p className="label mt-1 normal-case tracking-[0.04em]">experimental composite index</p>
        </div>
        <button className="btn !h-7 !px-2" onClick={onInfo} aria-label="How Karachi Pulse is calculated">
          <Info size={13} />
        </button>
      </div>

      {!pulse ? (
        loading ? (
          <div className="mt-4 space-y-3" aria-busy="true">
            <div className="skeleton h-20 w-32" />
            <div className="skeleton h-3" />
          </div>
        ) : (
          <p className="mono mt-3 text-[11px] leading-relaxed text-ink-faint">WAITING FOR WEATHER &middot; UNAVAILABLE RIGHT NOW</p>
        )
      ) : (
        <>
          <div className="mt-2 flex items-end gap-4">
            <p className={`num text-[clamp(60px,9vh,88px)] font-extralight leading-[0.85] tracking-[-0.05em] ${simulated ? "text-sodium" : ""}`} aria-label={`Pulse ${pulse.value} out of 100, ${pulse.label}`}>
              {Math.round(v)}
            </p>
            <div className="pb-1.5">
              <p className={`text-sm font-medium tracking-[0.2em] ${simulated ? "tone-warn" : "text-accent"}`}>{pulse.label}</p>
              {simulated && basePulse && (
                <p className="mono num mt-1 text-[11px] text-ink-dim">
                  {basePulse.value} &rarr; {pulse.value} <span className={delta > 0 ? "tone-hot" : "tone-sea"}>({delta > 0 ? "+" : ""}{delta})</span>
                </p>
              )}
            </div>
          </div>
          <Meter value={pulse.value / 100} segments={40} height={12} className={`mt-4 ${simulated ? "text-sodium" : "text-accent"}`} />
          <div className="mono mt-1.5 hidden justify-between text-[10px] text-ink-faint [@media(min-height:900px)]:flex" aria-hidden="true">
            <span>0</span><span>DORMANT</span><span>CALM</span><span>STEADY</span><span>ACTIVE</span><span>SURGING</span><span>100</span>
          </div>
          <p className="mono mt-3 text-[11px] leading-relaxed text-ink-dim">
            <span className="label mr-2">DRIVEN BY</span>
            {drivers.map((d, i) => (
              <span key={d.key}>
                {i > 0 && " · "}
                {d.label.toUpperCase()} <span className="num text-ink">+{d.contrib.toFixed(0)}</span>
              </span>
            ))}
          </p>
        </>
      )}
    </section>
  );
}
