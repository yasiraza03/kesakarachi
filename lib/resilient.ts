import type { Envelope } from "@/types/city";
import { UPSTREAM_TIMEOUT_MS } from "./constants";

/**
 * Every external dependency goes through here:
 *   timeout  -> AbortSignal.timeout
 *   cache    -> Next.js fetch cache (revalidate) + route-level revalidate
 *   fallback -> last good value held in this server instance, then a bundled fixture
 *
 * Fixtures are always flagged `source: "fixture"` so the UI can say so out loud.
 */

type Good<T> = { data: T; fetchedAt: number };
const lastGood = new Map<string, Good<unknown>>();

export async function fetchJson<T>(url: string, revalidate: number): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    next: { revalidate },
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return (await res.json()) as T;
}

export async function withFallback<T>(opts: {
  key: string;
  provider: string;
  load: () => Promise<T>;
  /** Return bundled reference data, rebased to "now". Omit when no honest fixture exists. */
  fixture?: () => T;
}): Promise<Envelope<T> | null> {
  try {
    const data = await opts.load();
    const fetchedAt = Date.now();
    lastGood.set(opts.key, { data, fetchedAt });
    return { data, meta: { source: "live", fetchedAt, provider: opts.provider } };
  } catch (err) {
    console.error(`[${opts.key}] upstream failed:`, err instanceof Error ? err.message : err);
    const good = lastGood.get(opts.key) as Good<T> | undefined;
    if (good) {
      return { data: good.data, meta: { source: "stale", fetchedAt: good.fetchedAt, provider: opts.provider } };
    }
    if (opts.fixture) {
      return {
        data: opts.fixture(),
        meta: { source: "fixture", fetchedAt: Date.now(), provider: "bundled reference fixture" },
      };
    }
    return null;
  }
}
