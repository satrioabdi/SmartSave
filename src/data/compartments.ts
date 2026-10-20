/**
 * Virtual locker compartments (prototype extension from the .make flow).
 *
 * These are simulated website data. There is no physical locker, no sensor
 * and no IoT hardware (§14) — capacity and temperature values exist only to
 * drive the deposit-selection rules in the Register Food wizard.
 */
import type { FoodItem, VirtualCompartment } from "../lib/types";

export const HUB_LABEL = "RH-01";

/**
 * Statuses that still occupy compartment capacity. A collected or donated
 * record no longer sits in the locker, so its mass is released.
 */
const OCCUPYING: FoodItem["status"][] = [
  "Stored",
  "Available for Donation",
  "Expired",
];

export function occupiesCapacity(status: FoodItem["status"]): boolean {
  return OCCUPYING.includes(status);
}

/** Total grams currently held in a compartment. */
export function compartmentOccupancy(
  food: FoodItem[],
  compartmentId: string,
): number {
  return food
    .filter((f) => f.compartmentId === compartmentId && occupiesCapacity(f.status))
    .reduce((sum, f) => sum + f.massG, 0);
}

/** Records currently assigned to a compartment, for the Manager view. */
export function compartmentOccupants(
  food: FoodItem[],
  compartmentId: string,
): FoodItem[] {
  return food.filter(
    (f) => f.compartmentId === compartmentId && occupiesCapacity(f.status),
  );
}

/** Grams still free in a compartment (never negative). */
export function remainingCapacity(
  food: FoodItem[],
  compartment: VirtualCompartment,
): number {
  return Math.max(
    0,
    compartment.capacityG - compartmentOccupancy(food, compartment.id),
  );
}

/** Full label printed on the deposit label and shown in the inventory. */
export function compartmentLabel(c: VirtualCompartment): string {
  return `${c.hub} / ${c.id}`;
}

/**
 * Why a compartment cannot be chosen for a given category/mass, or null when
 * it is usable. Mirrors the .make StepOne availability rules.
 */
export function compartmentBlockReason(
  c: VirtualCompartment,
  food: FoodItem[],
  category: string | null,
  massG: number,
): string | null {
  if (c.status === "Maintenance") return "Maintenance";
  if (c.status === "Offline") return "Offline";
  if (category && c.category !== category) return "Incompatible category";
  const free = c.capacityG - compartmentOccupancy(food, c.id);
  if (massG > 0 && free < massG) return "Insufficient capacity";
  return null;
}

/**
 * Seed compartments. Categories are top-level §3 categories so a compartment
 * accepts one category family. Every §3 category is provisioned with a pair
 * of compartments ("category ganda"), so each category is always available
 * for deposit. Exactly two compartments are inactive — C-02 (Maintenance) and
 * E-02 (Offline) — as deliberate negative examples; both sit in categories
 * whose twin compartment stays Available. Capacities keep headroom over the
 * demo dataset so the Register Food wizard's happy path always finds a free
 * compartment.
 */
