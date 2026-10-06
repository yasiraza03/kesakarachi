import { NextResponse } from "next/server";
import { REVALIDATE } from "@/lib/constants";
import { loadPrayer } from "@/lib/prayer";
import { withFallback } from "@/lib/resilient";

export const revalidate = 21600; // must stay in sync with REVALIDATE.prayer

export async function GET() {
  // No fixture on purpose: an invented prayer time is worse than none. The UI just hides the module.
  const result = await withFallback({
    key: "prayer",
    provider: "Aladhan",
    load: () => loadPrayer(),
  });
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": `public, s-maxage=${REVALIDATE.prayer}, stale-while-revalidate=${REVALIDATE.prayer}`,
    },
  });
}
