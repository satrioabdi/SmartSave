/** Date, status and formatting helpers shared across pages. */

import type {
  DonationStatus,
  FoodStatus,
  RequestStatus,
  Role,
} from "./types";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string, now = new Date()): string {
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

export function hoursUntil(iso: string, now = new Date()): number {
  return (new Date(iso).getTime() - now.getTime()) / 3600000;
}

export function isExpired(iso: string, now = new Date()): boolean {
  return new Date(iso).getTime() <= now.getTime();
}

/** Requirement §10/§11 — reminder window: two hours before expiry. */
export function isExpiringSoon(iso: string, now = new Date()): boolean {
  const h = hoursUntil(iso, now);
  return h > 0 && h <= 2;
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
  now = new Date(),
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
    case "Completed":
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
