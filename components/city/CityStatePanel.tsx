import { ArrowRight } from "lucide-react";
import { STATE_ORDER } from "@/lib/city-state";
import type { CityState } from "@/types/city";
import { Pips } from "@/components/ui/Meter";

type Props = {
  state: CityState | null;
  /** state without simulation; rows that differ show "BEFORE -> AFTER" */
  baseState: CityState | null;
  simulated: boolean;
  loading: boolean;
};

/** CITY STATE - deterministic rules over weather + air + time (+ simulation). Rules live in lib/city-state.ts. */
export function CityStatePanel({ state, baseState, simulated, loading }: Props) {
  return (
    <section aria-label="City state" className="anim-rise" style={{ animationDelay: "120ms" }}>
      <h2 className="label !text-ink mb-2">CITY STATE</h2>
      {!state ? (
        loading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="skeleton h-8" />
            ))}
          </div>
        ) : (
          <p className="mono mt-3 text-[11px] leading-relaxed text-ink-faint">WAITING FOR WEATHER &middot; UNAVAILABLE RIGHT NOW</p>
        )
      ) : (
        <ul className="m-0 list-none p-0">
          {STATE_ORDER.map((key, i) => {
            const r = state[key];
            const b = baseState?.[key];
            const changed = simulated && b && b.label !== r.label;
            return (
              <li
                key={key}
                className="anim-rise grid grid-cols-[1fr_auto] items-center gap-x-3 py-1.5 hair-t"
                style={{ animationDelay: `${160 + i * 45}ms` }}
              >
                <div className="min-w-0">
                  <p className="label">{r.title}</p>
                  <p className="tall-only mono mt-0.5 truncate text-[11px] text-ink-faint">{r.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Pips index={r.index} max={r.max} className={`tone-${r.tone}`} />
                  <p className={`mono w-[104px] text-right text-[12px] tracking-[0.12em] tone-${r.tone}`}>
                    {changed && b ? (
                      <span className="flex items-center justify-end gap-1">
                        <span className="text-ink-faint line-through decoration-ink-faint/60">{b.label}</span>
                        <ArrowRight size={10} className="shrink-0 text-sodium" />
                        <span>{r.label}</span>
                      </span>
                    ) : (
                      r.label
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
