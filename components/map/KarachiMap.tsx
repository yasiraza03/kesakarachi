"use client";

import * as maplibregl from "maplibre-gl";
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { corridors } from "@/data/karachi/corridors";
import { CATEGORY_STYLE, landmarks } from "@/data/karachi/landmarks";
import { neighborhoods } from "@/data/karachi/neighborhoods";
import { DEFAULT_VIEW, HERO_VIEW, KARACHI, KARACHI_BOUNDS } from "@/data/karachi/coordinates";
import { MAP_STYLE_URL } from "@/lib/constants";
import type { TimePhase } from "@/types/city";
import { HEAT_STOPS, INDEX_STOPS, indexColor } from "@/components/weather/series";
import { applyPalette, tuneStyle } from "./map-style";
import type { CorridorPaint, LayerState, MapEvent, MapField, MapHandle, Padding, Selection } from "./types";

type Props = {
  handleRef: React.Ref<MapHandle>;
  phase: TimePhase;
  layers: LayerState;
  /** what to paint per neighbourhood (live weather or a simulated system); null = nothing */
  field: MapField;
  /** simulated congestion per corridor, drawn on the real road geometry; null = hidden */
  corridorPaint: CorridorPaint | null;
  /** corridor id with simulated roadworks */
  works: string | null;
  /** simulated event crowd marker */
  event: MapEvent;
  selected: Selection;
  onSelect: (s: Selection) => void;
  padding: Padding;
  orbit: boolean;
  reducedMotion: boolean;
  onReady: () => void;
  onFail: () => void;
};

let workerConfigured = false;

const HEAT_SOURCE = "kk-heat";
const HEAT_GLOW = "kk-heat-glow";
const HEAT_CORE = "kk-heat-core";
const WORKS_LAYER = "kk-works";

const colorExpr = (stops: [number, string][]): ExpressionSpecification =>
  ["interpolate", ["linear"], ["get", "v"], ...stops.flat()] as ExpressionSpecification;

/** Match a corridor to real road geometry by (lower-cased) name. */
const corridorFilter = (tokens: string[]): ExpressionSpecification =>
  [
    "any",
    ...tokens.map((tok) => ["in", tok, ["downcase", ["coalesce", ["get", "name_en"], ["get", "name:latin"], ["get", "name"], ""]]]),
  ] as unknown as ExpressionSpecification;

const corridorLayerId = (id: string) => `kk-cor-${id}`;

