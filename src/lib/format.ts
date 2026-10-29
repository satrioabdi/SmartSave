/** Date, status and formatting helpers shared across pages. */

import type {
  DonationStatus,
  FoodStatus,
  RequestStatus,
  Role,
} from "./types";

/**
 * Demo timezone setting (§14: website simulation). All date/time rendering and
 * every "now" comparison flow through the selected zone so the demo can be
 * viewed as if accessed from another country — KST (Asia/Seoul) by default,
 * per the reviewer's request. Times are stored as real UTC instants; only the
 * presentation and day boundaries follow the selected zone.
 */
export interface TimezoneOption {
  /** IANA zone name. */
  zone: string;
  /** Short label, e.g. "KST (Seoul)". */
  label: string;
  /** Country shown in the picker. */
  country: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { zone: "Asia/Seoul", label: "KST — Korea Selatan", country: "South Korea" },
  { zone: "Asia/Jakarta", label: "WIB — Indonesia", country: "Indonesia" },
  { zone: "Asia/Singapore", label: "SGT — Singapura", country: "Singapore" },
  { zone: "Asia/Tokyo", label: "JST — Jepang", country: "Japan" },
  { zone: "Asia/Kuala_Lumpur", label: "MYT — Malaysia", country: "Malaysia" },
  { zone: "Australia/Sydney", label: "AEST — Australia", country: "Australia" },
  { zone: "Europe/London", label: "GMT — Inggris", country: "United Kingdom" },
  { zone: "America/New_York", label: "EST — Amerika Serikat", country: "United States" },
];

export const DEFAULT_TIMEZONE = TIMEZONE_OPTIONS[0].zone;

/**
 * Current time as seen from `zone`, as a plain Date whose local getters
 * (getHours, getDateString, …) read the wall clock of that zone. Passing this
 * Date to toLocaleString with timeZone undefined would show the viewer's own
 * zone — so every display helper below formats with the zone explicitly.
 */
export function nowInZone(zone: string): Date {
  const now = new Date();
  try {
    const wall = now.toLocaleString("en-US", { timeZone: zone });
    return new Date(wall);
  } catch {
    return now;
  }
}

/**
 * Wall-clock parts of an instant as seen from `zone`. Used for day/hour
 * boundaries ("expires 08 AM KST on Nov 8") without manual offsets.
 */
export function partsInZone(
  iso: string,
  zone: string,
): { y: number; m: number; d: number; h: number; min: number } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(iso))) parts[p.type] = p.value;
  const h = parts.hour === "24" ? 0 : Number(parts.hour);
  return {
    y: Number(parts.year),
    m: Number(parts.month),
    d: Number(parts.day),
    h: h % 24,
    min: Number(parts.minute),
  };
}

/* ------------------------- demo simulation clock ------------------------ */

/**
 * Demo date the seed data is anchored to: the reviewer asked for an expiry
 * simulation "on Nov 7" — food already expired, about to expire, and far
 * future — so the dataset can be explored from that vantage point. Null means
 * "use the real clock" (the default; every offset stays relative to load time).
 * Set to an ISO datetime to freeze the clock there (session-only, demo banner
 * marks it as simulation).
 */
export let demoClockIso: string | null = null;

export function setDemoClock(iso: string | null): void {
  demoClockIso = iso;
}

export function demoNow(): Date {
  return demoClockIso ? new Date(demoClockIso) : new Date();
}

/**
 * ISO instant whose wall-clock time in `zone` equals the asked date/hour
 * (e.g. 2026-11-08 08:00 in Asia/Seoul). Iterates in 15-min steps to resolve
 * the offset for that date — DST-safe for every zone in the picker.
 */
export function wallTimeToIso(
  y: number,
  monthIndex: number,
  d: number,
  h: number,
  min = 0,
  zone: string = DEFAULT_TIMEZONE,
): string {
  // Start from UTC midnight of that date minus half a day and search forward
  // in 15-min steps until the wall clock matches.
  const guess = Date.UTC(y, monthIndex, d, 0, 0) - 14 * 3600000;
  const targetMin = h * 60 + min;
  for (let i = 0; i < 4 * 24 * 4 + 8; i++) {
    const t = new Date(guess + i * 15 * 60000).toISOString();
    const p = partsInZone(t, zone);
    const curMin = p.h * 60 + p.min;
    if (p.y === y && p.m === monthIndex + 1 && p.d === d && curMin === targetMin) {
      return t;
    }
  }
  // Fallback: 7h offset (KST) — only reachable with an unsupported zone name.
  return new Date(Date.UTC(y, monthIndex, d, h - 7, min)).toISOString();
}

