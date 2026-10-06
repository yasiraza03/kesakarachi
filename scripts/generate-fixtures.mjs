// Generates data/fixtures/*.json - a deterministic, plausible warm-season Karachi day.
// This is OFFLINE REFERENCE DATA used only when Open-Meteo is unreachable and no cached value exists.
// The UI flags it loudly as "not live". Run: node scripts/generate-fixtures.mjs
import { writeFileSync } from "node:fs";

const r1 = (x) => Math.round(x * 10) / 10;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

function usAqi(pm) {
  const bands = [[0, 9, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 125.4, 151, 200]];
  for (const [cl, ch, il, ih] of bands) if (pm <= ch) return Math.round(((ih - il) / (ch - cl)) * (Math.max(pm, cl) - cl) + il);
  return 200;
}

const hourly = [];
const air = [];
for (let i = 0; i < 72; i++) {
  const h = i % 24;
  const temperature = r1(29.5 + 4.5 * Math.sin(((h - 9) / 24) * 2 * Math.PI));
  const humidity = Math.round(clamp(80 - (temperature - 25) * 2.5, 35, 95));
  const apparentTemperature = r1(temperature + Math.max(0, humidity - 40) * 0.12);
  const breeze = Math.max(0, Math.sin(((h - 10) / 10) * Math.PI));
  const isDay = h >= 6 && h < 18;
  hourly.push({
    temperature,
    apparentTemperature,
    humidity,
    precipitationProbability: 5,
    precipitation: 0,
    cloudCover: 20,
    windSpeed: r1(9 + 11 * breeze),
    windGusts: r1(15 + 14 * breeze),
    windDirection: breeze > 0.05 ? 225 : 345,
    weatherCode: isDay ? 1 : 0,
    isDay,
  });
  const pm25 = r1(40 + 11 * Math.cos(((h - 3) / 24) * 2 * Math.PI));
  const sun = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
  air.push({
    pm25,
    pm10: r1(pm25 * 2.1),
    usAqi: usAqi(pm25),
    europeanAqi: Math.round(pm25 * 1.5),
    carbonMonoxide: 320,
    nitrogenDioxide: 24,
    sulphurDioxide: 9,
    ozone: Math.round(55 + 30 * sun),
    dust: 18,
    aerosolOpticalDepth: 0.35,
    uvIndex: r1(8 * sun),
  });
}

const daily = [0, 1, 2].map(() => ({ sunriseMin: 378, sunsetMin: 1079, tMax: 34, tMin: 25, pop: 5, code: 1, uv: 8 }));

writeFileSync(new URL("../data/fixtures/weather.json", import.meta.url), JSON.stringify({ _note: "Offline reference day - not live data.", pressure: 1008, hourly, daily }, null, 1));
writeFileSync(new URL("../data/fixtures/air.json", import.meta.url), JSON.stringify({ _note: "Offline reference day - not live data.", hourly: air }, null, 1));
console.log("fixtures written");
