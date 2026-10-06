"use client";

import dynamic from "next/dynamic";
import { SITE } from "@/lib/constants";

/**
 * The whole instrument is browser-only (map, canvas, live clock), so it is loaded client-side.
 * This shell is server-rendered, so there is never a blank white screen while the bundle arrives.
 */
const CityApp = dynamic(() => import("./CityApp").then((m) => m.CityApp), {
  ssr: false,
  loading: () => <StaticBoot />,
});

export function AppLoader() {
  return <CityApp />;
}

function StaticBoot() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-night">
      <div className="text-center">
        <p className="label mb-4 !text-accent">CONNECTING TO KARACHI<span className="blink">_</span></p>
        <h1 className="text-4xl font-light tracking-tight">{SITE.name}</h1>
        <p className="urdu mt-3 text-lg text-ink-faint" lang="ur" dir="rtl">{SITE.urdu}</p>
      </div>
    </div>
  );
}
