"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-live";

/** Eases a number toward its target. Snaps instantly under prefers-reduced-motion. */
export function useTween(target: number, duration = 650): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const shown = useRef(target);

  useEffect(() => {
    if (reduced || duration <= 0) {
      shown.current = target;
      from.current = target;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- snapping to the new target is the whole point
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = shown.current;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = origin + (target - origin) * eased;
      shown.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  return value;
}
