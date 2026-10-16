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
 * accepts one category family. Capacities keep headroom over the demo dataset
 * so the Register Food wizard's happy path always has a free compartment —
 * A-01 stays full and E-02 stays Offline as deliberate negative examples.
 */
export const SEED_COMPARTMENTS: VirtualCompartment[] = [
  { id: "A-01", hub: HUB_LABEL, category: "Fruit", capacityG: 5000, temperatureC: 4.1, status: "Available" },
  { id: "A-02", hub: HUB_LABEL, category: "Fruit", capacityG: 8000, temperatureC: 4.0, status: "Available" },
  { id: "B-01", hub: HUB_LABEL, category: "Vegetables", capacityG: 6000, temperatureC: 4.2, status: "Available" },
  { id: "B-02", hub: HUB_LABEL, category: "Vegetables", capacityG: 3000, temperatureC: 4.0, status: "Available" },
  { id: "C-01", hub: HUB_LABEL, category: "Prepared and Cooked Food", capacityG: 10000, temperatureC: 3.5, status: "Available" },
  { id: "C-02", hub: HUB_LABEL, category: "Prepared and Cooked Food", capacityG: 4000, temperatureC: 3.5, status: "Maintenance" },
  { id: "D-01", hub: HUB_LABEL, category: "Beverages", capacityG: 6000, temperatureC: 4.0, status: "Available" },
  { id: "D-02", hub: HUB_LABEL, category: "Spices", capacityG: 3000, temperatureC: null, status: "Available" },
  { id: "E-01", hub: HUB_LABEL, category: "Palm Oil", capacityG: 10000, temperatureC: null, status: "Available" },
  { id: "E-02", hub: HUB_LABEL, category: "Dark Chocolate", capacityG: 3000, temperatureC: null, status: "Offline" },
];
