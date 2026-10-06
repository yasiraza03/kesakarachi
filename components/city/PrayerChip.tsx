import { nextPrayer } from "@/lib/lifestyle";
import { formatClock, formatDuration } from "@/lib/time";
import type { Meta, PrayerData } from "@/types/city";

type Props = { prayer: PrayerData | null; meta: Meta | null; now: number; className?: string };

/** Next prayer time (Aladhan, University of Islamic Sciences Karachi method). Hidden entirely if the source is down. */
export function PrayerChip({ prayer, meta, now, className = "" }: Props) {
  const next = now ? nextPrayer(prayer, now) : null;
  if (!next) return null;
  return (
    <p className={`label flex items-baseline gap-2 ${className}`} title={prayer ? `${prayer.method}${meta ? ` · via ${meta.provider}` : ""}` : undefined}>
      <span>NEXT PRAYER</span>
      <span className="!text-accent">{next.name.toUpperCase()}</span>
      <span className="num text-ink">{formatClock(next.t)}</span>
      <span>in {formatDuration(next.inMs)}</span>
    </p>
  );
}
