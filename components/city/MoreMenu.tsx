"use client";

import { Activity, CloudSun, GitCompare, History, Info } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (p: "systems" | "history" | "compare" | "air" | "method") => void;
};

const ITEMS = [
  { k: "systems" as const, icon: <Activity size={18} />, title: "City systems", blurb: "Simulated traffic, flooding, power, water, transit, noise, heat islands." },
  { k: "history" as const, icon: <History size={18} />, title: "This date, in the record", blurb: "Today against ten years of real archive weather." },
  { k: "compare" as const, icon: <GitCompare size={18} />, title: "Compare neighbourhoods", blurb: "Side by side: real model temperature + simulated indices." },
  { k: "air" as const, icon: <CloudSun size={18} />, title: "Air quality", blurb: "Modelled PM2.5, PM10 and pollutants." },
  { k: "method" as const, icon: <Info size={18} />, title: "How it works", blurb: "Every formula, source and limit." },
];

/** Thumb-friendly index of the secondary panels, for phones. */
export function MoreMenu({ open, onClose, onPick }: Props) {
  return (
    <Drawer open={open} onClose={onClose} title="More" eyebrow="EXPLORE" width={380}>
      <ul className="m-0 list-none p-0">
        {ITEMS.map((i) => (
          <li key={i.k}>
            <button className="flex w-full items-start gap-4 py-4 text-left hair-t" onClick={() => onPick(i.k)}>
              <span className="mt-0.5 text-accent">{i.icon}</span>
              <span>
                <span className="block text-[16px] font-light">{i.title}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-faint">{i.blurb}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
