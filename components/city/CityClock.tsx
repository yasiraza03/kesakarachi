import { formatClock, formatDateLong, formatWeekday } from "@/lib/time";
import type { TimePhase } from "@/types/city";

type Props = {
  now: number;
  phase: TimePhase;
  variant?: "bar" | "focus";
};

/** Karachi time (UTC+5). Uses the browser clock, converted by hand - no API, no Intl surprises. */
export function CityClock({ now, phase, variant = "bar" }: Props) {
  if (!now) return <div className="h-10" aria-hidden="true" />;
  const time = formatClock(now, { seconds: true });
  const [hm, ss] = [time.slice(0, 5), time.slice(6)];

  if (variant === "focus") {
    return (
      <div className="text-right" role="timer" aria-label={`Karachi time ${formatClock(now, { hour12: true })}`}>
        <p className="mono num text-5xl font-extralight tracking-tight sm:text-7xl">
          {hm}
          <span className="text-ink-faint">:{ss}</span>
        </p>
        <p className="label mt-2">
          {formatWeekday(now)} &middot; {formatDateLong(now)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-3" role="timer" aria-label={`Karachi time ${formatClock(now, { hour12: true })}`}>
      <p className="mono num text-[22px] font-light leading-none tracking-tight sm:text-2xl">
        {hm}
        <span className="text-ink-faint">:{ss}</span>
      </p>
      <p className="label hidden leading-snug 2xl:block">
        {formatWeekday(now)}
        <br />
        {formatDateLong(now)}
      </p>
      <p className="label !text-accent hidden xl:block">{phase}</p>
    </div>
  );
}
