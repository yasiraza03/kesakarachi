"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { useState } from "react";
import { corridors } from "@/data/karachi/corridors";
import { events } from "@/data/karachi/events";
import { NO_SCENARIO, NO_SIM, SIM_STEPS, isSimActive } from "@/lib/simulation";
import { STATE_ORDER } from "@/lib/city-state";
import { SYSTEM_META, SYSTEM_ORDER, bandFor, cityValue, formatSystemValue, type SystemsResult } from "@/lib/systems";
import type { CityState, Pulse, Scenario, Simulation } from "@/types/city";
import { Drawer } from "@/components/ui/Drawer";

type Props = {
  open: boolean;
  onClose: () => void;
  sim: Simulation;
  onChange: (s: Simulation) => void;
  baseState: CityState | null;
  simState: CityState | null;
  basePulse: Pulse | null;
  simPulse: Pulse | null;
  baseSystems: SystemsResult | null;
  simSystems: SystemsResult | null;
  viewLabel: string;
};

function Steps<T extends number | null>({
  label, hint, options, value, onPick, fmt,
}: {
  label: string; hint: string; options: readonly T[]; value: T; onPick: (v: T) => void; fmt: (v: T) => string;
}) {
  return (
    <div role="group" aria-label={label}>
      <div className="mb-2 flex w-full items-baseline justify-between">
        <span className="label !text-ink">{label}</span>
        <span className="label normal-case tracking-[0.03em]">{hint}</span>
      </div>
      <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-px bg-rule">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={String(o)}
              role="radio"
              aria-checked={active}
              onClick={() => onPick(o)}
              className={`mono h-10 text-[11.5px] tracking-[0.04em] transition-colors ${active ? "bg-sodium text-night" : "bg-night/90 text-ink-dim hover:text-ink"}`}
            >
              {fmt(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Pick({ label, hint, value, onPick, children }: { label: string; hint: string; value: string; onPick: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex w-full items-baseline justify-between">
        <span className="label !text-ink">{label}</span>
        <span className="label normal-case tracking-[0.03em]">{hint}</span>
      </span>
      <select
        value={value}
        onChange={(e) => onPick(e.target.value)}
        className="mono h-10 w-full border border-rule-strong bg-night/90 px-3 text-[12px] tracking-[0.04em] text-ink outline-none focus:border-sodium"
      >
        {children}
      </select>
    </label>
  );
}

const sc = (patch: Partial<Scenario>): Simulation => ({ ...NO_SIM, scenario: { ...NO_SCENARIO, ...patch } });

const PRESETS: { name: string; blurb: string; sim: Simulation }[] = [
  { name: "RUSH HOUR +40%", blurb: "Shahrah-e-Faisal, rush hours only", sim: sc({ corridor: { id: "shahrah-e-faisal", boost: 40, rushOnly: true } }) },
  { name: "SAFER NIGHTS", blurb: "incident index −20%", sim: sc({ crime: -20 }) },
  { name: "HEATWAVE", blurb: "+5°, +10% humidity", sim: { ...NO_SIM, temperature: 5, humidity: 10 } },
  { name: "LOAD-SHEDDING", blurb: "+5° and power supply −25%", sim: { ...NO_SIM, temperature: 5, scenario: { ...NO_SCENARIO, grid: -25 } } },
  { name: "MONSOON", blurb: "heavy rain, +20% humidity", sim: { ...NO_SIM, humidity: 20, rain: 100 } },
  { name: "BLOCKED NULLAHS", blurb: "heavy rain, drainage −25%", sim: { ...NO_SIM, rain: 100, scenario: { ...NO_SCENARIO, drainage: -25 } } },
  { name: "MATCH DAY", blurb: "full house at the stadium", sim: sc({ event: "cricket" }) },
  { name: "EID RUSH", blurb: "Saddar bazaars packed", sim: sc({ event: "eid-shopping" }) },
  { name: "FUEL SHOCK", blurb: "fuel +50%", sim: sc({ fuel: 50 }) },
  { name: "ROADWORKS", blurb: "lane closures on M.A. Jinnah Rd", sim: sc({ works: "ma-jinnah" }) },
  { name: "DRY TAPS", blurb: "+5° and water supply −30%", sim: { ...NO_SIM, temperature: 5, scenario: { ...NO_SCENARIO, water: -30 } } },
  { name: "GRIDLOCK", blurb: "city load +50%", sim: { ...NO_SIM, traffic: 50 } },
];

const worse = (key: keyof CityState, from: number, to: number) => (key === "comfort" ? to < from : to > from);

export function SimulationPanel({ open, onClose, sim, onChange, baseState, simState, basePulse, simPulse, baseSystems, simSystems, viewLabel }: Props) {
  const [tab, setTab] = useState<"weather" | "city">("weather");
  const active = isSimActive(sim);
  const s = sim.scenario;
  const setW = <K extends "temperature" | "humidity" | "rain" | "traffic">(k: K, v: Simulation[K]) => onChange({ ...sim, [k]: v });
  const setS = (patch: Partial<Scenario>) => onChange({ ...sim, scenario: { ...s, ...patch } });

  return (
    <Drawer open={open} onClose={onClose} title="What if?" eyebrow="SIMULATION · DETERMINISTIC" tone="sim" width={420}>
      <p className="mb-4 text-[13px] leading-relaxed text-ink-dim">
        Pull a lever and watch Karachi recalculate for <span className="mono text-ink">{viewLabel}</span>. Plain arithmetic on live weather, time of day and a few
        hand-set assumptions &mdash; no model, no randomness. <span className="text-sodium">None of the city-systems numbers are live data.</span>
      </p>

      <p className="label mb-2">SCENARIOS</p>
      <div className="mb-5 grid grid-cols-2 gap-px bg-rule">
        {PRESETS.map((p) => (
          <button key={p.name} className="bg-night/90 p-2.5 text-left transition-colors hover:bg-sea" onClick={() => onChange(p.sim)}>
            <span className="mono block text-[10.5px] tracking-[0.12em] text-sodium">{p.name}</span>
            <span className="mt-1 block text-[11px] leading-tight text-ink-faint">{p.blurb}</span>
          </button>
        ))}
      </div>

      <div role="tablist" aria-label="Lever groups" className="mb-4 grid grid-cols-2 gap-px bg-rule">
        {([["weather", "WEATHER LEVERS"], ["city", "CITY SYSTEMS LEVERS"]] as const).map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`mono h-9 text-[10.5px] tracking-[0.14em] ${tab === k ? "bg-ink/10 text-ink" : "bg-night/90 text-ink-faint hover:text-ink"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "weather" ? (
        <div className="space-y-5">
          <Steps label="TEMPERATURE" hint="added to air temp" options={SIM_STEPS.temperature} value={sim.temperature} onPick={(v) => setW("temperature", v)} fmt={(v) => `+${v}°`} />
          <Steps label="HUMIDITY" hint="percentage points" options={SIM_STEPS.humidity} value={sim.humidity} onPick={(v) => setW("humidity", v)} fmt={(v) => `+${v}%`} />
          <Steps label="RAIN" hint="rain-chance floor" options={SIM_STEPS.rain} value={sim.rain} onPick={(v) => setW("rain", v)} fmt={(v) => (v === null ? "FORECAST" : `${v}%`)} />
          <Steps label="CITY LOAD" hint="every corridor, every hour" options={SIM_STEPS.traffic} value={sim.traffic} onPick={(v) => setW("traffic", v)} fmt={(v) => (v === 0 ? "NORMAL" : `+${v}%`)} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3 border border-rule p-3">
            <p className="label !text-ink">CORRIDOR TRAFFIC</p>
            <Pick label="CORRIDOR" hint="real road, simulated load" value={s.corridor.id ?? ""} onPick={(v) => setS({ corridor: { ...s.corridor, id: v || null, boost: v ? s.corridor.boost || 40 : 0 } })}>
              <option value="">None</option>
              {corridors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Pick>
            <Steps label="EXTRA TRAFFIC" hint="on that corridor" options={SIM_STEPS.boost} value={s.corridor.boost} onPick={(v) => setS({ corridor: { ...s.corridor, boost: v } })} fmt={(v) => (v === 0 ? "NONE" : `+${v}%`)} />
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={s.corridor.rushOnly} onChange={(e) => setS({ corridor: { ...s.corridor, rushOnly: e.target.checked } })} className="size-4" />
              <span className="mono text-[11px] tracking-[0.08em] text-ink-dim">ONLY DURING RUSH HOURS (7&ndash;10:30, 17&ndash;20:30, not Sundays)</span>
            </label>
          </div>

          <Pick label="EVENT" hint="crowd pulled to a landmark" value={s.event ?? ""} onPick={(v) => setS({ event: v || null })}>
            <option value="">None</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name} &mdash; {e.blurb}</option>
            ))}
          </Pick>
          <Pick label="ROADWORKS" hint="one lane in three closed" value={s.works ?? ""} onPick={(v) => setS({ works: v || null })}>
            <option value="">None</option>
            {corridors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Pick>

          <Steps label="INCIDENT INDEX" hint="relative; baseline 100, not real data" options={SIM_STEPS.crime} value={s.crime} onPick={(v) => setS({ crime: v })} fmt={(v) => (v === 0 ? "TODAY" : `${v > 0 ? "+" : ""}${v}%`)} />
          <Steps label="FUEL PRICE" hint="less driving, more buses" options={SIM_STEPS.fuel} value={s.fuel} onPick={(v) => setS({ fuel: v })} fmt={(v) => (v === 0 ? "TODAY" : `+${v}%`)} />
          <Steps label="BUS / BRT SERVICE" hint="extra capacity" options={SIM_STEPS.transit} value={s.transit} onPick={(v) => setS({ transit: v })} fmt={(v) => (v === 0 ? "TODAY" : `+${v}%`)} />
          <Steps label="POWER SUPPLY" hint="grid shortfall" options={SIM_STEPS.grid} value={s.grid} onPick={(v) => setS({ grid: v })} fmt={(v) => (v === 0 ? "NORMAL" : `${v}%`)} />
          <Steps label="WATER SUPPLY" hint="network shortfall" options={SIM_STEPS.water} value={s.water} onPick={(v) => setS({ water: v })} fmt={(v) => (v === 0 ? "NORMAL" : `${v}%`)} />
          <Steps label="DRAINAGE" hint="nullah capacity" options={SIM_STEPS.drainage} value={s.drainage} onPick={(v) => setS({ drainage: v })} fmt={(v) => (v === 0 ? "NORMAL" : `${v > 0 ? "+" : ""}${v}%`)} />
        </div>
      )}

      <div className="mt-7">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="label !text-ink">RESULT</h3>
          <button className="btn !h-7" onClick={() => onChange(NO_SIM)} disabled={!active} style={{ opacity: active ? 1 : 0.4 }}>
            <RotateCcw size={12} /> Reset all
          </button>
        </div>

        {baseState && simState && basePulse && simPulse && (
          <ul className="m-0 list-none p-0">
            <li className="grid grid-cols-[1fr_auto] items-center py-2.5 hair-t">
              <span className="label !text-ink">KARACHI PULSE</span>
              <span className="mono num text-sm">
                {basePulse.value}
                <ArrowRight size={11} className="mx-1.5 inline text-sodium" />
                <span className={simPulse.value !== basePulse.value ? "text-sodium" : ""}>{simPulse.value}</span>
                <span className="ml-2 text-[11px] text-ink-faint">{simPulse.label}</span>
              </span>
            </li>
            {STATE_ORDER.map((key) => {
              const b = baseState[key];
              const st = simState[key];
              const changed = b.label !== st.label;
              return (
                <li key={key} className="grid grid-cols-[1fr_auto] items-center py-2.5 hair-t">
                  <span className="label">{b.title}</span>
                  <span className="mono text-[12px] tracking-[0.1em]">
                    {changed ? (
                      <>
                        <span className="text-ink-faint">{b.label}</span>
                        <ArrowRight size={11} className="mx-1.5 inline text-sodium" />
                        <span className={worse(key, b.index, st.index) ? "tone-hot" : "tone-sea"}>{st.label}</span>
                      </>
                    ) : (
                      <span className="text-ink-faint">UNCHANGED &middot; {st.label}</span>
                    )}
                  </span>
                </li>
              );
            })}
            {baseSystems && simSystems && (
              <>
                <li className="py-2 hair-t"><span className="label !text-sodium">CITY SYSTEMS &middot; SIMULATED</span></li>
                {SYSTEM_ORDER.map((key) => {
                  const b = cityValue(baseSystems.city, key);
                  const a = cityValue(simSystems.city, key);
                  const bl = bandFor(key, b);
                  const al = bandFor(key, a);
                  const moved = Math.abs(a - b) >= (key === "heat" ? 0.1 : 0.5);
                  return (
                    <li key={key} className="grid grid-cols-[1fr_auto] items-center py-2.5 hair-t">
                      <span className="label">{SYSTEM_META[key].title}</span>
                      <span className="mono text-[12px] tracking-[0.06em]">
                        {moved ? (
                          <>
                            <span className="num text-ink-faint">{formatSystemValue(key, b)}</span>
                            <ArrowRight size={11} className="mx-1.5 inline text-sodium" />
                            <span className={`num tone-${al.tone}`}>{formatSystemValue(key, a)}</span>
                            <span className="ml-2 text-[10.5px] text-ink-faint">{bl.label !== al.label ? `${bl.label} → ${al.label}` : al.label}</span>
                          </>
                        ) : (
                          <span className="text-ink-faint">UNCHANGED &middot; {al.label}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
                <li className="grid grid-cols-[1fr_auto] items-center py-2.5 hair-t">
                  <span className="label">INCIDENT INDEX</span>
                  <span className="mono num text-[12px]">
                    {baseSystems.city.security}
                    <ArrowRight size={11} className="mx-1.5 inline text-sodium" />
                    <span className={simSystems.city.security !== baseSystems.city.security ? "text-sodium" : ""}>{simSystems.city.security}</span>
                    <span className="ml-2 text-[10.5px] text-ink-faint">RELATIVE</span>
                  </span>
                </li>
              </>
            )}
          </ul>
        )}
      </div>

      <p className="label mt-6 normal-case leading-relaxed tracking-[0.03em]">
        The incident index is a relative lever (baseline 100), not crime data: it only nudges late-evening activity. Every rule is listed in the Method drawer
        (<span className="kbd">I</span>) and written out in <span className="mono">lib/systems.ts</span>.
      </p>
    </Drawer>
  );
}
