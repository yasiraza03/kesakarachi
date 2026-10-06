"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_STYLE, landmarks } from "@/data/karachi/landmarks";
import { neighborhoods } from "@/data/karachi/neighborhoods";
import type { Selection } from "@/components/map/types";

export type PaletteAction = { id: string; label: string; hint: string; run: () => void };

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (s: Selection) => void;
  actions: PaletteAction[];
};

type Item = { key: string; label: string; hint: string; run: () => void };

export function CommandPalette({ open, onClose, onPick, actions }: Props) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const all: Item[] = [
      ...actions.map((a) => ({ key: `a-${a.id}`, label: a.label, hint: a.hint, run: a.run })),
      ...neighborhoods.map((n) => ({ key: `n-${n.id}`, label: n.name, hint: `AREA · ${n.district.toUpperCase()}`, run: () => onPick({ kind: "area", id: n.id }) })),
      ...landmarks.map((l) => ({ key: `l-${l.id}`, label: l.name, hint: CATEGORY_STYLE[l.category].label.toUpperCase(), run: () => onPick({ kind: "landmark", id: l.id }) })),
    ];
    const s = q.trim().toLowerCase();
    if (!s) return all.slice(0, 14);
    return all
      .filter((i) => i.label.toLowerCase().includes(s) || i.hint.toLowerCase().includes(s))
      .sort((a, b) => Number(b.label.toLowerCase().startsWith(s)) - Number(a.label.toLowerCase().startsWith(s)))
      .slice(0, 14);
  }, [q, actions, onPick]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the palette each time it opens
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  if (!open) return null;

  const run = (i: Item | undefined) => {
    if (!i) return;
    onClose();
    i.run();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-start justify-items-center bg-night/60 px-4 pt-[14vh] anim-fade" onMouseDown={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to"
        className="panel-solid w-full max-w-[560px] anim-rise"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          if (e.key === "Enter") { e.preventDefault(); run(items[active]); }
        }}
      >
        <div className="flex items-center gap-3 px-4 hair-b">
          <Search size={15} className="text-ink-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            placeholder="Go to Clifton, Frere Hall, Sea View, or type a command…"
            aria-label="Search areas, landmarks and actions"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-faint"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `pal-${items[active].key}` : undefined}
          />
          <span className="kbd">esc</span>
        </div>
        <ul id="palette-list" role="listbox" className="scroll-y m-0 max-h-[50vh] list-none p-1">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-faint">Nothing matches &ldquo;{q}&rdquo;.</li>}
          {items.map((it, i) => (
            <li
              key={it.key}
              id={`pal-${it.key}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(it)}
              className={`flex cursor-pointer items-center justify-between px-3 py-2.5 ${i === active ? "bg-accent/10 text-accent" : "text-ink"}`}
            >
              <span className="text-[14px]">{it.label}</span>
              <span className="mono text-[10px] tracking-[0.14em] text-ink-faint">{it.hint}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
