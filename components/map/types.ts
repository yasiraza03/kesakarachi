import type { SystemKey } from "@/lib/systems";

export type LayerKey = "base" | "neighborhoods" | "landmarks" | "roads" | "weather" | "air" | "simulation";

export type LayerState = Record<LayerKey, boolean>;

export const DEFAULT_LAYERS: LayerState = {
  base: true,
  neighborhoods: true,
  landmarks: true,
  roads: true,
  weather: true,
  air: true,
  simulation: true,
};

/** What the map paints per neighbourhood: the live weather, or one of the simulated city systems. */
export type Lens = "weather" | SystemKey;

export type FieldItem = { v: number; label: string };

/**
 * `temp`  -> v is a temperature, coloured with the heat ramp
 * `index` -> v is 0..100, coloured with the index ramp (calm -> alert)
 */
export type MapField = { kind: "temp" | "index"; items: Record<string, FieldItem>; simulated: boolean } | null;

export type CorridorPaint = { id: string; congestion: number }[];

export type MapEvent = { lng: number; lat: number; label: string } | null;

export type Selection = { kind: "area" | "landmark"; id: string } | null;

export type MapHandle = {
  /** The cinematic fly-in from the wide view to the hero camera. */
  intro: () => void;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  recenter: () => void;
  zoomBy: (delta: number) => void;
  resetNorth: () => void;
  togglePitch: () => void;
};

export type Padding = { top: number; right: number; bottom: number; left: number };

/** Weather-model reading for a neighbourhood grid point. */
export type AreaReading = { temperature: number; apparent: number };
