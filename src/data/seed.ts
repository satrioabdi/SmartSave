/**
 * Demo dataset for the prototype. All values are illustrative and are marked
 * as demo data in the UI where they could be mistaken for live measurement.
 */
import { resolveFactor, resolveShelfLife } from "./catalog";
import { SEED_COMPARTMENTS } from "./compartments";
import { addDays, wallTimeToIso } from "../lib/format";
import type {
  Account,
  ActivityLog,
  CarbonImpactEvent,
  Donation,
  FoodItem,
  GcRequest,
  NotificationEvent,
} from "../lib/types";

const NOW = Date.now();
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();
const HOUR = 3600000;
const DAY = 24 * HOUR;

/** Default demo zone (KST) used to anchor the requested expiry simulation. */
const DEMO_ZONE = "Asia/Seoul";

/**
 * Wall-clock expiry in the demo zone. The reviewer asked for food expiring on
 * given dates and hours (KST), so the dataset anchors those examples to the
 * wall clock of Asia/Seoul rather than to page-load time.
 */
const atZone = (
  y: number,
  monthIndex: number,
  d: number,
  h: number,
  min = 0,
) => wallTimeToIso(y, monthIndex, d, h, min, DEMO_ZONE);

/** Calendar dates used by the requested simulation (October–November 2026). */
const SIM_Y = 2026;

export const ACCOUNTS: Account[] = [
  {
    id: "u-1",
    name: "Nadia Prameswari",
    email: "nadia@smartsave.demo",
    role: "User",
    createdAt: iso(-90 * DAY),
  },
  {
    id: "u-2",
    name: "Bagas Wicaksono",
    email: "bagas@smartsave.demo",
    role: "Manager",
    organization: "SmartSave Operations",
    createdAt: iso(-160 * DAY),
  },
  {
    id: "u-3",
    name: "Rumah Pangan Hijau",
    email: "green@smartsave.demo",
    role: "Green Community",
    organization: "Green Community Surabaya",
    address: "Jl. Raya Keputih No. 45, Sukolilo, Surabaya, Jawa Timur 60111",
    createdAt: iso(-64 * DAY),
  },
  {
    id: "u-4",
    name: "Sinta Larasati",
    email: "sinta@smartsave.demo",
    role: "User",
    createdAt: iso(-41 * DAY),
  },
  {
    id: "u-5",
    name: "Yoga Pratama",
    email: "yoga@smartsave.demo",
    role: "User",
    createdAt: iso(-19 * DAY),
  },
];

interface SeedFood {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  subtype?: string;
  massG: number;
  storedAt: string;
  status: FoodItem["status"];
  owner: string;
  ownerLabel: string;
  photoLabel: string;
  freshness: FoodItem["freshness"];
  /** Demo mass-verification state (Manager ACC workflow). */
  verified?: "Approved" | "Pending" | "Edited";
  /** Present when the Manager edited the declared mass. */
  editedToG?: number;
  /**
   * Demo only: pin expiry relative to page load instead of storedAt + shelf
   * rule, so the Expiry Notifications page always has a live example inside
   * the 2-hour reminder window (§10/§11). storedAt stays consistent with the
   * shelf-life rule (storedAt + shelf.days = expiresAt).
   */
  expiresInMs?: number;
  /**
   * Demo only: pin expiry to an absolute instant (wall clock in the demo
   * zone) — used by the requested date-based simulation records below.
   */
  expiresAtIso?: string;
}

