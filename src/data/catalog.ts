/**
 * Catalog: food categories, demo shelf-life rules and WRI emission factors.
 * Single source of truth = requirement §3 (taxonomy + shelf-life) and §19 (factors).
 */
import type { EmissionFactor, FactorState, FoodCategory } from "../lib/types";

const WRI_URL =
  "https://wri-indonesia.org/sites/default/files/180821_Perhitungan_Emisi_Makanan.pdf";

const SOURCE = "WRI Indonesia — Perhitungan Emisi Makanan";

export const METHODOLOGY = {
  source: SOURCE,
  url: WRI_URL,
  version: "WRI-ID-2018 p10–12 / p90",
  effectiveDate: "2018-08-21",
};

/* ------------------------------------------------------------------ *
 * §3 — Food Category / Food Subcategory / demo shelf-life rule
 * ------------------------------------------------------------------ */

export const CATEGORIES: FoodCategory[] = [
  {
    id: "fruit",
    name: "Fruit",
    subcategories: ["Berries and Grapes", "Banana", "Apple", "Citrus Fruit", "Other Fruit"],
    shelfLifeDays: 5,
    shelfLifeNote: "5 days",
    factorNote: "Use matching WRI row only",
  },
  {
    id: "vegetables",
    name: "Vegetables",
    subcategories: ["Tomato", "Cabbage and Similar", "Root Vegetables", "Other Vegetables"],
    shelfLifeDays: 5,
    shelfLifeNote: "5 days",
    factorNote: "Use matching WRI row only",
  },
  {
    id: "beverages",
    name: "Beverages",
    subcategories: ["Cow's Milk", "Soy Milk", "Other Beverages"],
    shelfLifeDays: 3,
    shelfLifeNote: "3 days after opened",
    factorNote: "Validate source and unit; no unsupported factor",
  },
  {
    id: "prepared",
    name: "Prepared and Cooked Food",
    subcategories: ["Protein", "Carbohydrate"],
    dependentSubtypes: {
      Protein: [
        "Peas",
        "Other Pulses",
        "Groundnuts",
        "Tofu/Processed Soy",
        "Cheese",
        "Eggs",
        "Poultry",
        "Pork",
        "Lamb and Mutton",
        "Beef",
        "Farmed Fish",
        "Farmed Crustaceans",
        "Mixed dish",
      ],
      Carbohydrate: [
        "Wheat and Rye",
        "Corn/Maize",
        "Rice",
        "Oats",
        "Potatoes",
        "Cassava",
        "Other Tubers",
        "Mixed dish",
      ],
    },
    shelfLifeDays: 3,
    shelfLifeNote: "3 days",
    shelfLifeOverrides: [
      { match: "Beef", days: 2, note: "2 days — raw meat, poultry, fish" },
      { match: "Pork", days: 2, note: "2 days — raw meat, poultry, fish" },
      { match: "Lamb and Mutton", days: 2, note: "2 days — raw meat, poultry, fish" },
      { match: "Poultry", days: 2, note: "2 days — raw meat, poultry, fish" },
      { match: "Farmed Fish", days: 2, note: "2 days — raw meat, poultry, fish" },
      { match: "Farmed Crustaceans", days: 2, note: "2 days — raw meat, poultry, fish" },
      { match: "Peas", days: 3, note: "3 days — pulses and plant products" },
      { match: "Other Pulses", days: 3, note: "3 days — pulses and plant products" },
      { match: "Groundnuts", days: 3, note: "3 days — pulses and plant products" },
      { match: "Tofu/Processed Soy", days: 3, note: "3 days — pulses and plant products" },
      { match: "Eggs", days: 5, note: "5 days — eggs and cheese" },
      { match: "Cheese", days: 5, note: "5 days — eggs and cheese" },
      { match: "Wheat and Rye", days: 3, note: "3 days — cooked meal" },
      { match: "Corn/Maize", days: 3, note: "3 days — cooked meal" },
      { match: "Rice", days: 3, note: "3 days — cooked meal" },
      { match: "Oats", days: 3, note: "3 days — cooked meal" },
      { match: "Potatoes", days: 5, note: "5 days — raw tuber" },
      { match: "Cassava", days: 5, note: "5 days — raw tuber" },
      { match: "Other Tubers", days: 5, note: "5 days — raw tuber" },
      { match: "Mixed dish", days: 3, note: "3 days — cooked meal" },
    ],
    factorNote:
      "Dependent subtype; mixed dishes need approved ingredient/recipe calculation",
  },
  {
    id: "dark-chocolate",
    name: "Dark Chocolate",
    subcategories: ["Dark Chocolate / Cocoa-based"],
    shelfLifeDays: 180,
    shelfLifeNote: "180 days",
    factorNote:
      "Source range includes negative lower bound; review methodology before operational use",
  },
  {
    id: "coffee",
    name: "Black Coffee Beans",
    subcategories: ["Roasted Coffee Beans"],
    shelfLifeDays: 180,
    shelfLifeNote: "180 days",
    factorNote: "Use source unit and product definition carefully",
  },
  {
    id: "cane-sugar",
    name: "Cane Sugar",
    subcategories: ["Cane Sugar"],
    shelfLifeDays: 365,
    shelfLifeNote: "365 days",
    factorNote: "Use matching WRI row only",
  },
  {
    id: "beet-sugar",
    name: "Beet Sugar",
    subcategories: ["Beet Sugar"],
    shelfLifeDays: 365,
    shelfLifeNote: "365 days",
    factorNote: "Use matching WRI row only",
  },
  {
    id: "palm-oil",
    name: "Palm Oil",
    subcategories: ["Palm Oil"],
    shelfLifeDays: 180,
    shelfLifeNote: "180 days",
    factorNote:
      "Source functional unit is volume-based; do not apply to kg without approved conversion",
  },
  {
    id: "soybean-oil",
    name: "Soybean Oil",
    subcategories: ["Soybean Oil"],
    shelfLifeDays: 180,
    shelfLifeNote: "180 days",
    factorNote:
      "Source functional unit is volume-based; do not apply to kg without approved conversion",
  },
  {
    id: "olive-oil",
    name: "Olive Oil",
    subcategories: ["Olive Oil"],
    shelfLifeDays: 180,
    shelfLifeNote: "180 days",
    factorNote:
      "Source functional unit is volume-based; do not apply to kg without approved conversion",
  },
  {
    id: "canola-sunflower-oil",
    name: "Canola and Sunflower Oil",
    subcategories: ["Rapeseed/Canola Oil", "Sunflower Oil"],
    shelfLifeDays: 180,
    shelfLifeNote: "180 days",
    factorNote:
      "Source functional unit is volume-based; do not apply to kg without approved conversion",
  },
  {
    id: "spices",
    name: "Spices",
    subcategories: ["Spices"],
    shelfLifeDays: 180,
    shelfLifeNote: "180 days",
    factorNote: "Emission factor not configured unless matching WRI row is verified",
  },
  {
    id: "onions",
    name: "Onions and Related Items",
    subcategories: ["Onion and Leek"],
    shelfLifeDays: 14,
    shelfLifeNote: "14 days",
    factorNote: "Use matching WRI row only; application category remains distinct",
  },
];

