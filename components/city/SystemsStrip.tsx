import { SYSTEM_META, bandFor, cityValue, formatSystemValue, type SystemKey, type SystemsResult } from "@/lib/systems";
import type { Lens } from "@/components/map/types";

const SHOWN: SystemKey[] = ["traffic", "flood", "power", "water"];

type Props = {
  systems: SystemsResult | null;
  lens: Lens;
  onOpen: (k: SystemKey) => void;
};

/** Four simulated systems at a glance. Every cell says SIMULATED, so nobody mistakes it for a live feed. */
export function SystemsStrip({ systems, lens, onOpen }: Props) {
  return (
    <section aria-label="Simulated city systems" className="anim-rise" style={{ animationDelay: "200ms" }}>
      <h2 className="label !text-ink mb-2 flex items-center gap-2">
        CITY SYSTEMS <span className="stripes px-1.5 py-0.5 !text-sodium">SIMULATED</span>
      </h2>
      <div className="grid grid-cols-2 gap-px bg-rule">
        {SHOWN.map((k) => {
          const v = systems ? cityValue(systems.city, k) : null;
          const b = v === null ? null : bandFor(k, v);
          return (
            <button
              key={k}
              onClick={() => onOpen(k)}
              data-active={lens === k}
              className="bg-night/90 p-2.5 text-left transition-colors hover:bg-sea data-[active=true]:bg-sodium/10"
              aria-label={`${SYSTEM_META[k].title}: ${b ? b.label : "no data"}. Simulated. Open details.`}
            >
              <span className="label block">{SYSTEM_META[k].title}</span>
              <span className={`mono mt-1 block text-[12px] tracking-[0.1em] ${b ? `tone-${b.tone}` : "text-ink-faint"}`}>{b ? b.label : "—"}</span>
              <span className="mono num mt-0.5 block text-[10.5px] text-ink-faint">{v === null ? "" : formatSystemValue(k, v)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
