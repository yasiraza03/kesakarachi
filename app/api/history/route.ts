import { NextResponse } from "next/server";
import { REVALIDATE } from "@/lib/constants";
import { loadHistory } from "@/lib/history";
import { withFallback } from "@/lib/resilient";

export const revalidate = 86400; // must stay in sync with REVALIDATE.history

export async function GET() {
  // Real archive data only. No fixture: an invented climate record would be worse than an empty drawer.
  const result = await withFallback({
    key: "history",
    provider: "Open-Meteo archive (ERA5)",
    load: () => loadHistory(),
  });
  return NextResponse.json(result, {
    headers: { "Cache-Control": `public, s-maxage=${REVALIDATE.history}, stale-while-revalidate=${REVALIDATE.history}` },
  });
}