/* ------------------------------------------------------------------ *
 * §19 — WRI emission factor table (percentile 5–95 range, p90 factor)
 * ------------------------------------------------------------------ */

type FactorSeed = [
  /** app mapping */ string,
  /** source label */ string,
  /** category */ string,
  /** rangeLow */ number,
  /** rangeHigh */ number,
  /** p90 */ number,
  /** unit */ "kg CO₂e/kg food" | "kg CO₂e/liter",
  /** verification */ "verified" | "pending-source-check",
  /** note? */ string?,
];

const FACTOR_SEEDS: FactorSeed[] = [
  ["Wheat and Rye", "Gandum dan rye (wheat and rye; unit sumber: 1 kg roti dari gandum dengan protein bervariasi)", "Karbohidrat / Starch-rich food", 0.7, 3.1, 2.3, "kg CO₂e/kg food", "pending-source-check"],
  ["Corn/Maize", "Jagung (maize; unit sumber: 1 kg meal untuk polenta)", "Karbohidrat / Starch-rich food", 0.7, 3.5, 2.3, "kg CO₂e/kg food", "pending-source-check"],
  ["Oats", "Oats (rolled oats)", "Karbohidrat / Starch-rich food", 0.8, 4.3, 4.1, "kg CO₂e/kg food", "pending-source-check"],
  ["Rice", "Beras (beras putih/cokelat utuh)", "Karbohidrat / Starch-rich food", 1.2, 10.3, 8.8, "kg CO₂e/kg food", "pending-source-check"],
  ["Potatoes", "Kentang (umbi bersih dari tanah)", "Karbohidrat / Starch-rich food", 0.1, 0.7, 0.6, "kg CO₂e/kg food", "pending-source-check"],
  ["Cassava", "Singkong / cassava (umbi bersih dari tanah)", "Karbohidrat / Starch-rich food", 0.3, 2.2, 2.1, "kg CO₂e/kg food", "pending-source-check"],
  ["Peas", "Kacang polong (peas)", "Protein-rich food", 0.5, 1.9, 1.7, "kg CO₂e/kg food", "verified"],
  ["Other Pulses", "Kacang-kacangan lainnya (other pulses)", "Protein-rich food", 0.9, 4.0, 3.8, "kg CO₂e/kg food", "verified"],
  ["Groundnuts", "Kacang tanah (groundnuts)", "Protein-rich food", 1.4, 6.2, 5.8, "kg CO₂e/kg food", "verified"],
  ["Tofu/Processed Soy", "Tahu / olahan kedelai (tofu)", "Protein-rich food", 1.4, 7.3, 5.6, "kg CO₂e/kg food", "verified"],
  ["Cheese", "Keju", "Protein-rich food", 10.2, 58.8, 39.3, "kg CO₂e/kg food", "verified"],
  ["Eggs", "Telur", "Protein-rich food", 2.9, 8.5, 8.4, "kg CO₂e/kg food", "verified"],
  ["Poultry", "Daging unggas", "Protein-rich food", 4.0, 20.8, 20.1, "kg CO₂e/kg food", "verified"],
  ["Pork", "Daging babi", "Protein-rich food", 6.9, 23.8, 22.3, "kg CO₂e/kg food", "verified"],
  ["Lamb and Mutton", "Domba/kambing", "Protein-rich food", 23.7, 60.2, 54.4, "kg CO₂e/kg food", "verified"],
  ["Beef", "Daging sapi", "Protein-rich food", 37.6, 269.2, 209.9, "kg CO₂e/kg food", "verified"],
  ["Farmed Fish", "Ikan budidaya", "Protein-rich food", 5.4, 32.6, 26.5, "kg CO₂e/kg food", "verified"],
  ["Farmed Crustaceans", "Krustasea budidaya", "Protein-rich food", 7.4, 115.1, 52.1, "kg CO₂e/kg food", "verified"],
  ["Berries and Grapes", "Buah beri dan anggur", "Buah dan sayur", 0.6, 2.9, 2.7, "kg CO₂e/kg food", "verified"],
  ["Banana", "Pisang", "Buah dan sayur", 0.6, 1.3, 1.2, "kg CO₂e/kg food", "verified"],
  ["Apple", "Apel", "Buah dan sayur", 0.3, 0.6, 0.6, "kg CO₂e/kg food", "verified"],
  ["Citrus Fruit", "Buah sitrus/jeruk", "Buah dan sayur", 0.0, 0.7, 0.6, "kg CO₂e/kg food", "verified"],
  ["Tomato", "Tomat", "Buah dan sayur", 0.4, 12.6, 6.0, "kg CO₂e/kg food", "verified"],
  ["Cabbage and Similar", "Kubis dan sejenisnya", "Buah dan sayur", 0.2, 1.2, 1.0, "kg CO₂e/kg food", "verified"],
  ["Onion and Leek", "Bawang dan daun bawang/leek", "Buah dan sayur", 0.3, 0.8, 0.8, "kg CO₂e/kg food", "verified"],
  ["Root Vegetables", "Sayuran umbi-umbian", "Buah dan sayur", 0.2, 0.6, 0.6, "kg CO₂e/kg food", "verified"],
  ["Other Fruit", "Buah lainnya", "Buah dan sayur", 0.3, 3.0, 2.9, "kg CO₂e/kg food", "verified"],
  ["Barley Beer", "Bir berbahan barley (unit sumber: 1 liter)", "Minuman", 0.6, 1.8, 1.6, "kg CO₂e/liter", "verified"],
  ["Grape Wine", "Anggur/wine dari buah anggur (unit sumber: 1 liter)", "Minuman", 0.7, 4.7, 2.7, "kg CO₂e/liter", "verified"],
  ["Cow's Milk", "Susu sapi pasteurisasi (unit sumber: 1 liter)", "Minuman", 1.5, 7.0, 4.8, "kg CO₂e/liter", "verified"],
  ["Soy Milk", "Susu kedelai (unit sumber: 1 liter)", "Minuman", 0.5, 1.7, 1.5, "kg CO₂e/liter", "verified"],
  ["Palm Oil", "Minyak kelapa sawit (unit sumber: 1 liter minyak)", "Oil crops", 2.8, 13.1, 12.0, "kg CO₂e/liter", "verified"],
  ["Soybean Oil", "Minyak kedelai (unit sumber: 1 liter minyak)", "Oil crops", 2.2, 18.8, 13.4, "kg CO₂e/liter", "verified"],
  ["Olive Oil", "Minyak zaitun (unit sumber: 1 liter minyak)", "Oil crops", 2.1, 10.8, 7.6, "kg CO₂e/liter", "verified"],
  ["Rapeseed/Canola Oil", "Minyak kanola/rapeseed (unit sumber: 1 liter minyak)", "Oil crops", 2.2, 7.2, 4.6, "kg CO₂e/liter", "verified"],
  ["Sunflower Oil", "Minyak bunga matahari (unit sumber: 1 liter minyak)", "Oil crops", 2.2, 4.9, 4.6, "kg CO₂e/liter", "verified"],
  ["Cane Sugar", "Gula tebu", "Sugar crops", 0.6, 5.6, 5.1, "kg CO₂e/kg food", "verified"],
  ["Beet Sugar", "Gula bit", "Sugar crops", 1.0, 2.6, 2.4, "kg CO₂e/kg food", "verified"],
  [
    "Dark Chocolate / Cocoa-based",
    "Coklat hitam (unit sumber: 1 kg dark chocolate)",
    "Other",
    -4.0,
    257.5,
    134.7,
    "kg CO₂e/kg food",
    "verified",
    "Range includes a negative lower bound — methodology review required before operational reporting (§19.2).",
  ],
  ["Roasted Coffee Beans", "Kopi bubuk/biji sangrai (unit sumber: 1 kg roasted beans)", "Other", 4.4, 85.7, 84.9, "kg CO₂e/kg food", "verified"],
  [
    "Mixed dish",
    "Mixed dish — Klimato benchmark (assumed buffet format, maximum EF estimation; klimato.com/klimato-insights/food-emissions-benchmarks-by-sector)",
    "Mixed dishes (benchmark)",
    3.0,
    3.0,
    3.0,
    "kg CO₂e/kg food",
    "pending-source-check",
    "Benchmark of 3.0 kg CO₂e per cover (buffet format, maximum EF estimation) applied per kilogram of food as a demo simplification — an approved ingredient/recipe calculation should replace it for operational reporting.",
  ],
];