export function KarachiMap(props: Props) {
  const { handleRef, phase, layers, field, corridorPaint, works, event, selected, onSelect, padding, orbit, reducedMotion, onReady, onFail } = props;

  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  const areaEls = useRef(new Map<string, HTMLButtonElement>());
  const lmEls = useRef(new Map<string, HTMLButtonElement>());
  const ringRef = useRef<Marker | null>(null);
  const eventRef = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);

  // Keep the latest props reachable from long-lived map callbacks without re-binding them.
  const live = useRef({ phase, layers, padding, onSelect, reducedMotion });
  useEffect(() => {
    live.current = { phase, layers, padding, onSelect, reducedMotion };
  });

  const heroZoom = useCallback(() => HERO_VIEW.zoom - ((hostRef.current?.clientWidth ?? 1200) < 640 ? 0.85 : 0), []);

  const heroCamera = useCallback(
    (extra: Partial<maplibregl.EaseToOptions> = {}): maplibregl.EaseToOptions => ({
      center: HERO_VIEW.center,
      // phones show a narrower slice of the city, so pull the camera back to keep Karachi in frame
      zoom: heroZoom(),
      pitch: HERO_VIEW.pitch,
      bearing: HERO_VIEW.bearing,
      padding: live.current.padding,
      ...extra,
    }),
    [heroZoom],
  );

  useImperativeHandle(handleRef, () => ({
    intro() {
      const map = mapRef.current;
      if (!map) return;
      if (live.current.reducedMotion) {
        map.jumpTo({ center: HERO_VIEW.center, zoom: heroZoom(), pitch: HERO_VIEW.pitch, bearing: HERO_VIEW.bearing, padding: live.current.padding });
        return;
      }
      map.flyTo({ ...heroCamera(), duration: 5200, curve: 1.5, essential: false });
    },
    flyTo(lng, lat, zoom = 13.2) {
      mapRef.current?.flyTo({
        center: [lng, lat], zoom, padding: live.current.padding,
        duration: live.current.reducedMotion ? 0 : 1600, essential: true,
      });
    },
    recenter() {
      mapRef.current?.easeTo(heroCamera({ duration: live.current.reducedMotion ? 0 : 1400 }));
    },
    zoomBy(d) {
      mapRef.current?.easeTo({ zoom: (mapRef.current.getZoom() ?? 11) + d, duration: 350 });
    },
    resetNorth() {
      mapRef.current?.easeTo({ bearing: 0, duration: 600 });
    },
    togglePitch() {
      const m = mapRef.current;
      if (m) m.easeTo({ pitch: m.getPitch() > 10 ? 0 : 50, duration: 700 });
    },
  }));

  /* ───────────── create the map once ───────────── */
  useEffect(() => {
    if (!hostRef.current) return;
    let disposed = false;
    const markers: Marker[] = [];

    let map: MapLibreMap;
    try {
      if (!workerConfigured) {
        // See scripts/copy-maplibre-worker.mjs: the worker modules are served from /public/maplibre.
        maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        workerConfigured = true;
      }
      map = new maplibregl.Map({
        container: hostRef.current,
        style: MAP_STYLE_URL,
        center: DEFAULT_VIEW.center,
        zoom: DEFAULT_VIEW.zoom,
        pitch: DEFAULT_VIEW.pitch,
        bearing: DEFAULT_VIEW.bearing,
        minZoom: 8.6,
        maxZoom: 17.5,
        maxBounds: KARACHI_BOUNDS,
        maxPitch: 70,
        attributionControl: false,
        fadeDuration: 250,
      });
    } catch {
      onFail();
      return;
    }
    mapRef.current = map;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __kkmap?: MapLibreMap }).__kkmap = map;
    map.addControl(new maplibregl.AttributionControl({ compact: false }), "bottom-right");

    const setZoomTier = () => {
      const z = map.getZoom();
      if (wrapRef.current) wrapRef.current.dataset.zoom = z < 10.4 ? "lo" : z < 11.9 ? "mid" : "hi";
    };

    map.on("error", (e) => {
      // Tile/glyph hiccups are normal on flaky networks - only a dead style is fatal for the boot screen.
      if (!loadedRef.current && /style|failed to fetch/i.test(String(e?.error?.message))) onFail();
    });

    // `style.load` (not `load`) so our palette lands before the first tiles, never flashing Liberty's cream.
    map.once("style.load", () => {
      if (disposed) return;
      loadedRef.current = true;
      tuneStyle(map);
      applyPalette(map, live.current.phase, { base: live.current.layers.base, roads: live.current.layers.roads });
      map.easeTo({ padding: live.current.padding, duration: 0 });

      const firstSymbol = map.getStyle().layers.find((l) => l.type === "symbol")?.id;

      // Neighbourhood field: soft glow + crisp core, drawn under the base map's labels.
      map.addSource(HEAT_SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer(
        {
          id: HEAT_GLOW, type: "circle", source: HEAT_SOURCE,
          paint: {
            "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 8, 14, 12, 110, 15, 520],
            "circle-color": colorExpr(HEAT_STOPS),
            "circle-opacity": 0.28,
            "circle-blur": 1,
          },
        },
        firstSymbol,
      );
      map.addLayer(
        {
          id: HEAT_CORE, type: "circle", source: HEAT_SOURCE, minzoom: 10,
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2, 14, 6],
            "circle-color": colorExpr(HEAT_STOPS),
            "circle-opacity": 0.9,
            "circle-stroke-width": 1,
            "circle-stroke-color": "rgba(7,16,20,0.8)",
          },
        },
        firstSymbol,
      );

      // Simulated congestion, painted onto the real road geometry (matched by name in the vector tiles).
      for (const cor of corridors) {
        map.addLayer(
          {
            id: corridorLayerId(cor.id), type: "line", source: "openmaptiles", "source-layer": "transportation_name",
            filter: corridorFilter(cor.tokens),
            layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
            paint: {
              "line-color": "#f2b84b",
              "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 9, 1.6, 12, 4, 15, 11],
              "line-opacity": 0.92,
            },
          },
          firstSymbol,
        );
      }
      map.addLayer(
        {
          id: WORKS_LAYER, type: "line", source: "openmaptiles", "source-layer": "transportation_name",
          filter: ["==", ["get", "name"], "__none__"],
          layout: { "line-cap": "butt", visibility: "none" },
          paint: {
            "line-color": "#071014",
            "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 9, 1, 12, 2.2, 15, 5],
            "line-dasharray": [1.2, 1.6],
          },
        },
        firstSymbol,
      );

      // Neighbourhoods: real <button>s so they are keyboard- and screen-reader-reachable.
      for (const n of neighborhoods) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "area";
        el.dataset.rank = String(n.rank);
        el.setAttribute("aria-label", `${n.name}, ${n.district} Karachi. Open details.`);
        el.innerHTML = `<span class="n"></span><span class="t"></span>`;
        (el.firstChild as HTMLElement).textContent = n.name;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          live.current.onSelect({ kind: "area", id: n.id });
        });
        areaEls.current.set(n.id, el);
        markers.push(new maplibregl.Marker({ element: el, anchor: "left", offset: [-8, 0] }).setLngLat([n.longitude, n.latitude]).addTo(map));
      }

      for (const l of landmarks) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "landmark";
        el.dataset.cat = l.category;
        el.setAttribute("aria-label", `${l.name}, ${CATEGORY_STYLE[l.category].label}. Open details.`);
        el.innerHTML = `<span aria-hidden="true">${CATEGORY_STYLE[l.category].glyph}</span><span class="name"></span>`;
        (el.lastChild as HTMLElement).textContent = l.name;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          live.current.onSelect({ kind: "landmark", id: l.id });
        });
        lmEls.current.set(l.id, el);
        markers.push(new maplibregl.Marker({ element: el }).setLngLat([l.longitude, l.latitude]).addTo(map));
      }

      // City centre crosshair
      const mark = document.createElement("div");
      mark.className = "centre-mark";
      mark.innerHTML = `<svg viewBox="0 0 38 38" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><circle cx="19" cy="19" r="6"/><path d="M19 0v10M19 28v10M0 19h10M28 19h10"/></svg>`;
      mark.style.color = "var(--accent)";
      markers.push(new maplibregl.Marker({ element: mark }).setLngLat([KARACHI.longitude, KARACHI.latitude]).addTo(map));

      setZoomTier();
      setReady(true);
      // Wait for the first fully-rendered frame before telling the boot screen the map is up.
      map.once("idle", () => !disposed && onReady());
      // Belt and braces: tiles can stall; the map is interactive regardless.
      setTimeout(() => !disposed && onReady(), 6000);
    });

    map.on("zoom", setZoomTier);
    map.on("click", () => live.current.onSelect(null));

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(hostRef.current);

    const areas = areaEls.current;
    const lms = lmEls.current;
    return () => {
      disposed = true;
      ro.disconnect();
      markers.forEach((m) => m.remove());
      ringRef.current?.remove();
      ringRef.current = null;
      eventRef.current?.remove();
      eventRef.current = null;
      areas.clear();
      lms.clear();
      loadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // The map is created exactly once; everything dynamic flows through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───────────── palette follows the light, layers follow the toggles ───────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applyPalette(map, phase, { base: layers.base, roads: layers.roads });
  }, [ready, phase, layers.base, layers.roads]);

  useEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    w.dataset.areas = layers.neighborhoods ? "on" : "off";
    w.dataset.landmarks = layers.landmarks ? "on" : "off";
  }, [layers.neighborhoods, layers.landmarks]);

  /* ───────────── the field: weather or a simulated system, glow + labels ───────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const show = !!field;
    const expr = colorExpr(field?.kind === "index" ? INDEX_STOPS : HEAT_STOPS);
    for (const id of [HEAT_GLOW, HEAT_CORE]) {
      if (!map.getLayer(id)) continue;
      map.setLayoutProperty(id, "visibility", show ? "visible" : "none");
      map.setPaintProperty(id, "circle-color", expr);
    }
    const features = field
      ? neighborhoods.flatMap((n) => {
          const r = field.items[n.id];
          return r ? [{ type: "Feature" as const, properties: { v: r.v }, geometry: { type: "Point" as const, coordinates: [n.longitude, n.latitude] } }] : [];
        })
      : [];
    (map.getSource(HEAT_SOURCE) as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features });

    for (const n of neighborhoods) {
      const el = areaEls.current.get(n.id);
      if (!el) continue;
      const t = el.querySelector(".t") as HTMLElement;
      const r = field?.items[n.id];
      t.textContent = r ? r.label : "";
      el.dataset.sim = field?.simulated ? "true" : "false";
    }
  }, [ready, field]);

  /* ───────────── simulated corridors ───────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const byId = new Map((corridorPaint ?? []).map((c) => [c.id, c.congestion]));
    for (const cor of corridors) {
      const id = corridorLayerId(cor.id);
      if (!map.getLayer(id)) continue;
      const v = byId.get(cor.id);
      map.setLayoutProperty(id, "visibility", v === undefined ? "none" : "visible");
      if (v !== undefined) map.setPaintProperty(id, "line-color", indexColor(v));
    }
    if (map.getLayer(WORKS_LAYER)) {
      const cor = corridors.find((c) => c.id === works);
      if (cor && corridorPaint) {
        map.setFilter(WORKS_LAYER, corridorFilter(cor.tokens));
        map.setLayoutProperty(WORKS_LAYER, "visibility", "visible");
      } else {
        map.setLayoutProperty(WORKS_LAYER, "visibility", "none");
      }
    }
  }, [ready, corridorPaint, works]);

  /* ───────────── simulated event marker ───────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    eventRef.current?.remove();
    eventRef.current = null;
    if (!event) return;
    const el = document.createElement("div");
    el.className = "event-mark";
    el.innerHTML = `<span class="ring"></span><span class="lbl"></span>`;
    (el.lastChild as HTMLElement).textContent = `${event.label} · SIM`;
    eventRef.current = new maplibregl.Marker({ element: el }).setLngLat([event.lng, event.lat]).addTo(map);
  }, [ready, event]);

  /* ───────────── selection ───────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    areaEls.current.forEach((el, id) => (el.dataset.selected = String(selected?.kind === "area" && selected.id === id)));
    lmEls.current.forEach((el, id) => (el.dataset.selected = String(selected?.kind === "landmark" && selected.id === id)));

    ringRef.current?.remove();
    ringRef.current = null;
    if (!selected) return;
    const item = selected.kind === "area" ? neighborhoods.find((n) => n.id === selected.id) : landmarks.find((l) => l.id === selected.id);
    if (!item) return;
    const ring = document.createElement("div");
    ring.className = "sel-ring";
    ringRef.current = new maplibregl.Marker({ element: ring }).setLngLat([item.longitude, item.latitude]).addTo(map);
    map.flyTo({
      center: [item.longitude, item.latitude],
      zoom: Math.max(map.getZoom(), selected.kind === "area" ? 12.4 : 13.4),
      padding: live.current.padding,
      duration: live.current.reducedMotion ? 0 : 1100,
      essential: true,
    });
  }, [ready, selected]);

  /* ───────────── padding (keeps the city centred in the space not covered by panels) ───────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.easeTo({ padding, duration: reducedMotion ? 0 : 700 });
  }, [ready, padding, reducedMotion]);

  /* ───────────── focus-mode orbit ───────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!orbit) return;
    const noPad = { top: 0, right: 0, bottom: 0, left: 0 };
    if (reducedMotion) {
      map.jumpTo({ pitch: 52, zoom: 10.9, center: [67.03, 24.86], padding: noPad });
      return;
    }
    map.easeTo({ pitch: 58, zoom: 10.8, center: [67.03, 24.86], padding: noPad, duration: 2600 });
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      map.setBearing(map.getBearing() + dt * 0.0035);
      raf = requestAnimationFrame(tick);
    };
    const start = setTimeout(() => {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }, 2400);
    return () => {
      clearTimeout(start);
      cancelAnimationFrame(raf);
      map.easeTo(heroCamera({ duration: 1600 }));
    };
  }, [ready, orbit, reducedMotion, heroCamera]);

  return (
    <div ref={wrapRef} className="map-wrap absolute inset-0" data-zoom="lo" data-areas="on" data-landmarks="on">
      <div ref={hostRef} className="map-root" role="application" aria-label="Interactive map of Karachi" />
    </div>
  );
}
