"use client";

import { SITE } from "@/lib/constants";

export type BootState = "wait" | "ok" | "fallback" | "off";

type Props = {
  items: { label: string; state: BootState }[];
  leaving: boolean;
};

const WORD: Record<BootState, string> = { wait: "...", ok: "OK", fallback: "FALLBACK", off: "OFFLINE" };
const TONE: Record<BootState, string> = { wait: "text-ink-faint", ok: "text-accent", fallback: "tone-warn", off: "tone-alert" };

/** The boot screen: never a blank page, and it tells the truth about each subsystem. */
export function BootSequence({ items, leaving }: Props) {
  return (
    <div
      className={`fixed inset-0 z-[60] grid place-items-center bg-night transition-opacity duration-[900ms] ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
      role="status"
      aria-live="polite"
      aria-label="Loading kesakarachi"
    >
      <div className="w-[min(88vw,380px)]">
        <p className="urdu text-4xl text-ink-dim" lang="ur" dir="rtl">{SITE.urdu}</p>
        <h1 className="mt-1 text-5xl font-extralight tracking-tight">{SITE.name}</h1>
        <p className="label mb-8 mt-5 !text-accent">
          CONNECTING TO KARACHI<span className="blink">_</span>
        </p>
        <ul className="m-0 list-none p-0">
          {items.map((it, i) => (
            <li key={it.label} className="mono flex items-baseline gap-2 py-1 text-[12px] tracking-[0.12em] anim-rise" style={{ animationDelay: `${i * 90}ms` }}>
              <span className="text-ink-dim">{it.label}</span>
              <span className="min-w-4 flex-1 overflow-hidden whitespace-nowrap text-ink-faint" aria-hidden="true">
                {".".repeat(40)}
              </span>
              <span className={TONE[it.state]}>{WORD[it.state]}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 h-px w-full overflow-hidden bg-rule" aria-hidden="true">
          <div className="h-full bg-accent transition-all duration-700" style={{ width: `${(items.filter((i) => i.state !== "wait").length / items.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