export const FACTORS: EmissionFactor[] = FACTOR_SEEDS.map((s, i) => ({
  id: `ef-${i + 1}`,
  appMapping: s[0],
  sourceLabel: s[1],
  category: s[2],
  rangeLow: s[3],
  rangeHigh: s[4],
  factorP90: s[5],
  unit: s[6],
  verification: s[7],
  note: s[8],
  effectiveDate: METHODOLOGY.effectiveDate,
  methodologyVersion: METHODOLOGY.version,
  sourceUrl: WRI_URL,
}));

const FACTOR_BY_MAPPING = new Map(FACTORS.map((f) => [f.appMapping, f]));

/**
 * Subcategories with no matching WRI source row (§19.4).
 * Must render "Emission factor not configured" — never a zero.
 */
const UNMAPPED_SUBCATEGORIES = new Set([
  "Other Vegetables",
  "Other Beverages",
  "Spices",
]);

const UNMAPPED_SUBTYPE = "Mixed dish";

export interface FactorResolution {
  state: FactorState;
  factor?: EmissionFactor;
  /** Human-readable reason shown in the calculation detail (§6.2). */
  reason: string;
}

/**
 * Resolve the emission factor for a category/subcategory/subtype.
 * §19.2: a liter-based factor may not be applied to a gram mass without an
 * approved density conversion → `unit-mismatch` → "Unable to calculate".
 *
 * Mixed dish resolves to the Klimato buffet benchmark
 * (3.0 kg CO₂e per cover, maximum EF estimation) applied per kilogram — a
 * demo simplification, flagged pending-source-check.
 */
