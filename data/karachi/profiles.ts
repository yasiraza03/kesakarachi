/**
 * MODELLING ASSUMPTIONS - hand-set, qualitative, 0..1. NOT measurements and NOT statistics.
 * They are the only per-area inputs the SIMULATED city systems use (see lib/systems.ts), and they exist so the
 * simulation has somewhere to start. Change them freely; the engine just reads them.
 *
 *  density     how built-up / packed the area is
 *  coastal     exposure to the sea breeze and sea-level drainage outfalls
 *  green       tree / open-space cover
 *  industrial  share of industrial land use
 *  lowLying    assumed tendency for water to pool (drainage proneness)
 *  gridVuln    assumed vulnerability to supply shortfalls on the power network
 *  waterVuln   assumed vulnerability to supply shortfalls on the water network
 *  nightlife   evening / night street activity (noise, crowds)
 */
export type AreaProfile = {
  density: number;
  coastal: number;
  green: number;
  industrial: number;
  lowLying: number;
  gridVuln: number;
  waterVuln: number;
  nightlife: number;
};

const p = (
  density: number, coastal: number, green: number, industrial: number,
  lowLying: number, gridVuln: number, waterVuln: number, nightlife: number,
): AreaProfile => ({ density, coastal, green, industrial, lowLying, gridVuln, waterVuln, nightlife });

export const profiles: Record<string, AreaProfile> = {
  saddar: p(0.95, 0.15, 0.05, 0.1, 0.5, 0.6, 0.6, 0.8),
  clifton: p(0.6, 0.8, 0.25, 0, 0.5, 0.3, 0.35, 0.7),
  dha: p(0.5, 0.8, 0.25, 0, 0.5, 0.25, 0.4, 0.6),
  "boat-basin": p(0.6, 0.8, 0.15, 0, 0.5, 0.3, 0.35, 0.85),
  gulshan: p(0.85, 0, 0.15, 0, 0.35, 0.55, 0.6, 0.5),
  johar: p(0.85, 0, 0.1, 0, 0.35, 0.6, 0.65, 0.45),
  "north-nazimabad": p(0.8, 0, 0.2, 0, 0.3, 0.55, 0.55, 0.4),
  nazimabad: p(0.9, 0, 0.1, 0.05, 0.45, 0.6, 0.6, 0.4),
  pechs: p(0.8, 0.05, 0.2, 0, 0.3, 0.4, 0.5, 0.6),
  korangi: p(0.7, 0.2, 0.05, 0.6, 0.65, 0.7, 0.7, 0.25),
  landhi: p(0.65, 0.1, 0.05, 0.6, 0.55, 0.7, 0.7, 0.2),
  malir: p(0.55, 0, 0.2, 0.2, 0.7, 0.6, 0.65, 0.25),
  lyari: p(0.98, 0.2, 0.02, 0.2, 0.8, 0.75, 0.8, 0.5),
  orangi: p(0.95, 0, 0.03, 0.15, 0.6, 0.8, 0.85, 0.3),
  site: p(0.5, 0.05, 0.03, 0.95, 0.55, 0.6, 0.6, 0.2),
  "shah-faisal": p(0.8, 0.1, 0.05, 0.1, 0.5, 0.7, 0.7, 0.3),
  "federal-b": p(0.85, 0, 0.15, 0, 0.3, 0.5, 0.55, 0.45),
  bahadurabad: p(0.8, 0.05, 0.1, 0, 0.3, 0.4, 0.5, 0.6),
  "tariq-road": p(0.9, 0.05, 0.05, 0, 0.3, 0.45, 0.5, 0.8),
  "burns-road": p(0.95, 0.15, 0.02, 0.05, 0.5, 0.6, 0.6, 0.9),
  keamari: p(0.6, 0.9, 0.05, 0.7, 0.7, 0.7, 0.6, 0.3),
  karsaz: p(0.7, 0.05, 0.15, 0, 0.35, 0.45, 0.5, 0.4),
  "north-karachi": p(0.9, 0, 0.1, 0.05, 0.4, 0.7, 0.7, 0.3),
};
