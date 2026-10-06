/** One hour of the city, already run through the simulation + pulse engine. Drives the timeline and the dial. */
export type SeriesPoint = {
  /** epoch ms, start of the local hour */
  t: number;
  temperature: number;
  apparent: number;
  rain: number;
  code: number;
  isDay: boolean;
  pulse: number;
};

/** Heat ramp shared by the dial bars and the map glow (apparent temperature -> colour). */
export const HEAT_STOPS: [number, string][] = [
  [18, "#5e8fa3"], [26, "#a9d8d0"], [31, "#c9b89a"], [35, "#f2b84b"], [39, "#e47d5a"], [43, "#e85d5d"],
];

export function heatColor(v: number): string {
  if (v <= HEAT_STOPS[0][0]) return HEAT_STOPS[0][1];
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [v1, c1] = HEAT_STOPS[i];
    const [v0, c0] = HEAT_STOPS[i - 1];
    if (v <= v1) {
      const f = (v - v0) / (v1 - v0);
      return mix(c0, c1, f);
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length - 1][1];
}

function mix(a: string, b: string, f: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - f) + ((pb >> shift) & 255) * f);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/** Index ramp for the simulated systems: 0 calm sea -> sodium -> sunset -> signal red. */
export const INDEX_STOPS: [number, string][] = [
  [0, "#5e8fa3"], [25, "#a9d8d0"], [50, "#f2b84b"], [70, "#e47d5a"], [88, "#e85d5d"],
];

export function indexColor(v: number): string {
  if (v <= INDEX_STOPS[0][0]) return INDEX_STOPS[0][1];
  for (let i = 1; i < INDEX_STOPS.length; i++) {
    const [v1, c1] = INDEX_STOPS[i];
    const [v0, c0] = INDEX_STOPS[i - 1];
    if (v <= v1) return mix(c0, c1, (v - v0) / (v1 - v0));
  }
  return INDEX_STOPS[INDEX_STOPS.length - 1][1];
}
