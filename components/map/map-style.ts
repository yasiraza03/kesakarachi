import type { Map as MapLibreMap } from "maplibre-gl";
import type { TimePhase } from "@/types/city";

/**
 * OpenFreeMap "liberty" is a bright daytime map. We keep its data and re-paint every layer in a Karachi
 * palette - sea, concrete, dust, sodium lamps - and re-tint it as the day moves.
 */
export type Palette = {
  bg: string; land: string; residential: string; landuse: string; park: string; sand: string;
  water: string; waterLine: string; building: string; building3d: string;
  roadMinor: string; roadMid: string; roadMajor: string; roadMotorway: string; casing: string;
  rail: string; boundary: string; label: string; labelDim: string; halo: string; aeroway: string;
};

export const PALETTES: Record<TimePhase, Palette> = {
  NIGHT: {
    bg: "#061014", land: "#0b171b", residential: "#0e1c21", landuse: "#0c191d", park: "#0b2024", sand: "#16201f",
    water: "#052a34", waterLine: "#0a4250", building: "#12242a", building3d: "#17303a",
    roadMinor: "#1d3037", roadMid: "#2d4a52", roadMajor: "#4e6f73", roadMotorway: "#f2b84b", casing: "#061014",
    rail: "#1d3037", boundary: "#2a4046", label: "#a9cfc8", labelDim: "#5f8a8a", halo: "#061014", aeroway: "#12242a",
  },
  DAWN: {
    bg: "#0b151c", land: "#121d24", residential: "#16232b", landuse: "#131f26", park: "#142a2f", sand: "#2a2a2c",
    water: "#16475a", waterLine: "#2d6074", building: "#1f2d36", building3d: "#2b3d49",
    roadMinor: "#27363f", roadMid: "#3b505a", roadMajor: "#667f88", roadMotorway: "#f0b49a", casing: "#0b151c",
    rail: "#27363f", boundary: "#3a4b55", label: "#e3cdbf", labelDim: "#8b8f93", halo: "#0b151c", aeroway: "#1f2d36",
  },
  MORNING: {
    bg: "#0a171b", land: "#122126", residential: "#162830", landuse: "#13232a", park: "#14302f", sand: "#2c2e2a",
    water: "#0d4c5c", waterLine: "#1d6879", building: "#1c2f36", building3d: "#2a424b",
    roadMinor: "#26393f", roadMid: "#3b545b", roadMajor: "#6b8789", roadMotorway: "#a9d8d0", casing: "#0a171b",
    rail: "#26393f", boundary: "#3a4f55", label: "#d4e4de", labelDim: "#84a29e", halo: "#0a171b", aeroway: "#1c2f36",
  },
  AFTERNOON: {
    bg: "#0d1d22", land: "#16282d", residential: "#1b3037", landuse: "#172b31", park: "#183a38", sand: "#383a32",
    water: "#0f566a", waterLine: "#238090", building: "#223940", building3d: "#34505a",
    roadMinor: "#304850", roadMid: "#48656c", roadMajor: "#80a1a3", roadMotorway: "#f2b84b", casing: "#0d1d22",
    rail: "#304850", boundary: "#46606a", label: "#ece6d6", labelDim: "#9ab5b0", halo: "#0d1d22", aeroway: "#223940",
  },
  SUNSET: {
    bg: "#150e0e", land: "#211715", residential: "#281c19", landuse: "#231815", park: "#262418", sand: "#3a2b22",
    water: "#2a4553", waterLine: "#58606b", building: "#33241f", building3d: "#46322a",
    roadMinor: "#3a2a24", roadMid: "#573f35", roadMajor: "#8b6a58", roadMotorway: "#e47d5a", casing: "#150e0e",
    rail: "#3a2a24", boundary: "#4f3a31", label: "#f1d3bd", labelDim: "#a58a79", halo: "#150e0e", aeroway: "#33241f",
  },
  EVENING: {
    bg: "#090e11", land: "#10181b", residential: "#131d21", landuse: "#111a1e", park: "#10231f", sand: "#1f221f",
    water: "#07303c", waterLine: "#0f4a59", building: "#18262b", building3d: "#213540",
    roadMinor: "#222f35", roadMid: "#364850", roadMajor: "#5e777b", roadMotorway: "#f2b84b", casing: "#090e11",
    rail: "#222f35", boundary: "#33454b", label: "#c9b89a", labelDim: "#7a8584", halo: "#090e11", aeroway: "#18262b",
  },
};

type Kind =
  | "bg" | "hide" | "water" | "waterLine" | "park" | "sand" | "residential" | "landuse" | "aeroway"
  | "building" | "building3d" | "casing" | "roadMinor" | "roadMid" | "roadMajor" | "roadMotorway"
  | "rail" | "boundary" | "label" | "labelDim" | "skip";

