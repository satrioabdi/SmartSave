/**
 * Application router. Routes live in memory (no hash/history dependency) so the
 * prototype works from file:// as well as a local dev server. Access is checked
 * with canAccess before any page renders.
 */
import { useEffect } from "react";
import { useStore, homeFor, ROUTE_PATH, type Route } from "./lib/store";
import { canAccess } from "./lib/nav";

import {
  LandingPage,
  AboutPage,
  PublicLookupPage,
  PublicCarbonPage,
} from "./pages/PublicPages";
import {
  SignUpPage,
  SignInPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./pages/AuthPages";
import {
  UserDashboardPage,
  InventoryPage,
  FoodDetailPage,
  PrintLabelPage,
} from "./pages/UserPages";
import {
  RegisterFoodPage,
  ExpiryNotificationsPage,
} from "./pages/RegisterPages";
import {
  FoodDonationPage,
  DonationHistoryPage,
  RetrievalPage,
} from "./pages/DonationPages";
import {
  GcDashboardPage,
  GcDonationsPage,
  GcDonationDetailPage,
  GcRequestsPage,
  GcHistoryPage,
} from "./pages/GcPages";
import {
  ManagerDashboardPage,
  ManagerUsersPage,
  ManagerLockersPage,
  ManagerCategoriesPage,
  ManagerShelfLifePage,
  ManagerFactorsPage,
  ManagerBarcodesPage,
  ManagerDonationsPage,
  ManagerRequestsPage,
  ManagerExpiryMonitorPage,
  ActivityLogsPage,
  ReportsPage,
} from "./pages/ManagerPages";
import {
  ProfilePage,
  UnauthorizedPage,
  NotFoundPage,
} from "./pages/SystemPages";
import { ScanBarcodePage } from "./pages/ScanPages";

function ToastHost() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      {toast}
    </div>
  );
}

function Screen() {
  const { route, session } = useStore();

  if (!canAccess(session?.role ?? null, route)) {
    return session ? <UnauthorizedPage /> : <SignInPage />;
  }

  switch (route.name) {
    /* public */
    case "landing":
      return <LandingPage />;
    case "about":
      return <AboutPage />;
    case "public-lookup":
      return <PublicLookupPage />;
    case "public-carbon":
      return <PublicCarbonPage />;

    /* auth */
    case "signup":
      return <SignUpPage />;
    case "signin":
      return <SignInPage />;
    case "forgot":
      return <ForgotPasswordPage />;
    case "reset":
      return <ResetPasswordPage />;

    /* user */
    case "user-dashboard":
      return <UserDashboardPage />;
    case "register-food":
      return <RegisterFoodPage />;
    case "inventory":
      return <InventoryPage role={session?.role === "Manager" ? "Manager" : "User"} />;
    case "food-detail":
      return <FoodDetailPage role={session?.role === "Manager" ? "Manager" : "User"} />;
    case "print-label":
      return <PrintLabelPage />;
    case "scan-barcode":
      return <ScanBarcodePage />;
    case "expiry-notifications":
      return <ExpiryNotificationsPage />;
    case "food-donation":
      return <FoodDonationPage />;
    case "donation-history":
      return <DonationHistoryPage />;
    case "retrieval":
      return <RetrievalPage />;

    /* manager */
    case "manager-dashboard":
      return <ManagerDashboardPage />;
    case "manager-users":
      return <ManagerUsersPage />;
    case "manager-inventory":
      return (
        <InventoryPage
          role="Manager"
          key={route.owner ?? "all"}
          initialOwner={route.owner}
        />
      );
    case "manager-categories":
      return <ManagerCategoriesPage />;
    case "manager-shelf-life":
      return <ManagerShelfLifePage />;
    case "manager-lockers":
      return <ManagerLockersPage />;
    case "manager-factors":
      return <ManagerFactorsPage />;
    case "manager-barcodes":
      return <ManagerBarcodesPage />;
    case "manager-donations":
      return <ManagerDonationsPage />;
    case "manager-requests":
      return <ManagerRequestsPage />;
    case "manager-expiry-monitor":
      return <ManagerExpiryMonitorPage />;
    case "activity-logs":
      return <ActivityLogsPage />;
    case "reports":
      return <ReportsPage />;

    /* green community */
    case "gc-dashboard":
      return <GcDashboardPage />;
    case "gc-donations":
      return <GcDonationsPage />;
    case "gc-donation-detail":
      return <GcDonationDetailPage id={route.id} />;
    case "gc-requests":
      return <GcRequestsPage />;
    case "gc-history":
      return <GcHistoryPage />;

    /* account + system */
    case "profile":
      return <ProfilePage />;
    case "unauthorized":
      return <UnauthorizedPage />;
    case "not-found":
      return <NotFoundPage />;

    default:
      return <NotFoundPage />;
  }
}

/** Keeps the browser URL in sync with the in-memory route. */
function useUrlSync() {
  const { route, navigate, session } = useStore();

  useEffect(() => {
    const path = ROUTE_PATH[route.name];
    if (path && window.location.pathname !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [route]);

  useEffect(() => {
    const onPop = () => {
      const name = window.location.pathname;
      const match = (Object.keys(ROUTE_PATH) as Route["name"][]).find(
        (k) => ROUTE_PATH[k] === name,
      );
      if (match) {
        navigate({ name: match } as Route);
      } else if (session) {
        navigate(homeFor(session.role));
      } else {
        navigate({ name: "landing" });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [navigate, session]);
}

export default function App() {
  useUrlSync();
  return (
    <>
      <Screen />
      <ToastHost />
    </>
  );
}