const SEED: SeedFood[] = [
  // Expiry in 90 minutes → inside the 2-hour reminder window at page load.
  { id: "FD-1042", name: "Banana batch A", category: "Fruit", subcategory: "Banana", massG: 2000, storedAt: iso(-30 * HOUR), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "banana-batch-a.jpg", freshness: "fit", verified: "Approved", expiresInMs: 90 * 60000 },
  { id: "FD-1043", name: "Tomato crate", category: "Vegetables", subcategory: "Tomato", massG: 1500, storedAt: iso(-52 * HOUR), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "tomato-crate.jpg", freshness: "fit" },
  // Expired 30 minutes ago → demonstrates the "no response" follow-up branch.
  { id: "FD-1044", name: "Cooked rice trays", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Rice", massG: 3200, storedAt: iso(-5 * HOUR), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "rice-trays.jpg", freshness: "fit", verified: "Pending", expiresInMs: -30 * 60000 },
  { id: "FD-1045", name: "Beef trimmings", category: "Prepared and Cooked Food", subcategory: "Protein", subtype: "Beef", massG: 900, storedAt: iso(-40 * HOUR), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "beef-trimmings.jpg", freshness: "fit", verified: "Approved" },
  { id: "FD-1046", name: "Orange carton", category: "Fruit", subcategory: "Citrus Fruit", massG: 4400, storedAt: iso(-96 * HOUR), status: "Expired", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "orange-carton.jpg", freshness: "fit" },
  { id: "FD-1047", name: "Cow's milk pouches", category: "Beverages", subcategory: "Cow's Milk", massG: 2500, storedAt: iso(-16 * HOUR), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "milk-pouches.jpg", freshness: "fit" },
  { id: "FD-1048", name: "Spice blend jars", category: "Spices", subcategory: "Spices", massG: 600, storedAt: iso(-10 * DAY), status: "Stored", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "spice-jars.jpg", freshness: "fit" },
  { id: "FD-1049", name: "Sourdough loaves", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Wheat and Rye", massG: 1800, storedAt: iso(-64 * HOUR), status: "Collected", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "sourdough.jpg", freshness: "fit", verified: "Edited", editedToG: 1750 },
  { id: "FD-1050", name: "Leafy greens crate", category: "Vegetables", subcategory: "Cabbage and Similar", massG: 2700, storedAt: iso(-70 * HOUR), status: "Available for Donation", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "greens-crate.jpg", freshness: "fit", verified: "Pending" },
  { id: "FD-1051", name: "Apple box", category: "Fruit", subcategory: "Apple", massG: 5200, storedAt: iso(-8 * DAY), status: "Donated", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "apple-box.jpg", freshness: "fit", verified: "Approved" },
  { id: "FD-1052", name: "Tofu trays", category: "Prepared and Cooked Food", subcategory: "Protein", subtype: "Tofu/Processed Soy", massG: 1400, storedAt: iso(-46 * HOUR), status: "Expired", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "tofu-trays.jpg", freshness: "fit" },
  { id: "FD-1053", name: "Banana box B", category: "Fruit", subcategory: "Banana", massG: 3000, storedAt: iso(-6 * HOUR), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "banana-box-b.jpg", freshness: "fit", verified: "Pending" },
  { id: "FD-1054", name: "Palm oil drums", category: "Palm Oil", subcategory: "Palm Oil", massG: 6000, storedAt: iso(-3 * DAY), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "palm-oil.jpg", freshness: "fit" },
  { id: "FD-1055", name: "Roasted coffee beans", category: "Black Coffee Beans", subcategory: "Roasted Coffee Beans", massG: 750, storedAt: iso(-20 * DAY), status: "Stored", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "coffee-beans.jpg", freshness: "fit", verified: "Pending" },
  { id: "FD-1056", name: "Cassava roots", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Cassava", massG: 2100, storedAt: iso(-90 * HOUR), status: "Available for Donation", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "cassava.jpg", freshness: "fit", verified: "Edited", editedToG: 1950 },
  { id: "FD-1057", name: "Dark chocolate slabs", category: "Dark Chocolate", subcategory: "Dark Chocolate / Cocoa-based", massG: 480, storedAt: iso(-30 * DAY), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "dark-chocolate.jpg", freshness: "fit" },
  { id: "FD-1058", name: "Egg trays", category: "Prepared and Cooked Food", subcategory: "Protein", subtype: "Eggs", massG: 1200, storedAt: iso(-4 * HOUR), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "egg-trays.jpg", freshness: "fit", verified: "Pending" },
  { id: "FD-1059", name: "Other tubers basket", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Other Tubers", massG: 1600, storedAt: iso(-48 * HOUR), status: "Stored", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "tubers.jpg", freshness: "fit", verified: "Pending" },
  // Explicit demo examples for white rice, beef, and apples (FD-1044/1045/1051
  // are the earlier English-labeled equivalents). All three belong to Nadia so
  // the per-user filter demo shows them in one place.
  { id: "FD-1060", name: "White rice", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Rice", massG: 2500, storedAt: iso(-3 * HOUR), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "white-rice.jpg", freshness: "fit", verified: "Pending" },
  { id: "FD-1061", name: "Fresh beef", category: "Prepared and Cooked Food", subcategory: "Protein", subtype: "Beef", massG: 1500, storedAt: iso(-20 * HOUR), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "fresh-beef.jpg", freshness: "fit", verified: "Pending" },
  { id: "FD-1062", name: "Red apples", category: "Fruit", subcategory: "Apple", massG: 3600, storedAt: iso(-2 * DAY), status: "Available for Donation", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "red-apples.jpg", freshness: "fit", verified: "Approved" },
  { id: "FD-1063", name: "Mixed rice meal tray", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Mixed dish", massG: 1800, storedAt: iso(-26 * HOUR), status: "Collected", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "rice-trays.jpg", freshness: "fit", verified: "Approved" },
  // Expired more than one day ago → demonstrates the hand-over branch: the
  // record sits in the Manager's waste-bank list and is no longer
  // collectible or donatable by its owner.
  { id: "FD-1064", name: "Water spinach bundle", category: "Vegetables", subcategory: "Cabbage and Similar", massG: 2300, storedAt: iso(-7 * DAY), status: "Expired", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "water-spinach.jpg", freshness: "fit" },

  /* ----------------------- Expiry simulation (KST) ----------------------
   * Requested demo dataset: food expiring on fixed calendar dates and hours
   * in Korea Standard Time, covering 27–30 Oct, 1–7 Nov, 8 Nov hour by hour
   * (08:00–19:00), and 9–10 Nov 2026. Each record's storedAt keeps the
   * storedAt + shelf-rule = expiresAt invariant so labels stay consistent.
   * --------------------------------------------------------------------- */

  // 27–30 October 2026 — already expired, handed over to the waste bank.
  { id: "FD-1070", name: "Pumpkin box", category: "Vegetables", subcategory: "Root Vegetables", massG: 3100, storedAt: atZone(SIM_Y, 9, 22, 9), status: "Expired", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "pumpkin-box.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 9, 27, 8) },
  { id: "FD-1071", name: "Spinach bags", category: "Vegetables", subcategory: "Cabbage and Similar", massG: 1800, storedAt: atZone(SIM_Y, 9, 22, 10), status: "Expired", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "spinach-bags.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 9, 27, 14) },
  { id: "FD-1072", name: "Steamed buns", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Wheat and Rye", massG: 2400, storedAt: atZone(SIM_Y, 9, 24, 9), status: "Expired", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "steamed-buns.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 9, 28, 9) },
  { id: "FD-1073", name: "Grapes punnet", category: "Fruit", subcategory: "Berries and Grapes", massG: 1400, storedAt: atZone(SIM_Y, 9, 23, 11), status: "Expired", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "grapes-punnet.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 9, 28, 11) },
  { id: "FD-1074", name: "Corn cobs", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Corn/Maize", massG: 2600, storedAt: atZone(SIM_Y, 9, 25, 8), status: "Expired", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "corn-cobs.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 9, 29, 8) },
  { id: "FD-1075", name: "Soy milk bottles", category: "Beverages", subcategory: "Soy Milk", massG: 2900, storedAt: atZone(SIM_Y, 9, 26, 10), status: "Expired", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "soy-milk.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 9, 29, 10) },
  { id: "FD-1076", name: "Tangerine crate", category: "Fruit", subcategory: "Citrus Fruit", massG: 4200, storedAt: atZone(SIM_Y, 9, 25, 9), status: "Expired", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "tangerine-crate.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 9, 30, 9) },
  { id: "FD-1077", name: "Boiled potatoes", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Potatoes", massG: 3300, storedAt: atZone(SIM_Y, 9, 25, 13), status: "Expired", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "boiled-potatoes.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 9, 30, 13) },

  // 1–7 November 2026 — spans past (1–6 Nov, expired) to the demo "today"
  // (7 Nov): some hours already behind, one inside the grace/reminder windows.
  { id: "FD-1080", name: "Oatmeal packs", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Oats", massG: 1500, storedAt: atZone(SIM_Y, 9, 29, 9), status: "Expired", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "oatmeal-packs.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 1, 8) },
  { id: "FD-1081", name: "Strawberry trays", category: "Fruit", subcategory: "Berries and Grapes", massG: 1700, storedAt: atZone(SIM_Y, 9, 29, 13), status: "Expired", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "strawberry-trays.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 1, 13) },
  { id: "FD-1082", name: "Cabbage heads", category: "Vegetables", subcategory: "Cabbage and Similar", massG: 3600, storedAt: atZone(SIM_Y, 9, 30, 9), status: "Expired", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "cabbage-heads.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 2, 8) },
  { id: "FD-1083", name: "Grilled chicken", category: "Prepared and Cooked Food", subcategory: "Protein", subtype: "Poultry", massG: 2800, storedAt: atZone(SIM_Y, 9, 30, 12), status: "Expired", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "grilled-chicken.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 2, 12) },
  { id: "FD-1084", name: "Mandarin baskets", category: "Fruit", subcategory: "Citrus Fruit", massG: 3900, storedAt: atZone(SIM_Y, 10, 1, 9), status: "Expired", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "mandarin-baskets.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 3, 9) },
  { id: "FD-1085", name: "Cooked pasta", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Wheat and Rye", massG: 2200, storedAt: atZone(SIM_Y, 10, 1, 10), status: "Expired", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "cooked-pasta.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 3, 10) },
  { id: "FD-1086", name: "Carrot sacks", category: "Vegetables", subcategory: "Root Vegetables", massG: 3400, storedAt: atZone(SIM_Y, 10, 2, 9), status: "Expired", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "carrot-sacks.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 4, 9) },
  { id: "FD-1087", name: "Farmed fish fillets", category: "Prepared and Cooked Food", subcategory: "Protein", subtype: "Farmed Fish", massG: 1900, storedAt: atZone(SIM_Y, 10, 2, 11), status: "Expired", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "fish-fillets.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 4, 11) },
  { id: "FD-1088", name: "Onion nets", category: "Onions and Related Items", subcategory: "Onion and Leek", massG: 4700, storedAt: atZone(SIM_Y, 10, 3, 9), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "onion-nets.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 5, 8) },
  { id: "FD-1089", name: "Tofu blocks", category: "Prepared and Cooked Food", subcategory: "Protein", subtype: "Tofu/Processed Soy", massG: 1600, storedAt: atZone(SIM_Y, 10, 3, 12), status: "Expired", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "tofu-blocks.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 5, 12) },
  { id: "FD-1090", name: "Pear boxes", category: "Fruit", subcategory: "Other Fruit", massG: 4100, storedAt: atZone(SIM_Y, 10, 4, 9), status: "Stored", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "pear-boxes.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 6, 8) },
  { id: "FD-1091", name: "Bread rolls", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Wheat and Rye", massG: 2100, storedAt: atZone(SIM_Y, 10, 4, 10), status: "Expired", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "bread-rolls.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 6, 10) },
  { id: "FD-1092", name: "Kimchi jars", category: "Vegetables", subcategory: "Other Vegetables", massG: 2500, storedAt: atZone(SIM_Y, 10, 5, 9), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "kimchi-jars.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 7, 9) },
  // 7 Nov — the requested vantage day: expired this morning (handover demo),
  // inside the grace window (collect/donate still open), inside the 2-hour
  // reminder window, and surplus still donateable.
  { id: "FD-1093", name: "Morning rice boxes", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Rice", massG: 2700, storedAt: atZone(SIM_Y, 10, 4, 9), status: "Expired", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "morning-rice.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 7, 6) },
  { id: "FD-1094", name: "Vegetable soup pots", category: "Prepared and Cooked Food", subcategory: "Mixed dish", subtype: "Mixed dish", massG: 3000, storedAt: atZone(SIM_Y, 10, 4, 10), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "veg-soup.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 7, 7, 30) },
  { id: "FD-1095", name: "Fresh apple crates", category: "Fruit", subcategory: "Apple", massG: 5200, storedAt: atZone(SIM_Y, 10, 2, 9), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "apple-crates.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 7, 9, 45) },
  { id: "FD-1096", name: "Milk cartons batch", category: "Beverages", subcategory: "Cow's Milk", massG: 3800, storedAt: atZone(SIM_Y, 10, 4, 8), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "milk-cartons.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 7, 13) },
  { id: "FD-1097", name: "Egg cartons demo", category: "Prepared and Cooked Food", subcategory: "Protein", subtype: "Eggs", massG: 2200, storedAt: atZone(SIM_Y, 10, 2, 9), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "egg-cartons.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 7, 18) },

  // 8 November 2026, hour by hour 08:00–19:00 KST — the requested hourly
  // ladder; each hour one record expires.
  { id: "FD-1100", name: "Rice porridge pots 08", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Rice", massG: 2800, storedAt: atZone(SIM_Y, 10, 5, 8), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "rice-porridge.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 8) },
  { id: "FD-1101", name: "Soybean soup 09", category: "Prepared and Cooked Food", subcategory: "Mixed dish", subtype: "Mixed dish", massG: 2400, storedAt: atZone(SIM_Y, 10, 5, 9), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "soybean-soup.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 9) },
  { id: "FD-1102", name: "Banana bundles 10", category: "Fruit", subcategory: "Banana", massG: 3300, storedAt: atZone(SIM_Y, 10, 3, 10), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "banana-bundles.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 10) },
  { id: "FD-1103", name: "Steamed eggs 11", category: "Prepared and Cooked Food", subcategory: "Protein", subtype: "Eggs", massG: 1700, storedAt: atZone(SIM_Y, 10, 5, 11), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "steamed-eggs.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 11) },
  { id: "FD-1104", name: "Lunch meal trays 12", category: "Prepared and Cooked Food", subcategory: "Mixed dish", subtype: "Mixed dish", massG: 4100, storedAt: atZone(SIM_Y, 10, 5, 12), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "lunch-trays.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 12) },
  { id: "FD-1105", name: "Wheat noodles 13", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Wheat and Rye", massG: 2600, storedAt: atZone(SIM_Y, 10, 5, 13), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "wheat-noodles.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 13) },
  { id: "FD-1106", name: "Spinach packs 14", category: "Vegetables", subcategory: "Cabbage and Similar", massG: 2000, storedAt: atZone(SIM_Y, 10, 3, 14), status: "Stored", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "spinach-packs.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 14) },
  { id: "FD-1107", name: "Casserole trays 15", category: "Prepared and Cooked Food", subcategory: "Mixed dish", subtype: "Mixed dish", massG: 3600, storedAt: atZone(SIM_Y, 10, 5, 15), status: "Stored", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "casserole.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 15) },
  { id: "FD-1108", name: "Tofu packs 16", category: "Prepared and Cooked Food", subcategory: "Protein", subtype: "Tofu/Processed Soy", massG: 1900, storedAt: atZone(SIM_Y, 10, 5, 16), status: "Stored", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "tofu-packs.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 16) },
  { id: "FD-1109", name: "Melon crates 17", category: "Fruit", subcategory: "Other Fruit", massG: 4400, storedAt: atZone(SIM_Y, 10, 3, 17), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "melon-crates.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 17) },
  { id: "FD-1110", name: "Fish soup 18", category: "Prepared and Cooked Food", subcategory: "Mixed dish", subtype: "Mixed dish", massG: 3100, storedAt: atZone(SIM_Y, 10, 5, 18), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "fish-soup.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 18) },
  { id: "FD-1111", name: "Night rice rolls 19", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Rice", massG: 2300, storedAt: atZone(SIM_Y, 10, 5, 19), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "rice-rolls.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 8, 19) },

  // 9–10 November 2026 — the far end of the requested window: surplus food
  // approaching expiry, still donateable.
  { id: "FD-1112", name: "Fresh radish crates", category: "Vegetables", subcategory: "Root Vegetables", massG: 3700, storedAt: atZone(SIM_Y, 10, 5, 9), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "radish-crates.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 9, 8) },
  { id: "FD-1113", name: "Cooked barley 09", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Oats", massG: 2500, storedAt: atZone(SIM_Y, 10, 6, 9), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "cooked-barley.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 9, 9) },
  { id: "FD-1114", name: "Orange sacks 10", category: "Fruit", subcategory: "Citrus Fruit", massG: 4300, storedAt: atZone(SIM_Y, 10, 4, 10), status: "Stored", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "orange-sacks.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 9, 10) },
  { id: "FD-1115", name: "Tofu soup 11", category: "Prepared and Cooked Food", subcategory: "Mixed dish", subtype: "Mixed dish", massG: 2900, storedAt: atZone(SIM_Y, 10, 6, 11), status: "Stored", owner: "u-5", ownerLabel: "Yoga Pratama", photoLabel: "tofu-soup.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 9, 11) },
  { id: "FD-1116", name: "Cabbage crates 12", category: "Vegetables", subcategory: "Cabbage and Similar", massG: 3800, storedAt: atZone(SIM_Y, 10, 4, 12), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "cabbage-crates.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 9, 12) },
  { id: "FD-1117", name: "Rice cake packs 13", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Rice", massG: 2700, storedAt: atZone(SIM_Y, 10, 6, 13), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "rice-cakes.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 9, 13) },
  { id: "FD-1118", name: "Apple juice bottles", category: "Beverages", subcategory: "Other Beverages", massG: 4600, storedAt: atZone(SIM_Y, 10, 6, 14), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "apple-juice.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 10, 8) },
  { id: "FD-1119", name: "Mixed vegetables 09", category: "Vegetables", subcategory: "Other Vegetables", massG: 3200, storedAt: atZone(SIM_Y, 10, 5, 9), status: "Stored", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "mixed-veg.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 10, 9) },
  { id: "FD-1120", name: "Sweet potato boxes", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Potatoes", massG: 4900, storedAt: atZone(SIM_Y, 10, 5, 10), status: "Stored", owner: "u-4", ownerLabel: "Sinta Larasati", photoLabel: "sweet-potato.jpg", freshness: "fit", expiresAtIso: atZone(SIM_Y, 10, 10, 10) },
];

function buildFood(): FoodItem[] {
  // Demo locker assignment. A record occupies a compartment when its status
  // still sits in the locker, matching occupiesCapacity(). Packing prefers
  // Available compartments, then the one with the most free space, so no seed
  // record starts a compartment over its capacity.
  const free = new Map(SEED_COMPARTMENTS.map((c) => [c.id, c.capacityG]));
  const lockerFor = (s: SeedFood): { compartmentId?: string; compartmentLabel?: string } => {
    const holding = ["Stored", "Available for Donation", "Expired"].includes(s.status);
    if (!holding) return {};
    // Only genuinely usable compartments — a record never starts out in a
    // Maintenance or Offline locker (those stay empty as negative examples).
    const candidates = SEED_COMPARTMENTS.filter(
      (c) =>
        c.status === "Available" &&
        c.category === s.category &&
        free.get(c.id)! >= s.massG,
    );
    if (candidates.length === 0) return {};
    candidates.sort((a, b) => {
      const aAvail = a.status === "Available" ? 0 : 1;
      const bAvail = b.status === "Available" ? 0 : 1;
      if (aAvail !== bAvail) return aAvail - bAvail;
      return free.get(b.id)! - free.get(a.id)!;
    });
    const comp = candidates[0];
    free.set(comp.id, free.get(comp.id)! - s.massG);
    return { compartmentId: comp.id, compartmentLabel: `${comp.hub} / ${comp.id}` };
  };

  return SEED.map((s) => {
    const shelf = resolveShelfLife(s.category, s.subcategory, s.subtype);
    const factor = resolveFactor(s.category, s.subcategory, s.subtype);
    // Absolute expiry (date-based simulation): keep storedAt consistent with
    // the shelf rule so storedAt + shelf.days still equals expiresAt.
    const storedAt =
      s.expiresAtIso !== undefined
        ? new Date(new Date(s.expiresAtIso).getTime() - shelf.days * DAY).toISOString()
        : s.expiresInMs === undefined
          ? s.storedAt
          : iso(s.expiresInMs - shelf.days * DAY);
    const expiresAt =
      s.expiresAtIso !== undefined
        ? s.expiresAtIso
        : s.expiresInMs === undefined
          ? addDays(s.storedAt, shelf.days)
          : iso(s.expiresInMs);
    // Mass-verification demo state. Records without `verified` predate the
    // workflow: they keep the declared mass and show as Approved (legacy).
    const verification: FoodItem["massVerification"] =
      s.verified === "Pending"
        ? {
            status: "Pending",
            declaredG: s.massG,
            confirmedG: null,
            reviewedBy: null,
            reviewedAt: null,
          }
        : s.verified === "Edited"
          ? {
              status: "Edited",
              declaredG: s.massG,
              confirmedG: s.editedToG ?? s.massG,
              reviewedBy: "Bagas Wicaksono",
              reviewedAt: iso(-1 * DAY),
              note: "Mass corrected against the scale photo at Manager review.",
            }
          : {
              status: "Approved",
              declaredG: s.massG,
              confirmedG: s.massG,
              reviewedBy: "Bagas Wicaksono",
              reviewedAt: iso(-1 * DAY),
            };
    return {
      id: s.id,
      barcode: `SS-${s.id.replace("FD-", "")}`,
      name: s.name,
      category: s.category,
      subcategory: s.subcategory,
      subtype: s.subtype,
      massG: verification.status === "Edited" ? (s.editedToG ?? s.massG) : s.massG,
      storedAt,
      expiresAt,
      status: s.status,
      ...lockerFor(s),
      ownerUserId: s.owner,
      ownerLabel: s.ownerLabel,
      photoLabel: s.photoLabel,
      freshness: s.freshness,
      massVerification: verification,
      ruleSnapshot: { shelfLifeDays: shelf.days, ruleLabel: shelf.ruleLabel },
      factorSnapshot: {
        sourceLabel: factor.factor?.sourceLabel ?? "—",
        factorP90: factor.factor?.factorP90 ?? null,
        unit: factor.factor?.unit ?? null,
        factorState: factor.state,
        methodologyVersion: factor.factor?.methodologyVersion ?? "—",
        effectiveDate: factor.factor?.effectiveDate ?? "—",
      },
    };
  });
}

export const SEED_FOOD: FoodItem[] = buildFood();

export const SEED_DONATIONS: Donation[] = [
  {
    id: "DN-201",
    foodIds: ["FD-1051"],
    label: "Apple box",
    massG: 5200,
    status: "Completed",
    createdBy: "Sinta Larasati",
    createdAt: iso(-8 * DAY),
    allocatedTo: "Rumah Pangan Hijau",
    completedAt: iso(-7 * DAY),
    note: "Surplus from morning delivery.",
  },
  {
    id: "DN-202",
    foodIds: ["FD-1050"],
    label: "Leafy greens crate",
    massG: 2700,
    status: "Pending",
    createdBy: "Yoga Pratama",
    createdAt: iso(-40 * HOUR),
    note: "Offered before the expiry window closes.",
  },
  {
    id: "DN-203",
    foodIds: ["FD-1056"],
    label: "Cassava roots",
    massG: 2100,
    status: "Pending",
    createdBy: "Nadia Prameswari",
    createdAt: iso(-20 * HOUR),
  },
  {
    id: "DN-204",
    foodIds: ["FD-1052"],
    label: "Tofu trays",
    massG: 1400,
    status: "Cancelled",
    createdBy: "Yoga Pratama",
    createdAt: iso(-2 * DAY),
    note: "Item expired before a requester was assigned.",
  },
  // Nov-7 simulation: donations the reviewer asked to see from the 7 Nov
  // vantage point — surplus food still donateable (Fresh apple crates inside
  // the 2-hour reminder window) and expired food waste (Morning rice boxes,
  // handed over to the Manager's waste bank).
  {
    id: "DN-205",
    foodIds: ["FD-1095"],
    label: "Fresh apple crates",
    massG: 5200,
    status: "Pending",
    createdBy: "Nadia Prameswari",
    createdAt: atZone(SIM_Y, 10, 7, 8),
    note: "Surplus apples — expires this morning, donate before the window closes.",
  },
  {
    id: "DN-206",
    foodIds: ["FD-1094"],
    label: "Vegetable soup pots",
    massG: 3000,
    status: "Pending",
    createdBy: "Nadia Prameswari",
    createdAt: atZone(SIM_Y, 10, 7, 8, 30),
    note: "Cooked this morning; offered inside the grace window.",
  },
  {
    id: "DN-207",
    foodIds: ["FD-1093"],
    label: "Morning rice boxes",
    massG: 2700,
    status: "Pending",
    createdBy: "Nadia Prameswari",
    createdAt: atZone(SIM_Y, 10, 7, 6, 30),
    note: "Expired food waste — managed at the waste bank, delivery by email.",
  },
  // Nov-8 simulation: one record that has NOT expired yet is donated and
  // requested by the Green Community (a live Pending pair the reviewer can
  // walk through Manager approval → handover), while another not-yet-expired
  // record is donated but left unrequested — open for anyone to claim.
  {
    id: "DN-208",
    foodIds: ["FD-1100"],
    label: "Rice porridge pots 08",
    massG: 2800,
    status: "Pending",
    createdBy: "Nadia Prameswari",
    createdAt: atZone(SIM_Y, 10, 7, 8, 30),
    note: "Surplus before tomorrow's 08:00 expiry — requested by the Green Community.",
  },
  {
    id: "DN-209",
    foodIds: ["FD-1101"],
    label: "Soybean soup 09",
    massG: 2400,
    status: "Pending",
    createdBy: "Nadia Prameswari",
    createdAt: atZone(SIM_Y, 10, 7, 9, 30),
    note: "Offered before the 09:00 expiry — no request yet, still open.",
  },
];

export const SEED_REQUESTS: GcRequest[] = [
  {
    id: "RQ-301",
    donationId: "DN-201",
    label: "Apple box",
    massG: 5200,
    // Manager recorded the handover — the mass was distributed to the
    // requester, so the request closes as Distributed.
    status: "Distributed",
    submittedBy: "Rumah Pangan Hijau",
    submittedAt: iso(-7.5 * DAY),
    decidedAt: iso(-7 * DAY),
    contactEmail: "green@smartsave.demo",
    contactAddress: "Jl. Raya Keputih No. 45, Sukolilo, Surabaya, Jawa Timur 60111",
    // The pickup barcode the Manager issued at approval — the requester
    // collected the Apple box with it; the record's original barcode (SS-1051)
    // was deactivated at that moment.
    pickupBarcode: {
      code: "SS-PK-2301",
      issuedAt: iso(-7 * DAY),
      replaces: ["SS-1051"],
    },
  },
  {
    id: "RQ-302",
    donationId: "DN-202",
    label: "Leafy greens crate",
    massG: 2700,
    status: "Pending",
    submittedBy: "Rumah Pangan Hijau",
    submittedAt: iso(-30 * HOUR),
    contactEmail: "green@smartsave.demo",
    contactAddress: "Jl. Raya Keputih No. 45, Sukolilo, Surabaya, Jawa Timur 60111",
  },
  {
    id: "RQ-303",
    donationId: "DN-204",
    label: "Tofu trays",
    massG: 1400,
    status: "Rejected",
    submittedBy: "Rumah Pangan Hijau",
    submittedAt: iso(-1.8 * DAY),
    decidedAt: iso(-1.5 * DAY),
    reason: "Donation was cancelled by the donor before allocation.",
    contactEmail: "green@smartsave.demo",
    contactAddress: "Jl. Raya Keputih No. 45, Sukolilo, Surabaya, Jawa Timur 60111",
  },
  // Nov-7 simulation: a pending request from the Green Community for the
  // surplus apple crates, so the Manager's review queue has a live example
  // from the requested vantage point.
  {
    id: "RQ-304",
    donationId: "DN-205",
    label: "Fresh apple crates",
    massG: 5200,
    status: "Pending",
    submittedBy: "Rumah Pangan Hijau",
    submittedAt: atZone(SIM_Y, 10, 7, 9),
    contactEmail: "green@smartsave.demo",
    contactAddress: "Jl. Raya Keputih No. 45, Sukolilo, Surabaya, Jawa Timur 60111",
  },
  // Nov-8 simulation: the Green Community already requested the not-yet-expired
  // rice porridge (DN-208) — the Manager can approve and record the handover
  // from this state. The unrequested soybean soup (DN-209) stays without a
  // request on purpose (case c).
  {
    id: "RQ-305",
    donationId: "DN-208",
    label: "Rice porridge pots 08",
    massG: 2800,
    status: "Pending",
    submittedBy: "Rumah Pangan Hijau",
    submittedAt: atZone(SIM_Y, 10, 7, 10),
    contactEmail: "green@smartsave.demo",
    contactAddress: "Jl. Raya Keputih No. 45, Sukolilo, Surabaya, Jawa Timur 60111",
  },
];

/**
 * Qualified impact events (§18). claimKey guarantees a mass/lot is claimed
 * once per outcome type — status changes never re-count the same mass.
 */
export const SEED_EVENTS: CarbonImpactEvent[] = [
  {
    id: "CIE-01",
    claimKey: "FD-1049:Collected",
    type: "Collected",
    foodId: "FD-1049",
    label: "Sourdough loaves",
    massG: 1800,
    factorP90: 2.3,
    unit: "kg CO₂e/kg food",
    co2eKg: 4.14,
    factorState: { kind: "valid" },
    occurredAt: iso(-2.5 * DAY),
    methodologyVersion: "WRI-ID-2018 p10–12 / p90",
    sourceLabel: "Gandum dan rye (wheat and rye; unit sumber: 1 kg roti dari gandum dengan protein bervariasi)",
  },
  {
    id: "CIE-02",
    claimKey: "FD-1051:Distributed",
    type: "Distributed",
    foodId: "FD-1051",
    label: "Apple box",
    massG: 5200,
    factorP90: 0.6,
    unit: "kg CO₂e/kg food",
    co2eKg: 3.12,
    factorState: { kind: "valid" },
    occurredAt: iso(-7 * DAY),
    methodologyVersion: "WRI-ID-2018 p10–12 / p90",
    sourceLabel: "Apel",
  },
  {
    id: "CIE-03",
    claimKey: "FD-1045:Collected",
    type: "Collected",
    foodId: "FD-1045",
    label: "Beef trimmings",
    massG: 900,
    factorP90: 209.9,
    unit: "kg CO₂e/kg food",
    co2eKg: 188.91,
    factorState: { kind: "valid" },
    occurredAt: iso(-14 * HOUR),
    methodologyVersion: "WRI-ID-2018 p10–12 / p90",
    sourceLabel: "Daging sapi",
  },
  {
    id: "CIE-04",
    claimKey: "FD-1046:Collected",
    type: "Collected",
    foodId: "FD-1046",
    label: "Orange carton",
    massG: 4400,
    factorP90: 0.6,
    unit: "kg CO₂e/kg food",
    co2eKg: 2.64,
    factorState: { kind: "valid" },
    occurredAt: iso(-3 * HOUR),
    methodologyVersion: "WRI-ID-2018 p10–12 / p90",
    sourceLabel: "Buah sitrus/jeruk",
  },
  {
    id: "CIE-05",
    claimKey: "FD-1047:Collected",
    type: "Collected",
    foodId: "FD-1047",
    label: "Cow's milk pouches",
    massG: 2500,
    factorP90: 4.8,
    unit: "kg CO₂e/liter",
    // 2.5 kg ÷ 1.03 kg/L ≈ 2.427 L × 4.8 = 11.65 kg CO₂e (demo density).
    co2eKg: 11.65,
    factorState: { kind: "valid" },
    occurredAt: iso(-6 * HOUR),
    methodologyVersion: "WRI-ID-2018 p10–12 / p90",
    sourceLabel: "Susu sapi pasteurisasi (unit sumber: 1 liter; demo density 1.03 kg/L)",
  },
];

export const SEED_NOTIFICATIONS: NotificationEvent[] = [
  {
    id: "NT-01",
    kind: "reminder-2h",
    title: "Expiry reminder — Tomato crate",
    body: "FD-1043 expires within two hours. Donate or collect it to keep the record active.",
    foodId: "FD-1043",
    createdAt: iso(-1.4 * HOUR),
    read: false,
    delivery: "Delivered",
  },
  {
    id: "NT-02",
    kind: "reminder-2h",
    title: "Expiry reminder — Beef trimmings",
    body: "FD-1045 expires within two hours. Donate or collect it to keep the record active.",
    foodId: "FD-1045",
    createdAt: iso(-1.7 * HOUR),
    read: false,
    delivery: "Delivered",
  },
  {
    id: "NT-03",
    kind: "expired-followup",
    title: "Follow-up needed — Orange carton",
    body: "FD-1046 expired more than one hour ago with no response. Manager follow-up is required.",
    foodId: "FD-1046",
    createdAt: iso(-2.2 * HOUR),
    read: true,
    delivery: "Delivered",
  },
  {
    id: "NT-06",
    kind: "expired-followup",
    title: "Handed over to the Manager — Water spinach bundle",
    body: "FD-1064 expired more than one day ago with no response. The record has been handed over to the Manager and is stored at the waste bank.",
    foodId: "FD-1064",
    createdAt: iso(-6 * DAY),
    read: true,
    delivery: "Delivered",
  },
  {
    id: "NT-04",
    kind: "system",
    title: "Shelf-life rule updated",
    body: "Manager changed the demo shelf-life rule for Vegetables. Historical records keep their snapshot.",
    createdAt: iso(-30 * HOUR),
    read: true,
    delivery: "Delivered",
  },
  {
    id: "NT-05",
    kind: "system",
    title: "Scheduler delivery failed",
    body: "One notification batch could not be written by the demo scheduler log.",
    createdAt: iso(-2 * DAY),
    read: true,
    delivery: "Failed",
  },
];

export const SEED_LOGS: ActivityLog[] = [
  { id: "AL-01", at: iso(-2.5 * DAY), actor: "Nadia Prameswari", action: "Collected food", target: "FD-1049", detail: "Massa 1,800 g recorded; consumption assumed, not proven." },
  { id: "AL-02", at: iso(-7 * DAY), actor: "Bagas Wicaksono", action: "Distributed donation", target: "DN-201", detail: "5,200 g delivered to Rumah Pangan Hijau; request RQ-301 set to Distributed." },
  { id: "AL-03", at: iso(-7 * DAY), actor: "Bagas Wicaksono", action: "Approved request", target: "RQ-301", detail: "Allocation confirmed for Green Community." },
  { id: "AL-04", at: iso(-30 * HOUR), actor: "Bagas Wicaksono", action: "Changed shelf-life rule", target: "Vegetables", detail: "Demo rule remains 5 days; snapshot preserved on historical rows." },
  { id: "AL-05", at: iso(-1.5 * DAY), actor: "Bagas Wicaksono", action: "Rejected request", target: "RQ-303", detail: "Donation was cancelled before allocation." },
  { id: "AL-06", at: iso(-20 * HOUR), actor: "Nadia Prameswari", action: "Created donation", target: "DN-203", detail: "Cassava roots 2,100 g offered to Green Community." },
  { id: "AL-07", at: iso(-4 * HOUR), actor: "system", action: "Notification delivered", target: "NT-01", detail: "Website notification only; no external channel." },
  { id: "AL-08", at: iso(-3 * HOUR), actor: "Sinta Larasati", action: "Collected food", target: "FD-1046", detail: "Massa 4,400 g recorded." },
  { id: "AL-09", at: iso(-6 * DAY), actor: "Bagas Wicaksono", action: "Handed over to waste bank", target: "FD-1064", detail: "Expired more than one day without a response — 2,300 g recorded into the Manager's waste-bank list; no impact event." },
];
