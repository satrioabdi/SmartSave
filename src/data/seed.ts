/**
 * Demo dataset for the prototype. All values are illustrative and are marked
 * as demo data in the UI where they could be mistaken for live measurement.
 */
import { resolveFactor, resolveShelfLife } from "./catalog";
import { SEED_COMPARTMENTS } from "./compartments";
import { addDays } from "../lib/format";
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
  { id: "FD-1063", name: "Mixed rice meal tray", category: "Prepared and Cooked Food", subcategory: "Carbohydrate", subtype: "Mixed dish (recipe not approved)", massG: 1800, storedAt: iso(-26 * HOUR), status: "Collected", owner: "u-1", ownerLabel: "Nadia Prameswari", photoLabel: "rice-trays.jpg", freshness: "fit", verified: "Approved" },
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
    const candidates = SEED_COMPARTMENTS.filter(
      (c) => c.category === s.category && free.get(c.id)! >= s.massG,
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
    // Pinned expiry (demo example): keep storedAt consistent with the shelf
    // rule so storedAt + shelf.days still equals expiresAt.
    const storedAt =
      s.expiresInMs === undefined
        ? s.storedAt
        : iso(s.expiresInMs - shelf.days * DAY);
    const expiresAt =
      s.expiresInMs === undefined
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
];

export const SEED_REQUESTS: GcRequest[] = [
  {
    id: "RQ-301",
    donationId: "DN-201",
    label: "Apple box",
    massG: 5200,
    status: "Completed",
    submittedBy: "Rumah Pangan Hijau",
    submittedAt: iso(-7.5 * DAY),
    decidedAt: iso(-7 * DAY),
  },
  {
    id: "RQ-302",
    donationId: "DN-202",
    label: "Leafy greens crate",
    massG: 2700,
    status: "Pending",
    submittedBy: "Rumah Pangan Hijau",
    submittedAt: iso(-30 * HOUR),
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
    factorP90: null,
    unit: "kg CO₂e/liter",
    co2eKg: null,
    factorState: { kind: "unit-mismatch" },
    occurredAt: iso(-6 * HOUR),
    methodologyVersion: "WRI-ID-2018 p10–12 / p90",
    sourceLabel: "Susu sapi pasteurisasi (unit sumber: 1 liter)",
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
  { id: "AL-02", at: iso(-7 * DAY), actor: "Bagas Wicaksono", action: "Distributed donation", target: "DN-201", detail: "5,200 g delivered to Rumah Pangan Hijau." },
  { id: "AL-03", at: iso(-7 * DAY), actor: "Bagas Wicaksono", action: "Approved request", target: "RQ-301", detail: "Allocation confirmed for Green Community." },
  { id: "AL-04", at: iso(-30 * HOUR), actor: "Bagas Wicaksono", action: "Changed shelf-life rule", target: "Vegetables", detail: "Demo rule remains 5 days; snapshot preserved on historical rows." },
  { id: "AL-05", at: iso(-1.5 * DAY), actor: "Bagas Wicaksono", action: "Rejected request", target: "RQ-303", detail: "Donation was cancelled before allocation." },
  { id: "AL-06", at: iso(-20 * HOUR), actor: "Nadia Prameswari", action: "Created donation", target: "DN-203", detail: "Cassava roots 2,100 g offered to Green Community." },
  { id: "AL-07", at: iso(-4 * HOUR), actor: "system", action: "Notification delivered", target: "NT-01", detail: "Website notification only; no external channel." },
  { id: "AL-08", at: iso(-3 * HOUR), actor: "Sinta Larasati", action: "Collected food", target: "FD-1046", detail: "Massa 4,400 g recorded." },
];
