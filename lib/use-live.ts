"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Envelope } from "@/types/city";

export type LiveStatus = "loading" | "ready" | "failed";

export type Live<T> = {
  /** Last good payload (kept even after a later failure). null = nothing yet, or the route had nothing honest to give. */
  env: Envelope<T> | null;
  status: LiveStatus;
  /** true when the most recent refresh failed and `env` is older data */
  stale: boolean;
  /** true once a first request has settled (success or failure) */
  settled: boolean;
  refresh: () => void;
};

const CLIENT_TIMEOUT_MS = 12_000;

/**
 * Fetch one of our own /api routes, keep the last good result, refresh on an interval and when the tab
 * becomes visible again after being hidden. Each hook instance fails on its own - one dead module never
 * takes another down.
 */
export function useLive<T>(url: string, refreshMs: number, storageKey: string): Live<T> {
  // Seed from the last session so a failed first request still has something to show (flagged stale).
  // This hook only runs in the browser (the app shell is client-only), so reading storage here is safe.
  const [env, setEnv] = useState<Envelope<T> | null>(() => {
    try {
      const saved = typeof window === "undefined" ? null : localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as Envelope<T>) : null;
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState<LiveStatus>("loading");
  const [stale, setStale] = useState(false);
  const [settled, setSettled] = useState(false);
  const lastOk = useRef(0);
  const inflight = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    inflight.current?.abort();
    const ctl = new AbortController();
    inflight.current = ctl;
    const timer = setTimeout(() => ctl.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctl.signal });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as Envelope<T> | null;
      if (body && body.data) {
        setEnv(body);
        setStale(false);
        setStatus("ready");
        lastOk.current = Date.now();
        try {
          localStorage.setItem(storageKey, JSON.stringify(body));
        } catch {
          /* storage may be unavailable (private mode) */
        }
      } else {
        // Route answered but had nothing honest to offer (e.g. prayer times with upstream down).
        setStatus("failed");
        setStale(true);
      }
    } catch {
      setStale(true);
      setStatus("failed");
    } finally {
      clearTimeout(timer);
      setSettled(true);
    }
  }, [url, storageKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the initial fetch on mount
    void load();
    const id = setInterval(() => void load(), refreshMs);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastOk.current > refreshMs) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      inflight.current?.abort();
    };
  }, [load, refreshMs]);

  return { env, status, stale, settled, refresh: () => void load() };
}

/** A ticking "now" in epoch ms. Starts at 0 on the first render so server and client markup never mismatch. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => (typeof window === "undefined" ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches));
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
