/**
 * CO₂e calculation helpers.
 * Formula (§7 / §19.2): Estimated CO₂e (kg) = (Food Mass (g) ÷ 1000) × Emission Factor
 * Only qualified events (§18) produce an impact; registration alone does not.
 */
import { resolveFactor, type FactorResolution } from "../data/catalog";
import type { CarbonValue, FactorState, Period } from "./types";

export const FORMULA_TEXT = "(Food Mass (g) ÷ 1000) × Emission Factor";

export const ANALYTICS_NOTE =
  "Estimate based on the configured emission factor; not a direct measurement. Liter-based source factors are converted with a demo density before applying.";

export const CONSUMPTION_NOTE =
  "Food taken by a User is assumed to be consumed; this is not proof of actual consumption.";

/** Mass in grams → kilograms, 2 decimals for display. */
export function gramsToKg(g: number): number {
  return g / 1000;
}

export function formatMass(g: number): string {
  return `${g.toLocaleString("en-US")} g`;
}

export function formatKg(g: number): string {
  return `${gramsToKg(g).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kg`;
}

/** CO₂e always two decimals with explicit unit (style.md §5.4). */
export function formatCo2e(kg: number): string {
  return `${kg.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kg CO₂e`;
}

export function formatFactor(n: number): string {
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} kg CO₂e/kg`;
}

/**
 * Compute the CO₂e value for a mass given a factor resolution.
 * Returns a CarbonValue — never a bare zero for unusable factors.
 *
 * A liter-based factor with a demo density conversion computes as
 * kg-equivalent: mass kg × density gives liters, then × factor per liter.
 */
export function computeCarbon(
  massG: number,
  resolution: FactorResolution,
): CarbonValue {
  if (resolution.state.kind === "valid" && resolution.factor) {
    const kg = gramsToKg(massG);
    const density = resolution.densityKgPerLiter;
    const liters = density ? kg / density : null;
    const value =
      liters !== null
        ? liters * resolution.factor.factorP90
        : kg * resolution.factor.factorP90;
    return { kind: "value", kg: round2(value) };
  }
  if (resolution.state.kind === "unit-mismatch") {
    return { kind: "unable" };
  }
  return { kind: "not-configured" };
}

export function carbonLabel(v: CarbonValue): string {
  if (v.kind === "value") return formatCo2e(v.kg);
  if (v.kind === "unable") return "Unable to calculate";
  return "Emission factor not configured";
}

export function carbonBadgeVariant(
  v: CarbonValue,
): "success" | "warning" | "info" {
  if (v.kind === "value") return "success";
  return "warning";
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function factorStateLabel(state: FactorState): string {
  if (state.kind === "valid") return "Configured";
  if (state.kind === "unit-mismatch") return "Unable to calculate";
  return "Emission factor not configured";
}

export function resolveForItem(
  category: string,
  subcategory: string,
  subtype?: string,
): FactorResolution {
  return resolveFactor(category, subcategory, subtype);
}

/* ------------------------------------------------------------------ *
 * Period filtering (§8) — cards, tables, charts and CSV share it.
 * ------------------------------------------------------------------ */

export function periodStart(period: Period, now = new Date()): Date {
  const d = new Date(now);
  if (period === "Daily") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "Monthly") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(d.getFullYear(), 0, 1);
}

export function inPeriod(iso: string, period: Period, now = new Date()): boolean {
  return new Date(iso).getTime() >= periodStart(period, now).getTime();
}

export function periodLabel(period: Period, now = new Date()): string {
  const opts: Intl.DateTimeFormatOptions =
    period === "Daily"
      ? { month: "short", day: "numeric", year: "numeric" }
      : period === "Monthly"
        ? { month: "long", year: "numeric" }
        : { year: "numeric" };
  if (period === "Daily") return `Today, ${new Date(now).toLocaleDateString("en-GB", opts)}`;
  return new Date(now).toLocaleDateString("en-GB", opts);
}

/**
 * Bucket labels for the mini chart — 7 buckets ending now.
 * Daily → last 7 days; Monthly → last 7 months; Yearly → last 7 years.
 */
export function chartBuckets(period: Period, now = new Date()): {
  label: string;
  start: Date;
  end: Date;
}[] {
  const out: { label: string; start: Date; end: Date }[] = [];
  if (period === "Daily") {
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      out.push({
        label: start.toLocaleDateString("en-GB", { weekday: "short" }),
        start,
        end,
      });
    }
  } else if (period === "Monthly") {
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      out.push({
        label: start.toLocaleDateString("en-GB", { month: "short" }),
        start,
        end,
      });
    }
  } else {
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now.getFullYear() - i, 0, 1);
      const end = new Date(now.getFullYear() - i + 1, 0, 1);
      out.push({ label: String(start.getFullYear()), start, end });
    }
  }
  return out;
}

export function bucketValue(
  iso: string,
  bucket: { start: Date; end: Date },
): boolean {
  const t = new Date(iso).getTime();
  return t >= bucket.start.getTime() && t < bucket.end.getTime();
}
