import { NextResponse } from "next/server";
import { airFixture, loadAir } from "@/lib/air";
import { REVALIDATE } from "@/lib/constants";
import { withFallback } from "@/lib/resilient";

export const revalidate = 1200; // must stay in sync with REVALIDATE.air

export async function GET() {
  const result = await withFallback({
    key: "air",
    provider: "Open-Meteo Air Quality (CAMS model)",
    load: loadAir,
    fixture: () => airFixture(),
  });
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": `public, s-maxage=${REVALIDATE.air}, stale-while-revalidate=${REVALIDATE.air * 2}`,
    },
  });
}
