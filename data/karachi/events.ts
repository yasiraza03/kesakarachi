/**
 * SIMULATED events: "what if a crowd were pulled to this landmark?". Not a calendar - nothing here claims an event is happening.
 *
 *  landmarkId   where the crowd gathers (looked up in landmarks.ts)
 *  radiusKm     how far the crowd's pull reaches; the effect fades linearly to zero at the edge
 *  traffic      % extra road load at the centre
 *  noiseDb      extra dBA at the centre
 *  activity     citywide lift to the activity (Pulse) lever, %
 *  corridors    extra % load on named corridors
 */
export type CityEvent = {
  id: string;
  name: string;
  blurb: string;
  landmarkId: string;
  radiusKm: number;
  traffic: number;
  noiseDb: number;
  activity: number;
  corridors: Record<string, number>;
};

export const events: CityEvent[] = [
  {
    id: "cricket", name: "Cricket match", blurb: "Full house at the National Stadium", landmarkId: "national-stadium",
    radiusKm: 5, traffic: 45, noiseDb: 12, activity: 10,
    corridors: { "stadium-road": 60, "shahrah-e-faisal": 25, "university-road": 20, "rashid-minhas": 20 },
  },
  {
    id: "eid-shopping", name: "Eid shopping rush", blurb: "Empress Market and the Saddar bazaars", landmarkId: "empress-market",
    radiusKm: 4, traffic: 40, noiseDb: 8, activity: 18,
    corridors: { "ma-jinnah": 35, "ii-chundrigar": 20, "shahrah-e-qaideen": 15 },
  },
  {
    id: "beach-evening", name: "Beach evening", blurb: "Families head to Sea View and Clifton", landmarkId: "sea-view",
    radiusKm: 6, traffic: 50, noiseDb: 6, activity: 8,
    corridors: { "khayaban-e-ittehad": 40, "sea-view-road": 55, "shaheed-e-millat": 15 },
  },
  {
    id: "port-festival", name: "Festival at Port Grand", blurb: "Food and music by the Native Jetty", landmarkId: "port-grand",
    radiusKm: 4, traffic: 35, noiseDb: 10, activity: 8,
    corridors: { mauripur: 25, "ii-chundrigar": 25 },
  },
];
