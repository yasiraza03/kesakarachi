import { NextResponse } from "next/server";
import { REVALIDATE } from "@/lib/constants";
import { withFallback } from "@/lib/resilient";
import { loadWeather, weatherFixture } from "@/lib/weather";

export const revalidate = 600; // must stay in sync with REVALIDATE.weather

export async function GET() {
  const result = await withFallback({
    key: "weather",
    provider: "Open-Meteo",
    load: loadWeather,
    fixture: () => weatherFixture(),
  });
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": `public, s-maxage=${REVALIDATE.weather}, stale-while-revalidate=${REVALIDATE.weather * 2}`,
    },
  });
}