export function resolveFactor(
  categoryName: string,
  subcategory: string,
  subtype?: string,
): FactorResolution {
  if (subtype === UNMAPPED_SUBTYPE) {
    const benchmark = FACTOR_BY_MAPPING.get(UNMAPPED_SUBTYPE);
    if (benchmark) {
      return {
        state: { kind: "valid" },
        factor: benchmark,
        reason:
          "No approved recipe calculation exists, so the Klimato mixed-dish benchmark applies (assumed buffet format, maximum EF estimation, 3.0 kg CO₂e per cover, applied per kg of food).",
      };
    }
    return {
      state: { kind: "not-configured" },
      reason:
        "Mixed or unclassified dish — no approved ingredient/recipe calculation is configured for this record.",
    };
  }

  const key = subtype ?? subcategory;

  if (key === "Protein" || key === "Carbohydrate") {
    return {
      state: { kind: "not-configured" },
      reason:
        "Mixed or unclassified dish — no approved ingredient/recipe calculation is configured for this record.",
    };
  }

  if (UNMAPPED_SUBCATEGORIES.has(key)) {
    return {
      state: { kind: "not-configured" },
      reason:
        "No matching WRI source row exists for this subcategory yet, so no factor is configured.",
    };
  }

  // Cane/Beet Sugar categories carry the subcategory name equal to the mapping.
  const factor =
    FACTOR_BY_MAPPING.get(key) ??
    FACTOR_BY_MAPPING.get(subcategory) ??
    FACTOR_BY_MAPPING.get(categoryName);

  if (!factor) {
    return {
      state: { kind: "not-configured" },
      reason:
        "This subcategory does not map to a verified WRI row, so no factor is configured.",
    };
  }

  if (factor.unit !== "kg CO₂e/kg food") {
    return {
      state: { kind: "unit-mismatch" },
      factor,
      reason:
        "The source factor is expressed per liter, while food mass is recorded in grams. No approved density conversion is available, so the calculation is held.",
    };
  }

  return {
    state: { kind: "valid" },
    factor,
    reason:
      "The source factor unit matches the recorded mass unit, so the estimate can be calculated.",
  };
}

/* ------------------------------------------------------------------ *
 * §3 / §9 — demo shelf-life rule resolution
 * ------------------------------------------------------------------ */

export interface ShelfLifeResolution {
  days: number;
  ruleLabel: string;
  note?: string;
}

export function resolveShelfLife(
  categoryName: string,
  subcategory?: string,
  subtype?: string,
): ShelfLifeResolution {
  const category = CATEGORIES.find((c) => c.name === categoryName);
  if (!category) {
    return { days: 5, ruleLabel: "5 days (fallback demo rule)" };
  }
  const matchKey = subtype || subcategory;
  const override = category.shelfLifeOverrides?.find((o) => o.match === matchKey);
  if (override) {
    return {
      days: override.days,
      ruleLabel: `${override.days} days`,
      note: override.note,
    };
  }
  return {
    days: category.shelfLifeDays,
    ruleLabel: category.shelfLifeNote ?? `${category.shelfLifeDays} days`,
  };
}

export function getCategory(name: string): FoodCategory | undefined {
  return CATEGORIES.find((c) => c.name === name);
}

export const SHELF_LIFE_DISCLAIMER =
  "Demo shelf-life rules, not real food-safety guidance.";