function classify(id: string, type: string): Kind {
  if (type === "background") return "bg";
  if (type === "raster") return "hide";
  if (type === "fill-extrusion") return "building3d";
  if (type === "fill") {
    if (id === "water") return "water";
    if (id.startsWith("park") || id === "landcover_wood" || id === "landcover_grass" || id === "landcover_wetland" || id === "landuse_pitch") return "park";
    if (id === "landcover_sand") return "sand";
    if (id === "landuse_residential") return "residential";
    if (id.startsWith("landuse_") || id === "landcover_ice") return "landuse";
    if (id.startsWith("aeroway")) return "aeroway";
    if (id === "building") return "building";
    return "skip"; // road_area_pattern etc.
  }
  if (type === "line") {
    if (id.startsWith("waterway")) return "waterLine";
    if (id.startsWith("park_outline")) return "skip";
    if (id.startsWith("aeroway")) return "roadMinor";
    if (id.startsWith("boundary")) return "boundary";
    if (/rail|transit/.test(id)) return "rail";
    if (/^(road|bridge|tunnel)_/.test(id)) {
      if (id.endsWith("_casing")) return "casing";
      if (/motorway/.test(id)) return "roadMotorway";
      if (/trunk_primary/.test(id)) return "roadMajor";
      if (/secondary_tertiary/.test(id)) return "roadMid";
      return "roadMinor";
    }
    return "skip";
  }
  if (type === "symbol") return /^(poi|highway-shield|road_shield|road_one_way)/.test(id) ? "labelDim" : "label";
  return "skip";
}

type Cache = { id: string; type: string; kind: Kind }[];
const caches = new WeakMap<MapLibreMap, Cache>();

function layerCache(map: MapLibreMap): Cache {
  let c = caches.get(map);
  if (!c) {
    c = (map.getStyle().layers ?? []).map((l) => ({ id: l.id, type: l.type, kind: classify(l.id, l.type) }));
    caches.set(map, c);
  }
  return c;
}

export type StyleOptions = {
  /** false = hide land use, buildings and base labels, leaving only sea and the city's own layers */
  base: boolean;
  /** false = fade the road network right back */
  roads: boolean;
};

const safe = (fn: () => void) => {
  try {
    fn();
  } catch {
    /* a layer may not exist in a future style revision - never let styling crash the map */
  }
};

export function applyPalette(map: MapLibreMap, phase: TimePhase, opts: StyleOptions): void {
  if (!map.isStyleLoaded() && !map.getStyle()) return;
  const p = PALETTES[phase];
  const set = map.setPaintProperty.bind(map);
  const lay = map.setLayoutProperty.bind(map);

  for (const { id, type, kind } of layerCache(map)) {
    safe(() => {
      switch (kind) {
        case "bg": set(id, "background-color", p.bg); break;
        case "hide": lay(id, "visibility", "none"); break;
        case "water": set(id, "fill-color", p.water); break;
        case "park": set(id, "fill-color", p.park); set(id, "fill-opacity", opts.base ? 1 : 0); break;
        case "sand": set(id, "fill-color", p.sand); set(id, "fill-opacity", opts.base ? 1 : 0); break;
        case "residential": set(id, "fill-color", p.residential); set(id, "fill-opacity", opts.base ? 1 : 0); break;
        case "landuse": set(id, "fill-color", p.landuse); set(id, "fill-opacity", opts.base ? 1 : 0); break;
        case "aeroway": set(id, "fill-color", p.aeroway); set(id, "fill-opacity", opts.base ? 1 : 0); break;
        case "building": set(id, "fill-color", p.building); set(id, "fill-opacity", opts.base ? 0.9 : 0); break;
        case "building3d":
          set(id, "fill-extrusion-color", p.building3d);
          set(id, "fill-extrusion-opacity", opts.base ? 0.78 : 0);
          break;
        case "waterLine": set(id, "line-color", p.waterLine); break;
        case "casing": set(id, "line-color", p.casing); set(id, "line-opacity", opts.roads ? 0.9 : 0); break;
        case "roadMinor": set(id, "line-color", p.roadMinor); set(id, "line-opacity", opts.roads ? 1 : 0); break;
        case "roadMid": set(id, "line-color", p.roadMid); set(id, "line-opacity", opts.roads ? 1 : 0); break;
        case "roadMajor": set(id, "line-color", p.roadMajor); set(id, "line-opacity", opts.roads ? 1 : 0); break;
        case "roadMotorway": set(id, "line-color", p.roadMotorway); set(id, "line-opacity", opts.roads ? 0.95 : 0); break;
        case "rail": set(id, "line-color", p.rail); set(id, "line-opacity", opts.roads ? 0.8 : 0); break;
        case "boundary": set(id, "line-color", p.boundary); break;
        case "label": {
          set(id, "text-color", p.label);
          set(id, "text-halo-color", p.halo);
          set(id, "text-halo-width", 1.6);
          lay(id, "visibility", opts.base || /water|label_city|label_country|label_state/.test(id) ? "visible" : "none");
          break;
        }
        case "labelDim": {
          if (type === "symbol") {
            set(id, "text-color", p.labelDim);
            set(id, "text-halo-color", p.halo);
            set(id, "text-halo-width", 1.4);
            set(id, "icon-opacity", 0.55);
            lay(id, "visibility", opts.base ? "visible" : "none");
          }
          break;
        }
        default: break;
      }
    });
  }
}

/** One-off structural tweaks after the style loads. */
export function tuneStyle(map: MapLibreMap): void {
  // Our own neighbourhood markers replace the base map's suburb labels until you zoom in close.
  safe(() => map.setLayerZoomRange("label_other", 13.6, 24));
  safe(() => map.setLayerZoomRange("label_village", 13, 24));
  safe(() => map.setLayerZoomRange("label_town", 12.5, 24));
  // Points of interest are noisy at city scale.
  for (const id of ["poi_r20", "poi_r7", "poi_r1"]) safe(() => map.setLayerZoomRange(id, 15.5, 24));
}
