/**
 * SmartSave domain types.
 * Source: SMARTSAVE_REQUIREMENT_WEBSITE_REVISI_V1_5_RAPI.docx
 */

export type Role = "User" | "Manager" | "Green Community";

/** Requirement §4 — example food statuses. */
export type FoodStatus =
  | "Stored"
  | "Available for Donation"
  | "Donated"
  | "Collected"
  | "Expired";

/** Requirement §17.1 — donation statuses. */
export type DonationStatus = "Pending" | "Completed" | "Cancelled";

/**
 * Virtual locker compartment state.
 * Derived from the .make prototype's compartment model; Maintenance / Offline
 * are operator-set states (§9 — the compartment cannot accept a deposit).
 */
export type CompartmentStatus = "Available" | "Maintenance" | "Offline";

/**
 * A virtual locker compartment. Capacity is in grams and temperature is
 * illustrative website data only — there is no sensor or IoT hardware (§14).
 */
export interface VirtualCompartment {
  /** Short code, e.g. "A-03". */
  id: string;
  /** Locker hub prefix shown on labels, e.g. "RH-01". */
  hub: string;
  /** Top-level category this compartment accepts. */
  category: string;
  /** Maximum mass that may be stored, in grams. */
  capacityG: number;
  /** Simulated temperature in °C; null when the compartment is unmonitored. */
  temperatureC: number | null;
  status: CompartmentStatus;
}

/** Requirement §10 — Green Community request statuses. */
export type RequestStatus = "Pending" | "Approved" | "Rejected" | "Completed";

export type Period = "Daily" | "Monthly" | "Yearly";

/** Unit of an emission factor as published by the source (§19). */
export type FactorUnit = "kg CO₂e/kg food" | "kg CO₂e/liter";

/**
 * Resolved state of an emission factor for a given subcategory.
 * Requirement §6.2/§7: never render a zero when the factor is unusable.
 */
export type FactorState =
  | { kind: "valid" }
  | { kind: "not-configured" }
  | { kind: "unit-mismatch" };

/** Calculated CO₂e cell value — see style.md §5.4 CarbonValue. */
export type CarbonValue =
  | { kind: "value"; kg: number }
  | { kind: "not-configured" }
  | { kind: "unable" };

export interface EmissionFactor {
  id: string;
  /** Exact WRI source row label. */
  sourceLabel: string;
  /** Application subcategory it maps to (§3 / §19 mapping column). */
  appMapping: string;
  category: string;
  rangeLow: number;
  rangeHigh: number;
  /** 90th percentile — the factor used when unit matches. */
  factorP90: number;
  unit: FactorUnit;
  effectiveDate: string;
  methodologyVersion: string;
  sourceUrl: string;
  note?: string;
  /**
   * §19.3: carbohydrate rows were not found in the readable copy of the
   * source and must be verified before operational use.
   */
  verification: "verified" | "pending-source-check";
}

export interface FoodCategory {
  id: string;
  name: string;
  subcategories: string[];
  /** Dependent subtype options (§3 — Prepared and Cooked Food). */
  dependentSubtypes?: Record<string, string[]>;
  /** Demo shelf-life rule in days for the category (§3). */
  shelfLifeDays: number;
  shelfLifeNote?: string;
  /** Override shelf-life by subcategory/subtype where the table differs. */
  shelfLifeOverrides?: { match: string; days: number; note?: string }[];
  /** Emission-factor mapping note shown in Register Food (§3). */
  factorNote: string;
}

export interface FoodItem {
  id: string;
  barcode: string;
  name: string;
  category: string;
  subcategory: string;
  subtype?: string;
  massG: number;
  storedAt: string;
  expiresAt: string;
  status: FoodStatus;
  /** Virtual locker compartment this record occupies, e.g. "RH-01 / A-03". */
  compartmentLabel?: string;
  /** Short compartment code used for occupancy, e.g. "A-03". */
  compartmentId?: string;
  ownerUserId: string;
  ownerLabel: string;
  photoLabel?: string;
  freshness: "pending" | "fit" | "rejected";
  /** Snapshot of the shelf-life rule applied at registration (§9). */
  ruleSnapshot: { shelfLifeDays: number; ruleLabel: string };
  /** Snapshot of the factor used, kept for historical rows (§7). */
  factorSnapshot: {
    sourceLabel: string;
    factorP90: number | null;
    unit: FactorUnit | null;
    factorState: FactorState;
    methodologyVersion: string;
    effectiveDate: string;
  };
  eventClaimKey?: string;
  notified2h?: boolean;
}

export interface Donation {
  id: string;
  foodIds: string[];
  label: string;
  massG: number;
  status: DonationStatus;
  createdBy: string;
  createdAt: string;
  note?: string;
  allocatedTo?: string;
  completedAt?: string;
}

export interface GcRequest {
  id: string;
  donationId: string;
  label: string;
  massG: number;
  status: RequestStatus;
  submittedBy: string;
  submittedAt: string;
  decidedAt?: string;
  reason?: string;
}

export interface CarbonImpactEvent {
  id: string;
  /** Deduplication marker: one mass/lot claimed once per outcome (§18). */
  claimKey: string;
  type: "Collected" | "DonationCompleted" | "Distributed";
  foodId: string;
  label: string;
  massG: number;
  factorP90: number | null;
  unit: FactorUnit | null;
  co2eKg: number | null;
  factorState: FactorState;
  occurredAt: string;
  methodologyVersion: string;
  sourceLabel: string;
}

export interface NotificationEvent {
  id: string;
  kind: "reminder-2h" | "expired-followup" | "system";
  title: string;
  body: string;
  foodId?: string;
  createdAt: string;
  read: boolean;
  delivery: "Delivered" | "Failed" | "Pending";
}

export interface ActivityLog {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail?: string;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization?: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  name: string;
  role: Role;
}