export function formatDate(iso: string, zone = DEFAULT_TIMEZONE): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: zone,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string, zone = DEFAULT_TIMEZONE): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: zone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string, zone = DEFAULT_TIMEZONE): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string, now = demoNow()): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const suffix = diff < 0 ? "ago" : "from now";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ${suffix}`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ${suffix}`;
  const days = Math.round(hours / 24);
  return `${days} d ${suffix}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function hoursUntil(iso: string, now = demoNow()): number {
  return (new Date(iso).getTime() - now.getTime()) / 3600000;
}

export function isExpired(iso: string, now = demoNow()): boolean {
  return new Date(iso).getTime() <= now.getTime();
}

/** Requirement §10/§11 — reminder window: two hours before expiry. */
export function isExpiringSoon(iso: string, now = demoNow()): boolean {
  const h = hoursUntil(iso, now);
  return h > 0 && h <= 2;
}

/**
 * Owner grace window (§10/§11 demo policy): during the first hour after
 * expiry the food still belongs to the owner's decision — it can be
 * collected or donated without waiting. After that hour the record is
 * handed over to the Manager (waste bank) and both actions close.
 */
export const EXPIRY_GRACE_MS = 60 * 60000;

/** Expired, but less than one hour ago — the owner may still act. */
export function expiredWithinGrace(iso: string, now = demoNow()): boolean {
  const ms = now.getTime() - new Date(iso).getTime();
  return ms > 0 && ms <= EXPIRY_GRACE_MS;
}

/**
 * True while the owner may still act on the record: Stored inside its shelf
 * life, or expired less than one hour ago (the grace window above). Records
 * expired beyond the hour have been handed over to the Manager.
 */
export function ownerActionOpen(
  status: FoodStatus,
  expiresAt: string,
  now = demoNow(),
): boolean {
  if (status !== "Stored" && status !== "Expired") return false;
  if (!isExpired(expiresAt, now)) return status === "Stored";
  return expiredWithinGrace(expiresAt, now);
}

/**
 * Expiry delta for the Green Community flow: already-expired food is food
 * waste, not-yet-expired food is surplus food. The label states how many days
 * past (waste) or before (surplus) the expiry date the record sits.
 */
export function expiryDeltaLabel(
  expiresAt: string,
  now = demoNow(),
): { expired: boolean; label: string } {
  const diff = new Date(expiresAt).getTime() - now.getTime();
  if (diff <= 0) {
    const days = Math.floor(-diff / 86400000);
    return {
      expired: true,
      label: days >= 1 ? `Expired ${days} day${days === 1 ? "" : "s"} ago` : "Expired today",
    };
  }
  const days = Math.ceil(diff / 86400000);
  return {
    expired: false,
    label: `Expires in ${days} day${days === 1 ? "" : "s"}`,
  };
}

/**
 * Flow diagram 12: `Stored --> Expired: Expiry terlewati`.
 * There is no backend scheduler in this prototype, so the transition is
 * derived from the stored expiration datetime instead of being claimed as an
 * automatic background process (diagram 7 forbids that claim).
 */
export function effectiveFoodStatus(
  status: FoodStatus,
  expiresAt: string,
  now = demoNow(),
): FoodStatus {
  if (status === "Stored" && isExpired(expiresAt, now)) return "Expired";
  return status;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/* ---------------- status → badge variant (style.md §2.3) --------------- */

export type BadgeVariant =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "neutral";

export function foodStatusVariant(s: FoodStatus): BadgeVariant {
  switch (s) {
    case "Stored":
      return "success";
    case "Available for Donation":
      return "info";
    case "Expired":
      return "danger";
    default:
      return "neutral";
  }
}

export function donationStatusVariant(s: DonationStatus): BadgeVariant {
  switch (s) {
    case "Completed":
      return "success";
    case "Cancelled":
      return "danger";
    default:
      return "info";
  }
}

export function requestStatusVariant(s: RequestStatus): BadgeVariant {
  switch (s) {
    case "Approved":
    case "Distributed":
      return "success";
    case "Rejected":
      return "danger";
    default:
      return "warning";
  }
}

export function roleVariant(role: Role): BadgeVariant {
  if (role === "Manager") return "info";
  if (role === "Green Community") return "warning";
  return "success";
}

export function roleClass(role: Role): string {
  if (role === "Manager") return "role-chip--manager";
  if (role === "Green Community") return "role-chip--gc";
  return "";
}

export function avatarClass(role: Role): string {
  if (role === "Manager") return "avatar--manager";
  if (role === "Green Community") return "avatar--gc";
  return "";
}

/** CSV export (§8) — same labels and units as the on-screen table. */
export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const body = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
