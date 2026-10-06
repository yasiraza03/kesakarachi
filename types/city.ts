/** Shared domain types. Components only ever see these — never raw upstream payloads. */

export type DataSource = "live" | "stale" | "fixture";

export type Meta = {
  /** Where this payload ultimately came from. `fixture` = bundled reference data, NOT live. */
  source: DataSource;
  /** Epoch ms when the server last successfully fetched upstream (or when the fixture was served). */
  fetchedAt: number;
  /** Provider name, for attribution. */
  provider: string;
};

export type Envelope<T> = { data: T; meta: Meta };

/* ───────────────────────────── weather ───────────────────────────── */

export type CurrentWeather = {
  /** epoch ms of the observation/model step */
  t: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  cloudCover: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  weatherCode: number;
  isDay: boolean;
};

export type HourlyWeather = {
  t: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitationProbability: number;
  precipitation: number;
  cloudCover: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  weatherCode: number;
  isDay: boolean;
};

export type DailyWeather = {
  /** epoch ms of local midnight (Asia/Karachi) */
  t: number;
  sunrise: number;
  sunset: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbabilityMax: number;
  weatherCode: number;
  uvIndexMax: number;
};

/** Model reading for a neighbourhood grid point. Same model grid as the city centre — see README limitations. */
export type AreaWeather = {
  id: string;
  current: { temperature: number; apparentTemperature: number; windSpeed: number };
  /** hourly, aligned with WeatherData.hourly (same length / order) */
  temperature: number[];
  apparentTemperature: number[];
};

export type WeatherData = {
  location: { name: string; latitude: number; longitude: number; timezone: string };
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  areas: AreaWeather[];
  updatedAt: string;
};

/* ───────────────────────────── air ───────────────────────────── */

export type AirReading = {
  t: number;
  pm25: number;
  pm10: number;
  usAqi: number;
  europeanAqi: number | null;
  carbonMonoxide: number | null;
  nitrogenDioxide: number | null;
  sulphurDioxide: number | null;
  ozone: number | null;
  dust: number | null;
  aerosolOpticalDepth: number | null;
  uvIndex: number | null;
};

export type AirData = {
  /** Always "MODELLED AIR QUALITY" — CAMS model output, not a ground-station reading. */
  kind: "modelled";
  current: AirReading;
  hourly: AirReading[];
  updatedAt: string;
};

/* ───────────────────────────── prayer ───────────────────────────── */

export type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export type PrayerTime = { name: PrayerName; t: number };

export type PrayerData = {
  method: string;
  /** today's and tomorrow's times, ascending */
  times: PrayerTime[];
  updatedAt: string;
};

/* ───────────────────────────── city (static reference) ───────────────────────────── */

export type Rank = 1 | 2 | 3;

export type Neighborhood = {
  id: string;
  name: string;
  /** Karachi district (administrative) the area sits in. */
  district: string;
  latitude: number;
  longitude: number;
  /** 1 = always labelled, 3 = only when zoomed in close */
  rank: Rank;
  /** One factual orientation line. No statistics. */
  note: string;
};

export type LandmarkCategory =
  | "LANDMARK"
  | "BEACH"
  | "PARK"
  | "MARKET"
  | "TRANSIT"
  | "SPORTS"
  | "UNIVERSITY"
  | "HOSPITAL"
  | "CULTURAL"
  | "FOOD";

export type Landmark = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: LandmarkCategory;
  note: string;
};

export type District = {
  id: string;
  name: string;
  /** Orientation only. */
  note: string;
};

export type CityData = {
  center: { latitude: number; longitude: number };
  neighborhoods: Neighborhood[];
  landmarks: Landmark[];
  districts: District[];
};

/* ───────────────────────────── engines ───────────────────────────── */

export type TimePhase = "DAWN" | "MORNING" | "AFTERNOON" | "SUNSET" | "EVENING" | "NIGHT";

/** One consistent snapshot of "what Karachi is like at time t" — the input to every engine. */
export type Conditions = {
  t: number;
  isNow: boolean;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  cloudCover: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  weatherCode: number;
  isDay: boolean;
  /** null when air data is unavailable */
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  uvIndex: number | null;
};

export type Simulation = {
  /** °C added to air temperature */
  temperature: 0 | 2 | 5;
  /** percentage points added to relative humidity */
  humidity: 0 | 10 | 20;
  /** rain-chance floor: null = as forecast */
  rain: null | 25 | 50 | 100;
  /** extra traffic load on city activity, percent */
  traffic: 0 | 20 | 50;
  scenario: Scenario;
};

/**
 * City-systems scenario levers. Everything here is SIMULATION: there is no free live data behind traffic, flooding,
 * power, water, transit, noise or security in Karachi, so these are deterministic models over the weather + time.
 */
export type Scenario = {
  /** relative change in the security-incident index (baseline 100 = today, NOT real crime data) */
  crime: -40 | -20 | 0 | 20;
  /** % change in fuel price: damps road demand, pushes people onto transit */
  fuel: 0 | 10 | 25 | 50;
  /** % extra bus / BRT service */
  transit: 0 | 25 | 50;
  /** % change in power supply (negative = shortfall) */
  grid: 0 | -10 | -25;
  /** % change in water supply */
  water: 0 | -15 | -30;
  /** % change in drainage capacity (negative = blocked nullahs) */
  drainage: -25 | 0 | 25;
  /** extra traffic on one named corridor, optionally only during rush hours */
  corridor: { id: string | null; boost: 0 | 20 | 40 | 60; rushOnly: boolean };
  /** a one-off event pulling crowds to a landmark */
  event: string | null;
  /** corridor with lane closures (roadworks) */
  works: string | null;
};

/* ───────────────────────────── history (real archive data) ───────────────────────────── */

export type HistoryYear = { year: number; tMax: number; tMin: number; precip: number };

export type HistoryDay = { t: number; tMax: number; tMin: number; precip: number };

export type HistoryData = {
  /** calendar date the climatology is centred on (local) */
  month: number;
  day: number;
  /** +/- this many days around the date are averaged per year */
  windowDays: number;
  years: HistoryYear[];
  normal: { tMax: number; tMin: number; precipPerDay: number };
  last30: HistoryDay[];
  /** last date covered by the archive (it lags real time by a few days) */
  archiveEnd: number;
  updatedAt: string;
};

export type Level = {
  /** machine value, ordered 0..n */
  index: number;
  label: string;
};

export type Tone = "calm" | "sea" | "warn" | "hot" | "alert";

export type StateReading = { key: string; title: string; label: string; index: number; max: number; tone: Tone; detail: string };

export type CityState = {
  heat: StateReading;
  humidity: StateReading;
  air: StateReading;
  wind: StateReading;
  rain: StateReading;
  activity: StateReading;
  comfort: StateReading;
};

export type PulseComponent = {
  key: string;
  label: string;
  weight: number;
  /** 0–100 */
  score: number;
  detail: string;
};

export type Pulse = {
  value: number;
  label: string;
  components: PulseComponent[];
};
