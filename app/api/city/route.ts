import { NextResponse } from "next/server";
import { cityData } from "@/data/karachi";

/** Static reference data: effectively immutable between deploys, so cache it hard. */
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(cityData, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
