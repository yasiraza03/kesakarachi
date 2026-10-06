"use client";

import {
  ACTIVITY_BANDS, AIR_BANDS, COMFORT_BANDS, HEAT_BANDS, HUMIDITY_BANDS, RAIN_BANDS, WIND_BANDS, type Band,
} from "@/lib/city-state";
import { PULSE_BANDS, RHYTHM } from "@/lib/pulse";
import { Drawer } from "@/components/ui/Drawer";
import type { Pulse } from "@/types/city";

type Props = { open: boolean; onClose: () => void; pulse: Pulse | null };

const TABLES: { title: string; unit: string; bands: Band[] }[] = [
  { title: "HEAT", unit: "apparent temperature, °C", bands: HEAT_BANDS },
  { title: "HUMIDITY", unit: "relative humidity, %", bands: HUMIDITY_BANDS },
  { title: "AIR", unit: "US AQI (modelled)", bands: AIR_BANDS },
  { title: "WIND", unit: "km/h", bands: WIND_BANDS },
  { title: "RAIN", unit: "chance, % (measured rain overrides: FALLING ≥ 0.1 mm, HEAVY ≥ 4 mm)", bands: RAIN_BANDS },
  { title: "ACTIVITY", unit: "assumed rhythm × traffic lever, 0–100", bands: ACTIVITY_BANDS },
  { title: "COMFORT", unit: "comfort score, 0–100", bands: COMFORT_BANDS },
];

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="label !text-accent mb-3 mt-9 first:mt-0">{children}</h3>;
}

