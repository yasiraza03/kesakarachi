/**
 * Major road corridors used by the SIMULATED traffic model. STATIC REFERENCE DATA.
 * Geometry is NOT stored here: each corridor is matched by name against the OpenFreeMap road tiles
 * (`transportation_name`; the lower-cased English/Latin name contains any token), so the line drawn on the map is the real road.
 *
 *  weight  assumed importance / baseline loading, 0..1
 *  kind    which daily shape the corridor follows (see lib/systems.ts)
 *  serves  neighbourhoods that lean on it (drives the per-area traffic number)
 */
export type CorridorKind = "commuter" | "commercial" | "leisure";

export type Corridor = {
  id: string;
  name: string;
  tokens: string[];
  weight: number;
  kind: CorridorKind;
  serves: string[];
};

export const corridors: Corridor[] = [
  { id: "shahrah-e-faisal", name: "Shahrah-e-Faisal", tokens: ["shahrah-e-faisal"], weight: 0.95, kind: "commuter", serves: ["karsaz", "bahadurabad", "pechs", "tariq-road", "dha", "shah-faisal"] },
  { id: "ma-jinnah", name: "M.A. Jinnah Road", tokens: ["m.a. jinnah", "muhammad ali jinnah road"], weight: 0.8, kind: "commuter", serves: ["saddar", "burns-road", "lyari", "pechs"] },
  { id: "university-road", name: "University Road", tokens: ["university road"], weight: 0.85, kind: "commuter", serves: ["gulshan", "johar", "nazimabad"] },
  { id: "rashid-minhas", name: "Rashid Minhas Road", tokens: ["rashid minhas"], weight: 0.7, kind: "commuter", serves: ["gulshan", "johar", "federal-b", "karsaz"] },
  { id: "korangi-road", name: "Korangi Road", tokens: ["korangi road"], weight: 0.7, kind: "commuter", serves: ["korangi", "landhi", "shah-faisal", "dha"] },
  { id: "shaheed-e-millat", name: "Shaheed-e-Millat Road", tokens: ["shaheed e millat"], weight: 0.7, kind: "commuter", serves: ["pechs", "bahadurabad", "tariq-road", "dha", "clifton"] },
  { id: "shahrah-e-qaideen", name: "Shahrah-e-Qaideen", tokens: ["shahrah-e-qaideen"], weight: 0.6, kind: "commuter", serves: ["pechs", "saddar", "tariq-road"] },
  { id: "ii-chundrigar", name: "I.I. Chundrigar Road", tokens: ["chundrigar"], weight: 0.75, kind: "commercial", serves: ["saddar", "keamari", "burns-road"] },
  { id: "mauripur", name: "Mauripur Road", tokens: ["mauripur road"], weight: 0.6, kind: "commercial", serves: ["keamari", "lyari", "site"] },
  { id: "khayaban-e-ittehad", name: "Khayaban-e-Ittehad", tokens: ["khayaban-e-ittehad", "khayaban e ittehad"], weight: 0.6, kind: "leisure", serves: ["dha", "clifton", "boat-basin"] },
  { id: "sea-view-road", name: "Sea View Road", tokens: ["abdul sattar edhi", "sea view road"], weight: 0.55, kind: "leisure", serves: ["clifton", "dha", "boat-basin"] },
  { id: "lyari-expressway", name: "Lyari Expressway", tokens: ["lyari expressway"], weight: 0.6, kind: "commuter", serves: ["lyari", "saddar", "site"] },
  { id: "stadium-road", name: "Stadium Road", tokens: ["stadium road"], weight: 0.55, kind: "commuter", serves: ["pechs", "bahadurabad", "karsaz"] },
  { id: "northern-bypass", name: "Northern Bypass", tokens: ["bypass"], weight: 0.5, kind: "commercial", serves: ["orangi", "site", "north-karachi"] },
  { id: "national-highway", name: "National Highway (N-5)", tokens: ["national highway"], weight: 0.55, kind: "commercial", serves: ["malir", "landhi", "korangi"] },
];
