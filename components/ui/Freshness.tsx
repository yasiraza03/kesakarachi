import type { Meta } from "@/types/city";
import { formatAgo, formatClock } from "@/lib/time";

type Props = {
  label: string;
  meta: Meta | null;
  /** the most recent refresh failed, so what we're showing is older than it should be */
  stale: boolean;
  now: number;
  className?: string;
};

/**
 * Every live module carries one of these. It never implies real-time data it doesn't have:
 * relative age, provider, and a loud flag when the data is a fixture or stale.
 */
export function Freshness({ label, meta, stale, now, className = "" }: Props) {
  if (!meta) {
    return (
      <p className={`label ${className}`}>
        {label} <span className="text-ink-dim">&middot; unavailable</span>
      </p>
    );
  }
  const age = now ? formatAgo(now - meta.fetchedAt) : "…";
  const isFixture = meta.source === "fixture";
  const isStale = !isFixture && (stale || meta.source === "stale");
  return (
    <p className={`label flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <span>{label}</span>
      {isFixture ? (
        <span className="tone-alert">OFFLINE REFERENCE DATA &middot; NOT LIVE</span>
      ) : (
        <>
          <span className="text-ink-dim">UPDATED {age.toUpperCase()}</span>
          {isStale && <span className="tone-warn">STALE &middot; LAST OK {formatClock(meta.fetchedAt, { hour12: true })}</span>}
        </>
      )}
      <span className="hidden text-ink-faint sm:inline">&middot; {meta.provider}</span>
    </p>
  );
}
