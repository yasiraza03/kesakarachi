"use client";

import { Drawer } from "@/components/ui/Drawer";

const KEYS: [string, string][] = [
  ["F", "Karachi right now — full-screen mode"],
  ["S", "What if? simulation"],
  ["L", "Layers of the city"],
  ["A", "Air quality detail"],
  ["C", "City systems — simulated traffic, flooding, power, water…"],
  ["H", "This date in the record — real historical weather"],
  ["X", "Compare neighbourhoods"],
  ["I", "How it works — formulas & sources"],
  ["/  or  ⌘K", "Go to an area or landmark"],
  ["←  →", "Scrub the city one hour back / forward"],
  ["N", "Back to now"],
  ["R", "Reset the camera"],
  ["Esc", "Close whatever is open"],
  ["?", "This list"],
];

export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="Keyboard" eyebrow="SHORTCUTS" width={380}>
      <ul className="m-0 list-none p-0">
        {KEYS.map(([k, d]) => (
          <li key={k} className="grid grid-cols-[110px_1fr] items-center gap-3 py-2.5 hair-t">
            <span className="flex gap-1">
              {k.split(/\s{2,}/).map((part) => (
                <span key={part} className="kbd">{part}</span>
              ))}
            </span>
            <span className="text-[13px] text-ink-dim">{d}</span>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
