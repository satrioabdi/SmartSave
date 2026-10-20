/**
 * Generates the demo food illustrations into public/photos/.
 *
 * The seed dataset stores photo file names only (e.g. banana-batch-a.jpg).
 * This script writes an illustrated SVG per demo photo — food sitting on a
 * weighing scale, matching the photo instruction in the Register Food wizard
 * — plus photos.json, the manifest the app consults so it only requests
 * files that actually exist.
 *
 * Re-run after editing:  node tools/gen-photos.mjs
 *
 * To show a REAL photo instead of the illustration, drop the image into
 * public/photos/ under the record's file name (e.g. banana-batch-a.jpg) and
 * add that file name to the manifest in this script (or edit photos.json).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "photos");

/** fmt: en-US thousands separators, matching the app's formatMass(). */
const fmt = (n) => (n ? n.toLocaleString("en-US") : null);

/** Illustration spec per demo photo. `g` is the mass shown on the scale display. */
const FOODS = {
  "banana-batch-a": { emoji: "🍌", title: "Banana batch A", g: 2000, bg: "#FFF6D9", mid: "#F5E1A4", dark: "#8A6D1F" },
  "banana-box-b": { emoji: "🍌", title: "Banana box B", g: 3000, bg: "#FFF6D9", mid: "#F5E1A4", dark: "#8A6D1F" },
  "tomato-crate": { emoji: "🍅", title: "Tomato crate", g: 1500, bg: "#FFE9E3", mid: "#F6C6BC", dark: "#8A3B2A" },
  "rice-trays": { emoji: "🍚", title: "Cooked rice trays", g: 3200, bg: "#F3F7EE", mid: "#DDE8D2", dark: "#5C6B4D" },
  "beef-trimmings": { emoji: "🥩", title: "Beef trimmings", g: 900, bg: "#FBE9E7", mid: "#EFB8B0", dark: "#7A2E24" },
  "fresh-beef": { emoji: "🥩", title: "Fresh beef", g: 1500, bg: "#FBE9E7", mid: "#EFB8B0", dark: "#7A2E24" },
  "orange-carton": { emoji: "🍊", title: "Orange carton", g: 4400, bg: "#FFF0E0", mid: "#F7D6AE", dark: "#8A5A1F" },
  "milk-pouches": { emoji: "🥛", title: "Cow's milk pouches", g: 2500, bg: "#EFF5FB", mid: "#D3E3F2", dark: "#3D5A73" },
  "spice-jars": { emoji: "🧂", title: "Spice blend jars", g: 600, bg: "#F6EFE6", mid: "#E4D4C0", dark: "#6B4E2E" },
  sourdough: { emoji: "🍞", title: "Sourdough loaves", g: 1800, bg: "#F7EFE2", mid: "#E3CFAF", dark: "#6E5230" },
  "greens-crate": { emoji: "🥬", title: "Leafy greens crate", g: 2700, bg: "#EDF6EC", mid: "#CBE4C9", dark: "#3F6B3E" },
  "apple-box": { emoji: "🍎", title: "Apple box", g: 5200, bg: "#FDEAEA", mid: "#F3BFBF", dark: "#7E2F2F" },
  "red-apples": { emoji: "🍎", title: "Red apples", g: 3600, bg: "#FDEAEA", mid: "#F3BFBF", dark: "#7E2F2F" },
  "tofu-trays": { emoji: "🧈", title: "Tofu trays", g: 1400, bg: "#F3F1E9", mid: "#DFD9C8", dark: "#6E6448" },
  "palm-oil": { emoji: "🛢️", title: "Palm oil drums", g: 6000, bg: "#FBEFD9", mid: "#EED9A8", dark: "#7A5A18" },
  "coffee-beans": { emoji: "☕", title: "Roasted coffee beans", g: 750, bg: "#F1E9E2", mid: "#D7C4B5", dark: "#5D4632" },
  cassava: { emoji: "🥔", title: "Cassava roots", g: 2100, bg: "#F5F0E4", mid: "#E0D5BC", dark: "#6C5B36" },
  "dark-chocolate": { emoji: "🍫", title: "Dark chocolate slabs", g: 480, bg: "#EFE4DC", mid: "#D5BCAC", dark: "#4E3325" },
  "egg-trays": { emoji: "🥚", title: "Egg trays", g: 1200, bg: "#F9F3E7", mid: "#EBDCC0", dark: "#6E5A2E" },
  tubers: { emoji: "🍠", title: "Other tubers basket", g: 1600, bg: "#F4EFE9", mid: "#DCCFC0", dark: "#5F4F3E" },
  "white-rice": { emoji: "🍚", title: "White rice", g: 2500, bg: "#F3F7EE", mid: "#DDE8D2", dark: "#5C6B4D" },
  // The two wizard demo-photo buttons.
  "fresh-batch": { emoji: "🥗", title: "Demo photo (fit)", g: null, bg: "#ECF6EC", mid: "#CDE6CC", dark: "#3F6B3E" },
  "expired-produce": { emoji: "🥀", title: "Demo photo (expired)", g: null, bg: "#F2ECE6", mid: "#D8C9BC", dark: "#6B5744" },
};

/**
 * One illustration: the food sitting on a weighing scale with its display
 * readable — the composition the photo instruction asks users to upload.
 */
function svg({ emoji, title, g, bg, mid, dark }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="${title} — demo illustration">
<rect width="400" height="300" fill="${bg}"/>
<rect x="120" y="196" width="160" height="44" rx="8" fill="${dark}"/>
<rect x="86" y="176" width="228" height="24" rx="6" fill="${mid}"/>
<rect x="150" y="206" width="100" height="26" rx="4" fill="#FFFFFF" opacity="0.9"/>
<text x="200" y="225" font-family="monospace" font-size="14" font-weight="700" text-anchor="middle" fill="${dark}">${g ? fmt(g) + " g" : "· · ·"}</text>
<ellipse cx="200" cy="176" rx="128" ry="14" fill="${mid}" opacity="0.6"/>
<text x="200" y="168" font-size="88" text-anchor="middle">${emoji}</text>
<text x="200" y="272" font-family="system-ui, sans-serif" font-size="15" font-weight="700" text-anchor="middle" fill="${dark}">${title}</text>
<text x="200" y="290" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle" fill="${dark}" opacity="0.75">Demo illustration — photo on scale</text>
</svg>
`;
}

mkdirSync(outDir, { recursive: true });
const files = [];
for (const [name, spec] of Object.entries(FOODS)) {
  const file = `${name}.svg`;
  writeFileSync(join(outDir, file), svg(spec), "utf8");
  files.push(file);
}
// Keep manually-added entries: a real photo dropped into public/photos/ and
// registered in photos.json survives a re-run of this script.
const manifestPath = join(outDir, "photos.json");
let manual: string[] = [];
if (existsSync(manifestPath)) {
  try {
    const previous: string[] = JSON.parse(readFileSync(manifestPath, "utf8"));
    manual = previous.filter((f) => !files.includes(f));
  } catch {
    /* corrupted or hand-edited manifest — regenerate from scratch */
  }
}
writeFileSync(manifestPath, JSON.stringify([...files, ...manual], null, 2) + "\n", "utf8");
console.log(`Wrote ${files.length} illustrations + photos.json (${manual.length} kept) to public/photos/`);
