"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  /** "right" slides in over the right column on desktop; on mobile every drawer is a full-height sheet. */
  side?: "right" | "left";
  width?: number;
  tone?: "default" | "sim";
  children: React.ReactNode;
};

export function Drawer({ open, onClose, title, eyebrow, side = "right", width = 420, tone = "default", children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prev.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>("[data-autofocus], button, input")?.focus(), 60);
    return () => {
      clearTimeout(t);
      prev.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40" role="presentation">
      <button aria-label="Close panel" tabIndex={-1} className="absolute inset-0 cursor-default bg-night/40 anim-fade lg:bg-transparent" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ ["--w" as string]: `${width}px` }}
        className={`panel-solid absolute inset-y-0 flex w-full flex-col lg:w-[var(--w)] ${side === "right" ? "right-0 anim-in-right lg:right-4 lg:top-16 lg:bottom-4 lg:inset-y-auto" : "left-0 anim-in-left lg:left-4 lg:top-16 lg:bottom-4 lg:inset-y-auto"} ${tone === "sim" ? "!border-sodium/50" : ""}`}
      >
        <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 hair-b">
          <div>
            {eyebrow && <p className={`label mb-1.5 ${tone === "sim" ? "!text-sodium" : "!text-accent"}`}>{eyebrow}</p>}
            <h2 className="text-xl font-light tracking-tight">{title}</h2>
          </div>
          <button className="btn !h-8 !px-2" onClick={onClose} aria-label="Close">
            <X size={14} />
            <span className="kbd">esc</span>
          </button>
        </header>
        <div className="scroll-y min-h-0 flex-1 px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
