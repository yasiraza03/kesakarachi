"use client";

import {
  Activity, Ellipsis, FlaskConical, GitCompare, History, Info, Keyboard, Layers, Maximize2, Search, X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { REFRESH_MS, SITE } from "@/lib/constants";
import { computeCityState, headline } from "@/lib/city-state";
import { conditionsAt, conditionsFromHour } from "@/lib/conditions";
import { streetRead } from "@/lib/lifestyle";
import { computePulse } from "@/lib/pulse";
import { NO_SIM, applySimulation, isSimActive, simSummary } from "@/lib/simulation";
import { activityLever, computeSystems, rainLast6h, type SystemKey } from "@/lib/systems";
import { NO_SIM as NO_SIM_BASE } from "@/lib/simulation";
import { events } from "@/data/karachi/events";
import { landmarks } from "@/data/karachi/landmarks";
import { HOUR_MS, dayFor, formatHourLabel, formatShortWeekday, startOfLocalDay, startOfLocalHour, timePhase } from "@/lib/time";
import { useLive, useNow, usePrefersReducedMotion } from "@/lib/use-live";
import type { AirData, HistoryData, PrayerData, Simulation, TimePhase, WeatherData } from "@/types/city";
import { Drawer } from "./ui/Drawer";
import { AreaInspector } from "./city/AreaInspector";
import { BootSequence, type BootState } from "./city/BootSequence";
import { CityClock } from "./city/CityClock";
import { CityPulse } from "./city/CityPulse";
import { CityStatePanel } from "./city/CityStatePanel";
import { CommandPalette, type PaletteAction } from "./city/CommandPalette";
import { CompareDrawer } from "./city/CompareDrawer";
import { MoreMenu } from "./city/MoreMenu";
import { SystemsDrawer } from "./city/SystemsDrawer";
import { SystemsStrip } from "./city/SystemsStrip";
import { HistoryDrawer } from "./weather/HistoryDrawer";
import { FocusMode } from "./city/FocusMode";
import { MethodDrawer } from "./city/MethodDrawer";
import { PrayerChip } from "./city/PrayerChip";
import { ShortcutsHelp } from "./city/ShortcutsHelp";
import { SimulationPanel } from "./city/SimulationPanel";
import { StreetRead } from "./city/StreetRead";
import { AirQuality } from "./air/AirQuality";
import { AtmosphereCanvas } from "./map/AtmosphereCanvas";
import { MapControls } from "./map/MapControls";
import { MapLayers } from "./map/MapLayers";
import { DEFAULT_LAYERS, type AreaReading, type Lens, type LayerKey, type LayerState, type MapField, type MapHandle, type Selection } from "./map/types";
import { WeatherArc } from "./weather/WeatherArc";
import { Readouts, WeatherHero } from "./weather/WeatherNow";
import { WeatherTimeline } from "./weather/WeatherTimeline";
import type { SeriesPoint } from "./weather/series";
import { SYSTEM_META } from "@/lib/systems";

// MapLibre is the heavy part of the bundle: load it on demand, never on the server.
const KarachiMap = dynamic(() => import("./map/KarachiMap").then((m) => m.KarachiMap), { ssr: false });

type Panel = "sim" | "layers" | "method" | "air" | "help" | "systems" | "history" | "compare" | "more" | null;

const DOCK_H = 206;
const NO_PAD = { top: 0, right: 0, bottom: 0, left: 0 };

function useMedia(query: string): boolean {
  const [m, setM] = useState(() => (typeof window === "undefined" ? false : window.matchMedia(query).matches));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function CityApp() {
  const reduced = usePrefersReducedMotion();
  const desktop = useMedia("(min-width: 1024px)");
  const now = useNow(1000);
  const nowMin = now ? Math.floor(now / 60_000) * 60_000 : 0;

  const weather = useLive<WeatherData>("/api/weather", REFRESH_MS.weather, "kk:weather:v1");
  const air = useLive<AirData>("/api/air", REFRESH_MS.air, "kk:air:v1");
  const prayer = useLive<PrayerData>("/api/prayer", REFRESH_MS.prayer, "kk:prayer:v1");
  const history = useLive<HistoryData>("/api/history", REFRESH_MS.history, "kk:history:v1");
  const w = weather.env?.data ?? null;
  const a = air.env?.data ?? null;

  const mapHandle = useRef<MapHandle>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  const [selT, setSelT] = useState<number | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [simState, setSimState] = useState<Simulation>(NO_SIM);
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [panel, setPanel] = useState<Panel>(null);
  const [palette, setPalette] = useState(false);
  const [focus, setFocus] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [lens, setLens] = useState<Lens>("weather");
  const [compareIds, setCompareIds] = useState<string[]>(["clifton", "saddar", "gulshan"]);

  /* ───────────── boot ───────────── */
  const [boot, setBoot] = useState<"booting" | "leaving" | "done">("booting");
  const bootStart = useRef(0);
  useEffect(() => {
    bootStart.current = Date.now();
  }, []);
  const allSettled = weather.settled && air.settled && prayer.settled && (mapReady || mapFailed);
  useEffect(() => {
    if (boot !== "booting") return;
    const elapsed = Date.now() - bootStart.current;
    const minWait = Math.max(0, 1500 - elapsed);
    const hardCap = Math.max(0, 9000 - elapsed);
    const t = setTimeout(() => setBoot("leaving"), allSettled ? minWait : hardCap);
    return () => clearTimeout(t);
  }, [allSettled, boot]);
  useEffect(() => {
    if (boot !== "leaving") return;
    mapHandle.current?.intro();
    const t = setTimeout(() => setBoot("done"), 1000);
    return () => clearTimeout(t);
  }, [boot]);

  const dataState = (live: { env: unknown; settled: boolean }, src?: string): BootState =>
    !live.settled ? (live.env ? (src === "live" ? "ok" : "wait") : "wait") : !live.env ? "off" : src === "live" ? "ok" : "fallback";
  const bootItems: { label: string; state: BootState }[] = [
    { label: "WEATHER", state: dataState(weather, weather.env?.meta.source) },
    { label: "AIR", state: dataState(air, air.env?.meta.source) },
    { label: "PRAYER TIMES", state: prayer.settled ? (prayer.env ? "ok" : "off") : "wait" },
    { label: "MAP", state: mapFailed ? "off" : mapReady ? "ok" : "wait" },
    { label: "CITY STATE", state: w ? "ok" : weather.settled ? "off" : "wait" },
  ];

  /* ───────────── the engines: conditions -> simulation -> pulse + city state ───────────── */
  const simActive = isSimActive(simState);
  const viewT = selT ?? nowMin;

  const base = useMemo(() => (nowMin ? conditionsAt(w, a, selT, nowMin) : null), [w, a, selT, nowMin]);
  const sim = useMemo(() => (base ? applySimulation(base, simState) : null), [base, simState]);
  // One activity lever feeds Pulse + City State: traffic lever, safer-nights effect, event lift, fuel damping.
  const lever = useMemo(() => (viewT ? activityLever(simState, viewT) : 0), [simState, viewT]);
  const pulse = useMemo(() => (sim ? computePulse(sim, { traffic: lever }) : null), [sim, lever]);
  const basePulse = useMemo(() => (base ? computePulse(base) : null), [base]);
  const state = useMemo(() => (sim ? computeCityState(sim, { traffic: lever }) : null), [sim, lever]);
  const baseState = useMemo(() => (base ? computeCityState(base) : null), [base]);
  const headlineText = state ? headline(state) : null;

  // SIMULATED city systems: real weather in, deterministic models out. Never mixed into the live readings.
  const realRain6h = useMemo(() => (w && viewT ? rainLast6h(w.hourly, viewT) : 0), [w, viewT]);
  const simSystems = useMemo(() => {
    if (!sim || !base) return null;
    const extra = Math.max(0, sim.precipitation - base.precipitation) * 6;
    return computeSystems({ c: sim, rain6h: realRain6h + extra, sim: simState });
  }, [sim, base, realRain6h, simState]);
  const baseSystems = useMemo(() => (base ? computeSystems({ c: base, rain6h: realRain6h, sim: NO_SIM_BASE }) : null), [base, realRain6h]);

  const dayNow = w && viewT ? dayFor(viewT, w.daily) : undefined;
  const phase: TimePhase = viewT ? timePhase(viewT, dayNow) : "NIGHT";

  useEffect(() => {
    document.documentElement.dataset.phase = phase;
  }, [phase]);

  const series = useMemo<SeriesPoint[]>(() => {
    if (!w) return [];
    return w.hourly.map((h) => {
      const c = applySimulation(conditionsFromHour(h, a), simState);
      return {
        t: h.t,
        temperature: c.temperature,
        apparent: c.apparentTemperature,
        rain: c.precipitationProbability,
        code: c.weatherCode,
        isDay: c.isDay,
        pulse: computePulse(c, { traffic: activityLever(simState, h.t + 1_800_000) }).value,
      };
    });
  }, [w, a, simState]);

  const days = useMemo(() => (w && nowMin ? w.daily.filter((d) => d.t >= startOfLocalDay(nowMin)) : []), [w, nowMin]);
  const arcDay = days[clamp(dayOffset, 0, Math.max(0, days.length - 1))];
  const arcPoints = useMemo(() => (arcDay ? series.filter((p) => p.t >= arcDay.t && p.t < arcDay.t + 24 * HOUR_MS) : []), [series, arcDay]);

  const prayers = prayer.env?.data.times ?? [];

  const street = useMemo(() => (sim && state ? streetRead(sim, state, dayNow, viewT) : []), [sim, state, dayNow, viewT]);

  /* ───────────── map readings for the viewed hour ───────────── */
  const mapSimulated = simActive && layers.simulation;
  const readings = useMemo<Record<string, AreaReading> | null>(() => {
    if (!w || !w.areas.length || !nowMin || !base || !sim) return null;
    const idx = selT === null ? -1 : w.hourly.findIndex((h) => h.t === startOfLocalHour(selT));
    const dT = mapSimulated ? sim.temperature - base.temperature : 0;
    const dA = mapSimulated ? sim.apparentTemperature - base.apparentTemperature : 0;
    const out: Record<string, AreaReading> = {};
    for (const area of w.areas) {
      const useCurrent = selT === null || idx < 0;
      out[area.id] = {
        temperature: (useCurrent ? area.current.temperature : area.temperature[idx]) + dT,
        apparent: (useCurrent ? area.current.apparentTemperature : area.apparentTemperature[idx]) + dA,
      };
    }
    return out;
  }, [w, nowMin, selT, base, sim, mapSimulated]);

  /* ───────────── what the map paints: live weather, or one simulated system ───────────── */
  const field = useMemo<MapField>(() => {
    if (lens === "weather") {
      if (!layers.weather || !readings) return null;
      const items: Record<string, { v: number; label: string }> = {};
      for (const [id, r] of Object.entries(readings)) items[id] = { v: r.apparent, label: `${Math.round(r.temperature)}\u00b0` };
      return { kind: "temp", items, simulated: mapSimulated };
    }
    if (!simSystems) return null;
    const items: Record<string, { v: number; label: string }> = {};
    for (const [id, a2] of Object.entries(simSystems.areas)) {
      if (lens === "heat") {
        const r = readings?.[id];
        if (!r) continue;
        items[id] = { v: r.apparent + a2.heatAdj, label: `${Math.round(r.temperature + a2.heatAdj)}\u00b0` };
      } else if (lens === "noise") items[id] = { v: ((a2.noiseDb - 35) / 55) * 100, label: `${Math.round(a2.noiseDb)}` };
      else items[id] = { v: a2[lens], label: `${Math.round(a2[lens])}` };
    }
    return { kind: lens === "heat" ? "temp" : "index", items, simulated: true };
  }, [lens, layers.weather, readings, mapSimulated, simSystems]);

  const corridorPaint = useMemo(
    () => (lens === "traffic" && simSystems ? simSystems.corridors.map((c) => ({ id: c.id, congestion: c.congestion })) : null),
    [lens, simSystems],
  );
  const mapEvent = useMemo(() => {
    const ev = events.find((e) => e.id === simState.scenario.event);
    const lm = ev && landmarks.find((l) => l.id === ev.landmarkId);
    return ev && lm ? { lng: lm.longitude, lat: lm.latitude, label: ev.name } : null;
  }, [simState.scenario.event]);

  const openSystem = (k: SystemKey) => {
    setLens(k);
    setPanel("systems");
  };

  /* ───────────── actions ───────────── */
  const viewLabel = selT === null ? "NOW" : `${formatShortWeekday(selT)} ${formatHourLabel(selT)}`;

  const selectTime = useCallback(
    (t: number | null) => {
      if (t === null || startOfLocalHour(t) === startOfLocalHour(nowMin || Date.now())) {
        setSelT(null);
        setDayOffset(0);
        return;
      }
      setSelT(startOfLocalHour(t));
      const idx = days.findIndex((d) => t >= d.t && t < d.t + 24 * HOUR_MS);
      if (idx >= 0) setDayOffset(idx);
    },
    [days, nowMin],
  );

  const stepHour = useCallback(
    (dir: -1 | 1) => {
      if (!series.length || !nowMin) return;
      const cur = selT ?? startOfLocalHour(nowMin);
      const lo = series[0].t;
      const hi = series[series.length - 1].t;
      selectTime(clamp(cur + dir * HOUR_MS, lo, hi));
    },
    [series, selT, nowMin, selectTime],
  );

  const toggleLayer = (k: LayerKey) => setLayers((l) => ({ ...l, [k]: !l[k] }));
  const open = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  const paletteActions = useMemo<PaletteAction[]>(
    () => [
      { id: "focus", label: "Karachi right now (full screen)", hint: "ACTION · F", run: () => setFocus(true) },
      { id: "sim", label: "What if? simulation", hint: "ACTION · S", run: () => setPanel("sim") },
      { id: "layers", label: "Layers of the city", hint: "ACTION · L", run: () => setPanel("layers") },
      { id: "air", label: "Air quality detail", hint: "ACTION · A", run: () => setPanel("air") },
      { id: "systems", label: "City systems (simulated)", hint: "ACTION · C", run: () => setPanel("systems") },
      { id: "history", label: "This date, in the record", hint: "ACTION · H", run: () => setPanel("history") },
      { id: "compare", label: "Compare neighbourhoods", hint: "ACTION · X", run: () => setPanel("compare") },
      { id: "lens-weather", label: "Map: show live weather", hint: "ACTION", run: () => setLens("weather") },
      { id: "method", label: "How it works", hint: "ACTION · I", run: () => setPanel("method") },
      { id: "now", label: "Back to now", hint: "ACTION · N", run: () => selectTime(null) },
      { id: "reset", label: "Reset camera", hint: "ACTION · R", run: () => mapHandle.current?.recenter() },
    ],
    [selectTime],
  );

  const pickSelection = useCallback((s: Selection) => setSelection(s), []);

  /* ───────────── keyboard ───────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
        return;
      }
      if (e.key === "Escape") {
        if (palette) setPalette(false);
        else if (panel) setPanel(null);
        else if (focus) setFocus(false);
        else if (selection) setSelection(null);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || palette) return;
      const k = e.key.toLowerCase();
      if (k === "f") setFocus((f) => !f);
      else if (focus) return;
      else if (k === "s") open("sim");
      else if (k === "l") open("layers");
      else if (k === "a") open("air");
      else if (k === "c") open("systems");
      else if (k === "h") open("history");
      else if (k === "x") open("compare");
      else if (k === "i") open("method");
      else if (k === "?") open("help");
      else if (k === "/") { e.preventDefault(); setPalette(true); }
      else if (k === "n") selectTime(null);
      else if (k === "r") mapHandle.current?.recenter();
      else if (k === "arrowleft") stepHour(-1);
      else if (k === "arrowright") stepHour(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [palette, panel, focus, selection, selectTime, stepHour]);

  // Lock page scroll only while a full-screen layer is up.
  useEffect(() => {
    document.documentElement.style.overflow = focus || (panel && !desktop) ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [focus, panel, desktop]);

  useEffect(() => {
    if (sim && !simActive && w) document.title = `${Math.round(sim.temperature)}° Karachi — ${SITE.name}`;
    else if (simActive) document.title = `SIMULATION — ${SITE.name}`;
  }, [sim, simActive, w]);

  /* ───────────── pieces ───────────── */
  const padding = focus ? NO_PAD : desktop ? { top: 72, right: 392, bottom: DOCK_H + 8, left: 392 } : NO_PAD;

  const haze = layers.air && sim?.usAqi != null ? clamp((sim.usAqi - 45) / 190, 0, 0.5) : 0;

  const selReading = selection?.kind === "area" ? readings?.[selection.id] : undefined;
  const cityRefTemp = sim && base ? (mapSimulated ? sim.temperature : base.temperature) : null;

  const inspector = (
    <AreaInspector
      selection={selection}
      reading={selReading}
      systems={selection?.kind === "area" ? simSystems?.areas[selection.id] : undefined}
      simulated={mapSimulated}
      viewLabel={viewLabel}
      cityTemp={cityRefTemp}
      onClose={() => setSelection(null)}
    />
  );

  const hero = (compact: boolean) => (
    <WeatherHero
      c={sim}
      simulated={simActive}
      headlineText={headlineText}
      loading={!weather.settled}
      failed={weather.settled && !w}
      onRetry={weather.refresh}
      compact={compact}
    />
  );

  const readouts = (
    <Readouts
      c={sim}
      state={state}
      pressure={w?.current.pressure ?? null}
      loading={!weather.settled}
      weatherMeta={weather.env?.meta ?? null}
      weatherStale={weather.stale}
      airMeta={air.env?.meta ?? null}
      airStale={air.stale}
      now={now}
    />
  );

  const pulseEl = <CityPulse pulse={pulse} basePulse={basePulse} simulated={simActive} loading={!weather.settled} onInfo={() => setPanel("method")} />;
  const stateEl = <CityStatePanel state={state} baseState={baseState} simulated={simActive} loading={!weather.settled} />;
  const streetEl = <StreetRead lines={street} simulated={simActive} />;
  const systemsEl = <SystemsStrip systems={simSystems} lens={lens} onOpen={openSystem} />;
  const lensChip =
    lens !== "weather" && !focus ? (
      <div className="stripes panel-solid anim-fade pointer-events-auto flex items-center gap-3 !border-sodium/50 px-3 py-1.5">
        <span className="label !text-sodium">MAP SHOWS SIMULATED {SYSTEM_META[lens].title}</span>
        <button className="btn !h-6 !px-2" onClick={() => setLens("weather")}><X size={11} /> Weather</button>
      </div>
    ) : null;
  const timelineEl = (
    <WeatherTimeline series={series} daily={w?.daily ?? []} now={nowMin} selectedT={selT} simulated={simActive} onSelect={selectTime} onStep={stepHour} hint={!desktop} />
  );
  const arcEl = (compact: boolean) => (
    <WeatherArc
      day={arcDay}
      points={arcPoints}
      selectedT={selT}
      now={nowMin}
      prayers={prayers}
      simulated={simActive}
      dayOffset={clamp(dayOffset, 0, Math.max(0, days.length - 1))}
      dayCount={days.length}
      compact={compact}
      loading={!weather.settled}
      onSelect={selectTime}
      onDay={(d) => setDayOffset(clamp(d, 0, Math.max(0, days.length - 1)))}
    />
  );

  const simBanner = simActive && !focus && (
    <div className="stripes panel-solid anim-fade pointer-events-auto flex items-center gap-3 !border-sodium/50 px-3 py-1.5" role="status">
      <span className="label !text-sodium">SIMULATION &middot; {simSummary(simState).join(" · ")} &middot; NOT LIVE DATA</span>
      <button className="btn !h-6 !px-2" onClick={() => setSimState(NO_SIM)}>
        <X size={11} /> Reset
      </button>
    </div>
  );

  const iconBtn = "btn";

  return (
    <div className="relative w-full bg-night lg:h-svh lg:overflow-hidden" style={{ ["--dock-h" as string]: desktop && !focus ? `${DOCK_H}px` : "0px" }}>
      {/* ───────── map stage (stable position in the tree so MapLibre never remounts) ───────── */}
      <div className={focus ? "fixed inset-0 z-0" : desktop ? "absolute inset-0 z-0" : "relative z-0 h-[62svh] min-h-[420px]"}>
        <KarachiMap
          handleRef={mapHandle}
          phase={phase}
          layers={layers}
          field={field}
          corridorPaint={corridorPaint}
          works={simState.scenario.works}
          event={mapEvent}
          selected={selection}
          onSelect={pickSelection}
          padding={padding}
          orbit={focus}
          reducedMotion={reduced}
          onReady={() => setMapReady(true)}
          onFail={() => setMapFailed(true)}
        />
        {layers.air && haze > 0 && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-[1500ms]"
            style={{
              opacity: 1,
              background: `radial-gradient(120% 80% at 50% 110%, rgba(201,184,154,${haze * 0.55}) 0%, transparent 65%), linear-gradient(180deg, rgba(201,184,154,${haze * 0.22}), transparent 60%)`,
              mixBlendMode: "screen",
            }}
            aria-hidden="true"
          />
        )}
        <AtmosphereCanvas
          windSpeed={sim?.windSpeed ?? 0}
          windDirection={sim?.windDirection ?? 0}
          rain={sim && sim.precipitation >= 0.1 ? Math.min(1, 0.2 + sim.precipitation / 6) : 0}
          pm25={sim?.pm25 ?? null}
          weatherOn={layers.weather && !!sim}
          airOn={layers.air}
          paused={reduced}
        />
        {!focus && desktop && (
          <>
            <div className="scrim-left pointer-events-none absolute inset-y-0 left-0 w-[560px]" />
            <div className="scrim-right pointer-events-none absolute inset-y-0 right-0 w-[520px]" />
            <div className="scrim-top pointer-events-none absolute inset-x-0 top-0 h-36" />
          </>
        )}
        {!desktop && !focus && (
          <>
            <div className="scrim-top pointer-events-none absolute inset-x-0 top-0 h-44" />
            <div className="scrim-bottom pointer-events-none absolute inset-x-0 bottom-0 h-24" />
          </>
        )}
      </div>

      {/* ───────── header ───────── */}
      {!focus && (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 px-4 pt-4 lg:px-8 lg:pt-5">
          <div className="pointer-events-auto">
            <Link href="/" className="flex items-baseline gap-3" aria-label="kesakarachi home">
              <span className="text-[22px] font-light leading-none tracking-tight">
                kesa<span className="text-accent">karachi</span>
              </span>
              <span className="urdu hidden text-[15px] leading-none text-ink-faint sm:inline" lang="ur" dir="rtl">{SITE.urdu}</span>
            </Link>
            <p className="label mt-1.5 hidden lg:block">{SITE.tagline.toUpperCase()}</p>
          </div>

          <div className="pointer-events-auto flex flex-col items-end gap-1.5 lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:items-center">
            <CityClock now={now} phase={phase} />
            <div className="hidden 2xl:block"><PrayerChip prayer={prayer.env?.data ?? null} meta={prayer.env?.meta ?? null} now={nowMin} /></div>
          </div>

          {desktop && (
            <nav className="pointer-events-auto flex items-center gap-1" aria-label="Controls">
              <button className={iconBtn} onClick={() => setPalette(true)} aria-label="Go to an area or landmark"><Search size={13} /> <span className="hidden 2xl:inline">Go to</span> <span className="kbd hidden 2xl:grid">/</span></button>
              <button className={iconBtn} data-active={panel === "layers"} aria-pressed={panel === "layers"} onClick={() => open("layers")}><Layers size={13} /> <span className="hidden 2xl:inline">Layers</span> <span className="kbd hidden 2xl:grid">L</span></button>
              <button className={`${iconBtn} btn-sim`} data-active={panel === "sim" || simActive} aria-pressed={panel === "sim"} onClick={() => open("sim")}><FlaskConical size={13} /> <span className="hidden 2xl:inline">What if</span> <span className="kbd hidden 2xl:grid">S</span></button>
              <button className={iconBtn} data-active={panel === "systems" || lens !== "weather"} aria-pressed={panel === "systems"} onClick={() => open("systems")} aria-label="City systems (simulated)"><Activity size={13} /> <span className="hidden 2xl:inline">Systems</span> <span className="kbd hidden 2xl:grid">C</span></button>
              <button className={iconBtn} data-active={panel === "history"} aria-pressed={panel === "history"} onClick={() => open("history")} aria-label="History"><History size={13} /> <span className="kbd hidden 2xl:grid">H</span></button>
              <button className={iconBtn} data-active={panel === "compare"} aria-pressed={panel === "compare"} onClick={() => open("compare")} aria-label="Compare neighbourhoods"><GitCompare size={13} /> <span className="kbd hidden 2xl:grid">X</span></button>
              <button className={iconBtn} data-active={panel === "method"} aria-pressed={panel === "method"} onClick={() => open("method")} aria-label="How it works"><Info size={13} /> <span className="kbd hidden 2xl:grid">I</span></button>
              <button className={`${iconBtn} hidden 2xl:inline-flex`} onClick={() => open("help")} aria-label="Keyboard shortcuts"><Keyboard size={13} /></button>
              <button className={iconBtn} onClick={() => setFocus(true)} aria-label="Karachi right now, full screen"><Maximize2 size={13} /> <span>Now</span> <span className="kbd hidden 2xl:grid">F</span></button>
            </nav>
          )}
        </header>
      )}

      {/* sim banner */}
      {(simBanner || lensChip) && (
        <div className={`pointer-events-none absolute z-20 flex flex-col items-center gap-2 ${desktop ? "inset-x-0 top-[72px]" : "inset-x-0 top-[58px] px-3"}`}>
          {simBanner}
          {lensChip}
        </div>
      )}

      {/* ───────── desktop columns + dock ───────── */}
      {desktop && !focus && (
        <>
          <aside
            className="scroll-y absolute left-8 z-10 w-[340px] pr-2"
            style={{ top: 92, bottom: DOCK_H + 12 }}
            aria-label="Conditions"
          >
            {hero(false)}
            <div className="mt-6">{readouts}</div>
          </aside>

          <aside
            className="scroll-y absolute right-8 z-10 w-[340px] space-y-7 pl-2"
            style={{ top: 92, bottom: DOCK_H + 12 }}
            aria-label="City state"
          >
            {pulseEl}
            {stateEl}
            {systemsEl}
            {streetEl}
            <button className="btn btn-sim w-full !justify-between" onClick={() => setPanel("sim")}>
              <span className="flex items-center gap-2"><FlaskConical size={13} /> WHAT IF? +40% rush hour, &minus;20% incidents&hellip;</span>
              <span className="kbd">S</span>
            </button>
          </aside>

          <div className="absolute z-10" style={{ right: 388, top: 92 }}>
            <MapControls map={mapHandle} orientation="col" />
          </div>

          <div className="absolute z-10" style={{ left: 392, bottom: DOCK_H + 14, width: 340 }}>
            {inspector}
          </div>

          <div className="scrim-bottom absolute inset-x-0 bottom-0 z-10 px-8 pb-4 pt-6" style={{ height: DOCK_H + 20 }}>
            <div className="grid h-full grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-end gap-10">
              <div className="w-[290px] self-end">{arcEl(true)}</div>
              <div className="min-w-0 self-end">{timelineEl}</div>
            </div>
          </div>
        </>
      )}

      {/* ───────── mobile stack ───────── */}
      {!desktop && !focus && (
        <>
          <div className="pointer-events-none absolute left-4 top-[64px] z-10">{hero(true)}</div>

          <div className="absolute right-3 z-10 flex flex-col items-end gap-2" style={{ top: 64 }}>
            <MapControls map={mapHandle} orientation="col" />
          </div>

          <div className="absolute inset-x-3 z-10" style={{ top: "calc(62svh - 8px)", transform: "translateY(-100%)" }}>{selection && inspector}</div>

          <main className="relative z-10 space-y-0 bg-night px-5 pb-28 pt-2">
            <section className="py-5">{readouts}</section>
            <div className="hair-t py-6">{pulseEl}</div>
            <div className="hair-t py-6">{stateEl}</div>
            <div className="hair-t py-6">{systemsEl}</div>
            {street.length > 0 && <div className="hair-t py-6">{streetEl}</div>}
            <div className="hair-t py-6">{timelineEl}</div>
            <div className="hair-t py-6">{arcEl(false)}</div>
            <div className="hair-t py-6">
              <AirQuality air={a} meta={air.env?.meta ?? null} stale={air.stale} now={now} selectedT={selT} loading={!air.settled} />
            </div>
            <div className="hair-t py-6">
              <PrayerChip prayer={prayer.env?.data ?? null} meta={prayer.env?.meta ?? null} now={nowMin} />
              <p className="label mt-6 normal-case leading-relaxed tracking-[0.03em]">
                Map &copy; OpenFreeMap, OpenMapTiles &amp; OpenStreetMap contributors. Weather &amp; air by Open-Meteo.com. Karachi Pulse is an experimental,
                unofficial index.
              </p>
            </div>
          </main>

          <nav className="panel-solid fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 !border-x-0 !border-b-0 pb-[env(safe-area-inset-bottom)]" aria-label="Actions">
            {[
              { k: "focus", icon: <Maximize2 size={16} />, label: "NOW", on: () => setFocus(true), active: false },
              { k: "sim", icon: <FlaskConical size={16} />, label: "WHAT IF", on: () => open("sim"), active: simActive },
              { k: "layers", icon: <Layers size={16} />, label: "LAYERS", on: () => open("layers"), active: false },
              { k: "go", icon: <Search size={16} />, label: "GO TO", on: () => setPalette(true), active: false },
              { k: "more", icon: <Ellipsis size={16} />, label: "MORE", on: () => open("more"), active: lens !== "weather" },
            ].map((b) => (
              <button key={b.k} onClick={b.on} className={`flex h-14 flex-col items-center justify-center gap-1 ${b.active ? "text-sodium" : "text-ink-dim"} active:text-accent`}>
                {b.icon}
                <span className="mono text-[9.5px] tracking-[0.14em]">{b.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      {/* ───────── focus mode ───────── */}
      {focus && sim && state && pulse && headlineText && (
        <FocusMode c={sim} state={state} pulse={pulse} headlineText={headlineText} simulated={simActive} now={now} phase={phase} onExit={() => setFocus(false)} />
      )}
      {focus && !(sim && state && pulse) && (
        <div className="fixed inset-0 z-30 grid place-items-center">
          <button className="btn" onClick={() => setFocus(false)}>Weather unavailable — exit</button>
        </div>
      )}

      {/* ───────── drawers ───────── */}
      <SimulationPanel
        open={panel === "sim"}
        onClose={() => setPanel(null)}
        sim={simState}
        onChange={setSimState}
        baseState={baseState}
        simState={state}
        basePulse={basePulse}
        simPulse={pulse}
        baseSystems={baseSystems}
        simSystems={simSystems}
        viewLabel={viewLabel}
      />
      <SystemsDrawer
        open={panel === "systems"}
        onClose={() => setPanel(null)}
        systems={simSystems}
        lens={lens}
        onLens={setLens}
        onPickArea={(id) => setSelection({ kind: "area", id })}
        viewLabel={viewLabel}
      />
      <HistoryDrawer
        open={panel === "history"}
        onClose={() => setPanel(null)}
        history={history.env?.data ?? null}
        meta={history.env?.meta ?? null}
        stale={history.stale}
        loading={!history.settled}
        now={now}
        today={w && nowMin ? dayFor(nowMin, w.daily) : undefined}
      />
      <CompareDrawer
        open={panel === "compare"}
        onClose={() => setPanel(null)}
        ids={compareIds}
        onChange={setCompareIds}
        readings={readings}
        systems={simSystems}
        viewLabel={viewLabel}
      />
      <MoreMenu
        open={panel === "more"}
        onClose={() => setPanel(null)}
        onPick={(k) => setPanel(k)}
      />
      <MapLayers
        open={panel === "layers"}
        onClose={() => setPanel(null)}
        layers={layers}
        onToggle={toggleLayer}
        hasAreaWeather={!!w?.areas.length}
        simActive={simActive}
      />
      <MethodDrawer open={panel === "method"} onClose={() => setPanel(null)} pulse={pulse} />
      <ShortcutsHelp open={panel === "help"} onClose={() => setPanel(null)} />
      {panel === "air" && (
        <AirDrawer onClose={() => setPanel(null)}>
          <AirQuality air={a} meta={air.env?.meta ?? null} stale={air.stale} now={now} selectedT={selT} loading={!air.settled} />
        </AirDrawer>
      )}

      <CommandPalette open={palette} onClose={() => setPalette(false)} onPick={pickSelection} actions={paletteActions} />

      {boot !== "done" && <BootSequence items={bootItems} leaving={boot === "leaving"} />}

      <p className="sr-only" aria-live="polite">
        {sim && state ? `Karachi ${viewLabel}: ${Math.round(sim.temperature)} degrees, ${headlineText ?? ""} Pulse ${pulse?.value}, ${pulse?.label}.` : ""}
      </p>
    </div>
  );
}

function AirDrawer({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <Drawer open onClose={onClose} title="The air over Karachi" eyebrow="AIR" width={400}>
      {children}
    </Drawer>
  );
}
