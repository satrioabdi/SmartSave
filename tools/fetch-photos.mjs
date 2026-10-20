/**
 * Downloads real, freely-licensed food photos into public/photos/ for every
 * demo record photo name, sourced from Wikimedia Commons (CC BY / CC BY-SA /
 * CC0 / Public domain). The app prefers a real image at photos/<photoLabel>
 * over the generated demo illustration (tools/gen-photos.mjs), which wins
 * over the emoji fallback.
 *
 * Instead of guessing exact file titles, each entry is a Commons SEARCH
 * query (namespace 6 = File); the first image result with a usable MIME
 * type is downloaded at 1200 px wide.
 *
 * Run:         node tools/fetch-photos.mjs
 * Dry run:     node tools/fetch-photos.mjs --dry
 * Single file: node tools/fetch-photos.mjs banana-batch-a
 * Re-download: node tools/fetch-photos.mjs --force
 *
 * Source, author, license and page URL are recorded in
 * public/photos/CREDITS.md. Re-runs skip existing files unless --force.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "photos");
const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const force = argv.includes("--force");
const only = argv.filter((a) => !a.startsWith("--"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Commons search query per record photo (basename without extension). */
const SEARCH = {
  "banana-batch-a": "banana bunch white background",
  "banana-box-b": "bananas bunch yellow",
  "tomato-crate": "fresh tomatoes",
  "rice-trays": "steamed rice bowl",
  "beef-trimmings": "raw beef cuts red meat",
  "fresh-beef": "raw ribeye steak meat",
  "orange-carton": "oranges fruit",
  "milk-pouches": "glass of milk",
  "spice-jars": "ground turmeric powder bowl",
  sourdough: "sourdough bread homemade loaf",
  "greens-crate": "cabbage lettuce vegetables",
  "apple-box": "red apples",
  "red-apples": "red apples fruit",
  "tofu-trays": "tofu",
  "palm-oil": "oil palm fruits",
  "coffee-beans": "roasted coffee beans",
  cassava: "cassava roots",
  "dark-chocolate": "dark chocolate chunks",
  "egg-trays": "eggs in tray",
  tubers: "taro roots",
  "white-rice": "white rice grains",
  "fresh-batch": "fresh vegetable salad bowl",
  "expired-produce": "overripe bananas",
};

/** Tiny check over the Commons license template name → short label. */
function licenseLabel(value) {
  if (/cc0/i.test(value)) return "CC0-1.0";
  if (/by-sa/i.test(value)) return "CC BY-SA";
  if (/\bCC BY\b|attribution/i.test(value)) return "CC BY";
  if (/public domain|\bPD\b/i.test(value)) return "Public domain";
  return value || "Unknown";
}

