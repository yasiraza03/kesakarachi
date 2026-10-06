type Props = {
  /** 0..1 */
  value: number;
  segments?: number;
  height?: number;
  className?: string;
};

/** A segmented bar readout - the instrument-panel answer to a progress bar. Colour comes from currentColor. */
export function Meter({ value, segments = 20, height = 10, className = "" }: Props) {
  const on = Math.round(Math.max(0, Math.min(1, value)) * segments);
  return (
    <span
      className={`seg w-full ${className}`}
      style={{ height, gridTemplateColumns: `repeat(${segments}, 1fr)` }}
      aria-hidden="true"
    >
      {Array.from({ length: segments }, (_, i) => (
        <i key={i} data-on={i < on} />
      ))}
    </span>
  );
}

/** Small N-pip level readout (e.g. 3 of 6). */
export function Pips({ index, max, className = "" }: { index: number; max: number; className?: string }) {
  return (
    <span className={`seg ${className}`} style={{ height: 8, width: (max + 1) * 7, gridTemplateColumns: `repeat(${max + 1}, 1fr)` }} aria-hidden="true">
      {Array.from({ length: max + 1 }, (_, i) => (
        <i key={i} data-on={i <= index} />
      ))}
    </span>
  );
}
