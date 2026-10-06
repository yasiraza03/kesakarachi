import type { StreetLine } from "@/lib/lifestyle";

export function StreetRead({ lines, simulated }: { lines: StreetLine[]; simulated: boolean }) {
  if (!lines.length) return null;
  return (
    <section aria-label="Street read" className="anim-rise" style={{ animationDelay: "260ms" }}>
      <h2 className="label !text-ink mb-2 flex items-center gap-2">
        STREET READ
        {simulated && <span className="!text-sodium">&middot; SIMULATED</span>}
      </h2>
      <ul className="m-0 list-none p-0">
        {lines.map((l, i) => (
          <li key={l.tag} className={`grid-cols-[84px_1fr] gap-x-3 py-2 hair-t ${i >= 2 ? "tall-grid" : "grid"}`}>
            <span className={`mono pt-0.5 text-[10.5px] tracking-[0.14em] tone-${l.tone}`}>{l.tag}</span>
            <span className="text-[13px] leading-snug text-ink-dim">{l.text}</span>
          </li>
        ))}
      </ul>
      <p className="label tall-only mt-1 normal-case tracking-[0.03em]">Plain rules over the numbers above. No model, no invention.</p>
    </section>
  );
}