export const SEED_COMPARTMENTS: VirtualCompartment[] = [
  // Fruit — A pair
  { id: "A-01", hub: HUB_LABEL, category: "Fruit", capacityG: 10000, temperatureC: 4.1, status: "Available" },
  { id: "A-02", hub: HUB_LABEL, category: "Fruit", capacityG: 10000, temperatureC: 4.0, status: "Available" },
  // Vegetables — B pair
  { id: "B-01", hub: HUB_LABEL, category: "Vegetables", capacityG: 6000, temperatureC: 4.2, status: "Available" },
  { id: "B-02", hub: HUB_LABEL, category: "Vegetables", capacityG: 6000, temperatureC: 4.0, status: "Available" },
  // Prepared and Cooked Food — C pair (C-02 in Maintenance, C-01 stays open)
  { id: "C-01", hub: HUB_LABEL, category: "Prepared and Cooked Food", capacityG: 20000, temperatureC: 3.5, status: "Available" },
  { id: "C-02", hub: HUB_LABEL, category: "Prepared and Cooked Food", capacityG: 10000, temperatureC: 3.5, status: "Maintenance" },
  // Beverages — D pair
  { id: "D-01", hub: HUB_LABEL, category: "Beverages", capacityG: 6000, temperatureC: 4.0, status: "Available" },
  { id: "D-02", hub: HUB_LABEL, category: "Beverages", capacityG: 6000, temperatureC: 4.0, status: "Available" },
  // Dark Chocolate — E pair (E-02 Offline, E-01 stays open)
  { id: "E-01", hub: HUB_LABEL, category: "Dark Chocolate", capacityG: 3000, temperatureC: null, status: "Available" },
  { id: "E-02", hub: HUB_LABEL, category: "Dark Chocolate", capacityG: 3000, temperatureC: null, status: "Offline" },
  // Black Coffee Beans — F pair (ambient)
  { id: "F-01", hub: HUB_LABEL, category: "Black Coffee Beans", capacityG: 4000, temperatureC: null, status: "Available" },
  { id: "F-02", hub: HUB_LABEL, category: "Black Coffee Beans", capacityG: 4000, temperatureC: null, status: "Available" },
  // Cane Sugar — G pair (ambient)
  { id: "G-01", hub: HUB_LABEL, category: "Cane Sugar", capacityG: 5000, temperatureC: null, status: "Available" },
  { id: "G-02", hub: HUB_LABEL, category: "Cane Sugar", capacityG: 5000, temperatureC: null, status: "Available" },
  // Beet Sugar — H pair (ambient)
  { id: "H-01", hub: HUB_LABEL, category: "Beet Sugar", capacityG: 5000, temperatureC: null, status: "Available" },
  { id: "H-02", hub: HUB_LABEL, category: "Beet Sugar", capacityG: 5000, temperatureC: null, status: "Available" },
  // Palm Oil — I pair (ambient)
  { id: "I-01", hub: HUB_LABEL, category: "Palm Oil", capacityG: 10000, temperatureC: null, status: "Available" },
  { id: "I-02", hub: HUB_LABEL, category: "Palm Oil", capacityG: 10000, temperatureC: null, status: "Available" },
  // Soybean Oil — J pair (ambient)
  { id: "J-01", hub: HUB_LABEL, category: "Soybean Oil", capacityG: 10000, temperatureC: null, status: "Available" },
  { id: "J-02", hub: HUB_LABEL, category: "Soybean Oil", capacityG: 10000, temperatureC: null, status: "Available" },
  // Olive Oil — K pair (ambient)
  { id: "K-01", hub: HUB_LABEL, category: "Olive Oil", capacityG: 10000, temperatureC: null, status: "Available" },
  { id: "K-02", hub: HUB_LABEL, category: "Olive Oil", capacityG: 10000, temperatureC: null, status: "Available" },
  // Canola and Sunflower Oil — L pair (ambient)
  { id: "L-01", hub: HUB_LABEL, category: "Canola and Sunflower Oil", capacityG: 10000, temperatureC: null, status: "Available" },
  { id: "L-02", hub: HUB_LABEL, category: "Canola and Sunflower Oil", capacityG: 10000, temperatureC: null, status: "Available" },
  // Spices — M pair (ambient)
  { id: "M-01", hub: HUB_LABEL, category: "Spices", capacityG: 3000, temperatureC: null, status: "Available" },
  { id: "M-02", hub: HUB_LABEL, category: "Spices", capacityG: 3000, temperatureC: null, status: "Available" },
  // Onions and Related Items — N pair (ambient)
  { id: "N-01", hub: HUB_LABEL, category: "Onions and Related Items", capacityG: 6000, temperatureC: null, status: "Available" },
  { id: "N-02", hub: HUB_LABEL, category: "Onions and Related Items", capacityG: 6000, temperatureC: null, status: "Available" },
];
