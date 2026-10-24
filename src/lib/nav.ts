/** Role navigation from requirement §17 sitemap. */
import type { Route } from "../lib/store";
import type { Role } from "../lib/types";
import {
  IconBarcode,
  IconBell,
  IconBox,
  IconCamera,
  IconChart,
  IconClock,
  IconFile,
  IconGift,
  IconHand,
  IconHistory,
  IconLayers,
  IconLeaf,
  IconList,
  IconSettings,
  IconShield,
  IconUser,
  IconUsers,
} from "../components/icons";

export interface NavItem {
  label: string;
  route: Route;
  icon: (p: { className?: string }) => JSX.Element;
}

export interface NavGroup {
  eyebrow: string;
  items: NavItem[];
}

export function navFor(role: Role): NavGroup[] {
  if (role === "Manager") {
    return [
      {
        eyebrow: "Overview",
        items: [
          { label: "Manager Dashboard", route: { name: "manager-dashboard" }, icon: IconChart },
        ],
      },
      {
        eyebrow: "Operations",
        items: [
          { label: "User and Role Management", route: { name: "manager-users" }, icon: IconUsers },
          { label: "Food & Inventory Management", route: { name: "manager-inventory" }, icon: IconBox },
          { label: "Barcode Management", route: { name: "manager-barcodes" }, icon: IconBarcode },
          { label: "Scan Barcode (camera)", route: { name: "scan-barcode" }, icon: IconCamera },
          { label: "Donation Management", route: { name: "manager-donations" }, icon: IconGift },
          { label: "Green Community Requests", route: { name: "manager-requests" }, icon: IconHand },
          { label: "Expiry / Website Notification Monitoring", route: { name: "manager-expiry-monitor" }, icon: IconBell },
        ],
      },
      {
        eyebrow: "Configuration",
        items: [
          { label: "Category & Subcategory Configuration", route: { name: "manager-categories" }, icon: IconLayers },
          { label: "Shelf-Life Rule Configuration", route: { name: "manager-shelf-life" }, icon: IconClock },
          { label: "Emission Factor Configuration", route: { name: "manager-factors" }, icon: IconLeaf },
          { label: "Virtual Locker Management", route: { name: "manager-lockers" }, icon: IconBox },
        ],
      },
      {
        eyebrow: "Reports",
        items: [
          { label: "Activity Logs", route: { name: "activity-logs" }, icon: IconList },
          { label: "Environmental Reports", route: { name: "reports" }, icon: IconFile },
          { label: "Profile / Settings", route: { name: "profile" }, icon: IconSettings },
        ],
      },
    ];
  }

  if (role === "Green Community") {
    return [
      {
        eyebrow: "Overview",
        items: [
          { label: "Green Community Dashboard", route: { name: "gc-dashboard" }, icon: IconChart },
        ],
      },
      {
        eyebrow: "Donations",
        items: [
          {
            label: "Available Food Waste/Surplus Food",
            route: { name: "gc-donations" },
            icon: IconGift,
          },
          { label: "My Requests / Request Status", route: { name: "gc-requests" }, icon: IconHand },
          { label: "Pickup Barcode", route: { name: "gc-pickup-barcode" }, icon: IconBarcode },
                    {
            label: "Received Surplus Food/Food waste History",
            route: { name: "gc-history" },
            icon: IconHistory,
          },
        ],
      },
      {
        eyebrow: "Account",
        items: [{ label: "Profile / Account Settings", route: { name: "profile" }, icon: IconSettings }],
      },
    ];
  }

  return [
    {
      eyebrow: "Overview",
      items: [
        { label: "User Dashboard", route: { name: "user-dashboard" }, icon: IconChart },
      ],
    },
    {
      eyebrow: "Food",
      items: [
        { label: "Register Food", route: { name: "register-food" }, icon: IconBox },
        { label: "My Food Inventory", route: { name: "inventory" }, icon: IconList },
        { label: "Barcode / Print Label", route: { name: "print-label" }, icon: IconBarcode },
        { label: "Scan Barcode (camera)", route: { name: "scan-barcode" }, icon: IconCamera },
        { label: "Expiry Notifications", route: { name: "expiry-notifications" }, icon: IconBell },
      ],
    },
    {
      eyebrow: "Donation",
      items: [
        { label: "Food Donation", route: { name: "food-donation" }, icon: IconGift },
        { label: "Donation History", route: { name: "donation-history" }, icon: IconHistory },
        { label: "Food Retrieval / Collection Status", route: { name: "retrieval" }, icon: IconHand },
      ],
    },
    {
      eyebrow: "Account",
      items: [{ label: "Profile / Account Settings", route: { name: "profile" }, icon: IconSettings }],
    },
  ];
}

/** Pages a role is allowed to open (§17). Anything else → Access Denied. */
export function canAccess(role: Role | null, route: Route): boolean {
  if (route.name === "unauthorized" || route.name === "not-found") return true;
  const publicRoutes: Route["name"][] = [
    "landing",
    "about",
    "signup",
    "signin",
    "forgot",
    "reset",
    "public-lookup",
    "public-carbon",
  ];
  if (publicRoutes.includes(route.name)) return true;
  if (!role) return false;

  if (role === "User") {
    const allowed: Route["name"][] = [
      "user-dashboard",
      "register-food",
      "inventory",
      "food-detail",
      "print-label",
      "scan-barcode",
      "expiry-notifications",
      "food-donation",
      "donation-history",
      "retrieval",
      "profile",
    ];
    return allowed.includes(route.name);
  }

  if (role === "Manager") {
    const allowed: Route["name"][] = [
      "manager-dashboard",
      "manager-users",
      "manager-inventory",
      "manager-categories",
      "manager-shelf-life",
      "manager-factors",
      "manager-lockers",
      "manager-barcodes",
      "manager-donations",
      "manager-requests",
      "manager-expiry-monitor",
      "activity-logs",
      "reports",
      "profile",
      // Manager may inspect records read-only (no edit-expiry control).
      "food-detail",
      "print-label",
      "scan-barcode",
      "inventory",
    ];
    return allowed.includes(route.name);
  }

  const allowed: Route["name"][] = [
    "gc-dashboard",
    "gc-donations",
    "gc-donation-detail",
    "gc-requests",
    "gc-pickup-barcode",
    "gc-history",
    "profile",
  ];
  return allowed.includes(route.name);
}