export function MethodDrawer({ open, onClose, pulse }: Props) {
  return (
    <Drawer open={open} onClose={onClose} title="How it works" eyebrow="METHOD · NOTHING HIDDEN" width={470}>
      <p className="text-[13px] leading-relaxed text-ink-dim">
        Everything on screen is either a number from a public weather model, a fixed table in this repository, or arithmetic over the two. There is no
        language model and no randomness. The code for every rule below is in <span className="mono text-ink">lib/</span>.
      </p>

      <H>KARACHI PULSE &middot; EXPERIMENTAL COMPOSITE INDEX</H>
      <p className="mono text-[12px] leading-relaxed text-ink-dim">pulse = &Sigma; weight &times; score &nbsp;(each score 0&ndash;100)</p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-faint">
        Not an official metric and not scientific: the weights are a judgement call, chosen so the number moves the way the city feels. Labels:{" "}
        {PULSE_BANDS.map((b, i) => (
          <span key={b.label} className="mono">{i > 0 && " · "}{b.label}{Number.isFinite(b.max) ? ` <${b.max}` : " ≥80"}</span>
        ))}
        .
      </p>
      {pulse && (
        <table className="mono mt-4 w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="text-left text-ink-faint">
              <th className="py-1.5 font-normal">FACTOR</th><th className="font-normal">WEIGHT</th><th className="font-normal">SCORE</th><th className="text-right font-normal">ADDS</th>
            </tr>
          </thead>
          <tbody>
            {pulse.components.map((p) => (
              <tr key={p.key} className="hair-t align-top">
                <td className="py-1.5 pr-2">
                  {p.label}
                  <span className="block text-[10.5px] text-ink-faint">{p.detail}</span>
                </td>
                <td className="num pr-2">{Math.round(p.weight * 100)}%</td>
                <td className="num pr-2">{p.score.toFixed(0)}</td>
                <td className="num text-right text-ink">{(p.weight * p.score).toFixed(1)}</td>
              </tr>
            ))}
            <tr className="hair-t">
              <td colSpan={3} className="py-1.5 text-ink-faint">PULSE (right now, as shown)</td>
              <td className="num text-right text-accent">{pulse.value}</td>
            </tr>
          </tbody>
        </table>
      )}

      <p className="label mb-2 mt-5">ASSUMED CITY RHYTHM BY HOUR (A MODELLING ASSUMPTION, NOT MEASURED)</p>
      <svg viewBox="0 0 240 48" className="w-full" role="img" aria-label="Assumed city activity by hour of day">
        {RHYTHM.map((v, h) => (
          <rect key={h} x={h * 10 + 1} y={44 - v * 0.42} width="8" height={Math.max(1, v * 0.42)} fill="var(--accent)" opacity="0.75" />
        ))}
        <line x1="0" x2="240" y1="44.5" y2="44.5" stroke="var(--rule-strong)" />
      </svg>
      <div className="mono mt-1 flex justify-between text-[10px] text-ink-faint"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>

      <H>CITY STATE &middot; THE RULES</H>
      <p className="mb-3 text-[12.5px] leading-relaxed text-ink-faint">Each reading is the first band whose limit the value is below. These tables are the same objects the code evaluates.</p>
      <div className="space-y-5">
        {TABLES.map((t) => (
          <div key={t.title}>
            <p className="label !text-ink">{t.title} <span className="normal-case tracking-[0.03em] text-ink-faint">&middot; {t.unit}</span></p>
            <p className="mono mt-1.5 text-[11.5px] leading-relaxed text-ink-dim">
              {t.bands.map((b, i) => (
                <span key={b.label} className="mr-3 inline-block whitespace-nowrap">
                  <span className={`tone-${b.tone}`}>{b.label}</span>{" "}
                  <span className="text-ink-faint">{Number.isFinite(b.max) ? `<${b.max}` : `≥${t.bands[i - 1]?.max ?? 0}`}</span>
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      <H>WHAT IF &middot; SIMULATION RULES</H>
      <ul className="m-0 list-none space-y-2 p-0 text-[12.5px] leading-relaxed text-ink-dim">
        <li><span className="mono text-sodium">TEMP</span> adds &deg;C to air temperature. Apparent temperature moves by the Steadman (BoM) formula&apos;s delta, so humidity and wind still matter.</li>
        <li><span className="mono text-sodium">HUMIDITY</span> adds percentage points, capped at 100%.</li>
        <li><span className="mono text-sodium">RAIN</span> sets a floor on rain chance. 50% assumes 0.5 mm/h, 100% assumes 5 mm/h; sky becomes rain and cloud &ge;80%.</li>
        <li><span className="mono text-sodium">TRAFFIC</span> multiplies the assumed activity curve. There is no live traffic data anywhere in this app.</li>
      </ul>

      <H>CITY SYSTEMS &middot; SIMULATION RULES</H>
      <p className="mb-3 text-[12.5px] leading-relaxed text-ink-faint">
        No free live feed exists for these, so they are models: today&apos;s real weather + the time of day + hand-set area assumptions
        (<span className="mono">data/karachi/profiles.ts</span>) + your levers. They never touch the live readings and are always labelled SIMULATION.
      </p>
      <ul className="m-0 list-none space-y-2.5 p-0 text-[12.5px] leading-relaxed text-ink-dim">
        <li><span className="mono text-sodium">TRAFFIC</span> per corridor: 100 &times; daily shape (commuter peaks ~08:50 and ~18:35, commercial afternoon, leisure evening; Sundays &times;0.62, Friday-prayer lull) &times; (0.5 + 0.5 &times; corridor weight) &times; rain factor (up to +45%) &times; city load &times; corridor boost (rush hours only if ticked) &times; event &times; (1 &minus; 0.2 &times; fuel) &times; (1 &minus; 0.06 &times; transit); roadworks divide by 0.7. Then index = 100 &times; (1 &minus; e<sup>&minus;load/70</sup>). Lines are drawn on the real roads, matched by name in the map tiles.</li>
        <li><span className="mono text-sodium">FLOODING</span> per area: (rain in the last 6 h + 2 &times; current mm/h) / 40 mm &times; (0.35 + 0.9 &times; low-lying assumption) &divide; (1 + drainage change). City value is the mean of the worst three areas.</li>
        <li><span className="mono text-sodium">POWER</span>: demand = 60% cooling (apparent 24&ndash;44&deg;C) + 30% evening/afternoon peak + 10% humidity; stress = 0.85 &times; demand &times; 100/(100 + supply change). Area risk &times; (0.55 + 0.9 &times; grid-vulnerability assumption).</li>
        <li><span className="mono text-sodium">WATER</span>: demand = 55% heat + 15% dry air + 25 base; stress = 0.8 &times; demand &times; 100/(100 + supply change). Area stress &times; (0.5 + 0.9 &times; network-reliability assumption).</li>
        <li><span className="mono text-sodium">TRANSIT</span>: commuter shape &times; 1.25 if raining &times; (1 + 0.004 &times; fuel %) &divide; (1 + extra service), squashed to 0&ndash;100; areas scale with density; events add crowds nearby.</li>
        <li><span className="mono text-sodium">NOISE</span> (est. dBA): 38 + 0.28 &times; area traffic + 6 &times; industrial + 3 &times; density + evening street life (&le;7) + event crowd (fades to zero at the event radius).</li>
        <li><span className="mono text-sodium">HEAT ISLAND</span> (&deg;C added to the real model reading): 2.2 &times; density + 1.2 &times; industrial &minus; 1.6 &times; green &minus; sea-breeze cooling, &times;0.7 by day, &times;1 at night, clamped to &minus;2.5&hellip;+3.</li>
        <li><span className="mono text-sodium">INCIDENT INDEX</span>: baseline 100, scaled by the lever. It is <b className="font-medium text-ink">not</b> crime data and has no area map. Each &minus;1% lifts late-evening activity 0.5% in Karachi Pulse.</li>
        <li><span className="mono text-sodium">EVENTS</span>: a crowd at a landmark whose traffic, noise and transit pull fade linearly to zero at its radius, plus extra load on named corridors. Nothing says an event is actually happening.</li>
      </ul>

      <H>HISTORY &middot; REAL DATA</H>
      <p className="text-[12.5px] leading-relaxed text-ink-dim">
        The &ldquo;this date, in the record&rdquo; drawer is real: ten years of daily highs, lows and rain from the Open-Meteo archive (ERA5 reanalysis), averaged
        &plusmn;3 days around today&apos;s date for each year, compared with today&apos;s forecast high.
      </p>

      <H>DATA SOURCES</H>
      <table className="mono w-full border-collapse text-[11.5px]">
        <tbody>
          {[
            ["Weather", "Open-Meteo forecast API", "cached 10 min"],
            ["Air quality", "Open-Meteo air-quality API (CAMS model)", "cached 20 min"],
            ["Prayer times", "Aladhan, Univ. of Islamic Sciences Karachi method", "cached 6 h"],
            ["History", "Open-Meteo archive API (ERA5)", "cached 24 h"],
            ["City systems", "Deterministic models in lib/systems.ts", "SIMULATION"],
            ["Basemap", "OpenFreeMap (OpenMapTiles, OpenStreetMap)", "tiles"],
            ["Areas & landmarks", "Static reference data in /data/karachi", "approximate positions"],
          ].map(([a, b, c]) => (
            <tr key={a} className="hair-t align-top">
              <td className="py-1.5 pr-3 text-ink">{a}</td>
              <td className="pr-3 text-ink-dim">{b}</td>
              <td className="text-right text-ink-faint">{c}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <H>LIMITS, STATED PLAINLY</H>
      <ul className="m-0 list-disc space-y-2 pl-4 text-[12.5px] leading-relaxed text-ink-dim marker:text-ink-faint">
        <li>Air quality is <b className="font-medium text-ink">modelled</b> at a coarse grid. It is not a reading from a station in your street.</li>
        <li>Neighbourhood temperatures are the weather model sampled at each coordinate. They differ only where the model resolves coast and terrain.</li>
        <li>Wind and air layers are single city-wide values drawn as a uniform field.</li>
        <li>Traffic, flooding, power, water, transit, noise and incidents are <b className="font-medium text-ink">simulations</b>: no reliable free live source exists, so they are labelled SIMULATION everywhere and never presented as readings. There is no area-level crime data or map.</li>
        <li>The area assumptions behind the simulations are qualitative and hand-set. Treat the output as a thinking tool, not a forecast.</li>
        <li>If a data source is down you will see it labelled stale, or labelled as offline reference data. It is never presented as live.</li>
      </ul>
      <p className="label mt-8 normal-case leading-relaxed tracking-[0.03em]">
        Map &copy; OpenFreeMap &middot; data &copy; OpenMapTiles &amp; OpenStreetMap contributors. Weather and air by Open-Meteo.com (CC BY 4.0).
      </p>
    </Drawer>
  );
}
