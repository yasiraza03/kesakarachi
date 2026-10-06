// MapLibre v6 resolves its web worker as a sibling file of its own module URL. Bundlers don't emit that file,
// so we serve the two worker modules from /public/maplibre and point MapLibre at them with setWorkerUrl().
// Runs on postinstall / predev / prebuild, so `npm install && npm run dev` just works and Vercel builds work.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "maplibre-gl", "dist");
const dest = join(root, "public", "maplibre");

if (!existsSync(src)) {
  console.warn("[maplibre-worker] maplibre-gl not installed yet - skipping");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(join(src, f), join(dest, f));
console.log("[maplibre-worker] copied worker modules to public/maplibre");
