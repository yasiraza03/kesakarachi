"use client";

import { Compass, Crosshair, Minus, Mountain, Plus } from "lucide-react";
import type { MapHandle } from "./types";

type Props = {
  map: React.RefObject<MapHandle | null>;
  orientation?: "row" | "col";
};

export function MapControls({ map, orientation = "row" }: Props) {
  const b = "btn !h-8 !w-8 !justify-center !px-0";
  return (
    <div role="group" aria-label="Map controls" className={`flex gap-1 ${orientation === "col" ? "flex-col" : "flex-row"}`}>
      <button className={b} onClick={() => map.current?.zoomBy(1)} aria-label="Zoom in"><Plus size={14} /></button>
      <button className={b} onClick={() => map.current?.zoomBy(-1)} aria-label="Zoom out"><Minus size={14} /></button>
      <button className={b} onClick={() => map.current?.togglePitch()} aria-label="Toggle 3D tilt" title="Tilt"><Mountain size={14} /></button>
      <button className={b} onClick={() => map.current?.resetNorth()} aria-label="Reset north" title="North"><Compass size={14} /></button>
      <button className={b} onClick={() => map.current?.recenter()} aria-label="Recentre on Karachi" title="Recentre"><Crosshair size={14} /></button>
    </div>
  );
}