async function json(url, attempt = 1) {
  const res = await fetch(url, {
    headers: { "User-Agent": "SmartSave-prototype-photo-fetch/1.0 (demo project)" },
  });
  if (res.status === 429 && attempt <= 4) {
    const wait = attempt * 3000;
    console.log(`  … rate limited (429), waiting ${wait} ms`);
    await sleep(wait);
    return json(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function searchTitles(query) {
  const q = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srnamespace: "6", // File namespace
    srlimit: "6",
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const data = await json(`https://commons.wikimedia.org/w/api.php?${q}`);
  return (data?.query?.search ?? []).map((s) => s.title);
}

async function resolve(title) {
  const q = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: "1200",
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const data = await json(`https://commons.wikimedia.org/w/api.php?${q}`);
  const page = data?.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info || page.missing) return null;
  const meta = info.extmetadata ?? {};
  const strip = (s) => (s ?? "").replace(/<[^>]*>/g, "").trim();
  return {
    title,
    url: info.thumburl ?? info.url,
    mime: info.mime,
    author: strip(meta.Artist?.value) || "Unknown author",
    license: licenseLabel(meta.LicenseShortName?.value ?? ""),
    page: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
  };
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  /** Existing credits (file → "license | author | page"), preserved on re-run. */
  const creditsPath = join(outDir, "CREDITS.md");
  const credits = {};
  if (existsSync(creditsPath)) {
    for (const line of readFileSync(creditsPath, "utf8").split("\n")) {
      if (!line.startsWith("| `")) continue;
      const cells = line.split("|").map((c) => c.trim());
      credits[cells[1].replace(/`/g, "")] = cells.slice(2).join(" | ");
    }
  }

  let downloaded = 0;
  let failed = 0;

  for (const [name, query] of Object.entries(SEARCH)) {
    if (only.length > 0 && !only.includes(name)) continue;
    const outFile = join(outDir, `${name}.jpg`);
    if (!force && existsSync(outFile)) {
      console.log(`= ${name}.jpg already present, skipping (--force to re-download)`);
      continue;
    }
    if (dry) {
      console.log(`? ${name}.jpg would search: "${query}"`);
      continue;
    }

    let got = null;
    try {
      const titles = await searchTitles(query);
      for (const t of titles.slice(0, 4)) {
        const info = await resolve(t);
        if (info?.url && /image\/(jpeg|png|webp)/.test(info.mime ?? "")) {
          got = info;
          break;
        }
        await sleep(1200);
      }
    } catch (e) {
      console.log(`! ${name}: search failed (${e.message})`);
    }

    if (!got) {
      failed += 1;
      console.log(`✗ ${name}.jpg — no source resolved, illustration stays in place`);
      continue;
    }
    try {
      const bin = await fetch(got.url).then((r) => {
        if (!r.ok) throw new Error(`${r.status} for image`);
        return r.arrayBuffer();
      });
      const buf = Buffer.from(bin);
      // Sanity check: any real image ≥ 5 KB; smaller is likely an error page.
      if (buf.length < 5120) throw new Error(`file too small (${buf.length} B)`);
      writeFileSync(outFile, buf);
      credits[`${name}.jpg`] = `${got.license} | ${got.author} | ${got.page}`;
      downloaded += 1;
      console.log(`✓ ${name}.jpg  (${(buf.length / 1024).toFixed(0)} KB, ${got.license}) — ${got.title}`);
    } catch (e) {
      failed += 1;
      console.log(`✗ ${name}.jpg — download failed: ${e.message}`);
    }
    await sleep(1200); // Commons etiquette — keep well under the rate limit.
  }

  if (!dry && Object.keys(credits).length > 0) {
    const lines = [
      "# Photo credits (public/photos)",
      "",
      "Real photos fetched from Wikimedia Commons for the demo dataset.",
      "Each row: file — license | author | source page. The generated demo",
      "illustrations (SVG) are project-original and need no attribution.",
      "",
      "| File | License | Author | Source |",
      "|---|---|---|---|",
      ...Object.entries(credits)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([f, rest]) => `| \`${f}\` | ${rest} |`),
      "",
    ];
    writeFileSync(creditsPath, lines.join("\n"), "utf8");

    // Register the real photos in the manifest, ahead of the SVG
    // illustrations, so FoodPhoto resolves them first.
    const manifestPath = join(outDir, "photos.json");
    let manifest = [];
    if (existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      } catch {
        /* corrupted manifest — rebuild from credits + nothing else */
      }
    }
    const real = Object.keys(credits).filter((f) => f.endsWith(".jpg"));
    // Real photos lead the manifest (they win over illustrations), then the
    // remaining illustration entries, deduped.
    const merged = [...real, ...manifest.filter((f) => !real.includes(f))];
    writeFileSync(manifestPath, JSON.stringify(merged, null, 2) + "\n", "utf8");
    console.log(`\nManifest: ${merged.length} entries (${real.length} real photos first).`);
  }
  console.log(`\nDone: ${downloaded} downloaded, ${failed} failed, ${Object.keys(credits).length} credited.`);
}

main();
