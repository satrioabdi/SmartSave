/**
 * Application state for the prototype. Everything lives in memory — this is a
 * UI prototype, not a backend. Actions mirror the required workflows so the
 * visible behaviour matches the requirement while remaining honest about what
 * is simulated (see the demo banners in the UI).
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SEED_DONATIONS,
  SEED_EVENTS,
  SEED_FOOD,
  SEED_LOGS,
  SEED_NOTIFICATIONS,
  SEED_REQUESTS,
  ACCOUNTS,
} from "../data/seed";
import { resolveFactor, resolveShelfLife } from "../data/catalog";
import {
  SEED_COMPARTMENTS,
  compartmentBlockReason,
  compartmentOccupancy,
} from "../data/compartments";
import { addDays, effectiveFoodStatus } from "./format";
import type {
  Account,
  ActivityLog,
  CarbonImpactEvent,
  CompartmentStatus,
  Donation,
  FoodItem,
  GcRequest,
  NotificationEvent,
  Role,
  Session,
  VirtualCompartment,
} from "./types";

export type Route =
  | { name: "landing" }
  | { name: "about" }
  | { name: "signup" }
  | { name: "signin" }
  | { name: "forgot" }
  | { name: "reset" }
  | { name: "public-lookup" }
  | { name: "public-carbon"; barcode?: string }
  | { name: "user-dashboard" }
  | { name: "register-food" }
  | { name: "inventory" }
  | { name: "food-detail"; id: string }
  | { name: "print-label"; id?: string }
  | { name: "scan-barcode" }
  | { name: "expiry-notifications" }
  | { name: "food-donation" }
  | { name: "donation-history" }
  | { name: "retrieval" }
  | { name: "profile" }
  | { name: "manager-dashboard" }
  | { name: "manager-users" }
  | { name: "manager-lockers" }
  | { name: "manager-inventory"; owner?: string }
  | { name: "manager-categories" }
  | { name: "manager-shelf-life" }
  | { name: "manager-factors" }
  | { name: "manager-barcodes" }
  | { name: "manager-donations" }
  | { name: "manager-requests" }
  | { name: "manager-expiry-monitor" }
  | { name: "activity-logs" }
  | { name: "reports" }
  | { name: "gc-dashboard" }
  | { name: "gc-donations" }
  | { name: "gc-donation-detail"; id: string }
  | { name: "gc-requests" }
  | { name: "gc-history" }
  | { name: "unauthorized" }
  | { name: "not-found" };

export const ROUTE_PATH: Record<Route["name"], string> = {
  landing: "/",
  about: "/about",
  signup: "/signup",
  signin: "/signin",
  forgot: "/forgot-password",
  reset: "/reset-password",
  "public-lookup": "/barcode",
  "public-carbon": "/carbon-footprint",
  "user-dashboard": "/app/dashboard",
  "register-food": "/app/register-food",
  inventory: "/app/inventory",
  "food-detail": "/app/inventory",
  "print-label": "/app/barcode",
  "scan-barcode": "/app/scan",
  "expiry-notifications": "/app/expiry-notifications",
  "food-donation": "/app/food-donation",
  "donation-history": "/app/donation-history",
  retrieval: "/app/retrieval",
  profile: "/app/profile",
  "manager-dashboard": "/manager/dashboard",
  "manager-users": "/manager/users",
  "manager-lockers": "/manager/lockers",
  "manager-inventory": "/manager/food-inventory",
  "manager-categories": "/manager/categories",
  "manager-shelf-life": "/manager/shelf-life",
  "manager-factors": "/manager/emission-factors",
  "manager-barcodes": "/manager/barcodes",
  "manager-donations": "/manager/donations",
  "manager-requests": "/manager/green-community-requests",
  "manager-expiry-monitor": "/manager/expiry-monitoring",
  "activity-logs": "/manager/activity-logs",
  reports: "/manager/reports",
  "gc-dashboard": "/gc/dashboard",
  "gc-donations": "/gc/donations",
  "gc-donation-detail": "/gc/donations",
  "gc-requests": "/gc/requests",
  "gc-history": "/gc/history",
  unauthorized: "/unauthorized",
  "not-found": "/not-found",
};

interface AppState {
  session: Session | null;
  route: Route;
  accounts: Account[];
  food: FoodItem[];
  compartments: VirtualCompartment[];
  donations: Donation[];
  requests: GcRequest[];
  events: CarbonImpactEvent[];
  notifications: NotificationEvent[];
  logs: ActivityLog[];
  toast: string | null;
}

interface AppActions {
  navigate: (route: Route) => void;
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
  registerFood: (input: {
    name: string;
    category: string;
    subcategory: string;
    subtype?: string;
    massG: number;
    photoLabel: string;
    /**
     * Data URL of the uploaded/captured photo (session-only, prototype demo).
     * Passed through so the record shows the user's own photo on click.
     */
    photoDataUrl?: string;
    freshness: "fit" | "rejected";
    /** Chosen virtual locker compartment (Register Food wizard step 1). */
    compartmentId: string;
    /**
     * Barcode printed on the label in wizard step 4. Passing it keeps the
     * printed code and the stored record identical (§5).
     */
    barcode?: string;
  }) => FoodItem | null;
  updateCompartment: (
    id: string,
    patch: Partial<Pick<VirtualCompartment, "category" | "capacityG" | "temperatureC" | "status">>,
  ) => void;
  createDonation: (input: {
    foodIds: string[];
    note?: string;
  }) => Donation | null;
  cancelDonation: (id: string) => void;
  submitRequest: (donationId: string) => void;
  decideRequest: (id: string, approve: boolean, reason?: string) => void;
  distributeDonation: (donationId: string) => void;
  collectFood: (foodId: string) => void;
  /**
   * Manager mass-verification decision (photo-on-scale workflow). "approve"
   * confirms the declared mass; "edit" corrects it to `confirmedG`. Both
   * resolve the Pending state and leave an audit entry.
   */
  reviewMass: (
    foodId: string,
    decision: "approve" | "edit",
    confirmedG?: number,
    note?: string,
  ) => void;
  markNotificationsRead: () => void;
  updateShelfLife: (categoryId: string, days: number) => void;
  setToast: (msg: string | null) => void;
}

const noopActions: AppActions = {
  navigate: () => {},
  signIn: () => ({ ok: false }),
  signOut: () => {},
  registerFood: () => null,
  updateCompartment: () => {},
  createDonation: () => null,
  cancelDonation: () => {},
  submitRequest: () => {},
  decideRequest: () => {},
  distributeDonation: () => {},
  collectFood: () => {},
  reviewMass: () => {},
  markNotificationsRead: () => {},
  updateShelfLife: () => {},
  setToast: () => {},
};

const StoreContext = createContext<AppState & AppActions>({
  session: null,
  route: { name: "landing" },
  accounts: ACCOUNTS,
  food: SEED_FOOD,
  compartments: SEED_COMPARTMENTS,
  donations: SEED_DONATIONS,
  requests: SEED_REQUESTS,
  events: SEED_EVENTS,
  notifications: SEED_NOTIFICATIONS,
  logs: SEED_LOGS,
  toast: null,
  ...noopActions,
});

let idSeq = 1000;
const nextId = (prefix: string) => `${prefix}-${++idSeq}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: "landing" });
  const [session, setSession] = useState<Session | null>(null);
  const [food, setFood] = useState<FoodItem[]>(SEED_FOOD);
  const [compartments, setCompartments] =
    useState<VirtualCompartment[]>(SEED_COMPARTMENTS);
  const [donations, setDonations] = useState<Donation[]>(SEED_DONATIONS);
  const [requests, setRequests] = useState<GcRequest[]>(SEED_REQUESTS);
  const [events, setEvents] = useState<CarbonImpactEvent[]>(SEED_EVENTS);
  const [notifications, setNotifications] =
    useState<NotificationEvent[]>(SEED_NOTIFICATIONS);
  const [logs, setLogs] = useState<ActivityLog[]>(SEED_LOGS);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string | null) => {
    setToast(msg);
    if (msg) {
      window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3200);
    }
  }, []);

  const navigate = useCallback((next: Route) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const pushLog = useCallback(
    (actor: string, action: string, target: string, detail?: string) => {
      setLogs((prev) => [
        {
          id: nextId("AL"),
          at: new Date().toISOString(),
          actor,
          action,
          target,
          detail,
        },
        ...prev,
      ]);
    },
    [],
  );

  const signIn = useCallback(
    (email: string, password: string) => {
      const account = ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!account) {
        return { ok: false, error: "No account matches that email address." };
      }
      if (password.length < 6) {
        return {
          ok: false,
          error: "Password must be at least 6 characters.",
        };
      }
      setSession({
        userId: account.id,
        name: account.name,
        role: account.role,
      });
      pushLog(account.name, "Signed in", account.email, "Prototype session started.");
      const home: Route =
        account.role === "Manager"
          ? { name: "manager-dashboard" }
          : account.role === "Green Community"
            ? { name: "gc-dashboard" }
            : { name: "user-dashboard" };
      setRoute(home);
      return { ok: true };
    },
    [pushLog],
  );

  const signOut = useCallback(() => {
    setSession(null);
    setRoute({ name: "signin" });
  }, []);

  const registerFood: AppActions["registerFood"] = useCallback(
    (input) => {
      if (!session) return null;
      const comp = compartments.find((c) => c.id === input.compartmentId);
      if (!comp) {
        showToast("Choose a locker compartment before registering.");
        return null;
      }
      const reason = compartmentBlockReason(comp, food, input.category, input.massG);
      if (reason) {
        showToast(`${comp.hub} / ${comp.id} cannot accept this deposit — ${reason.toLowerCase()}.`);
        return null;
      }
      const shelf = resolveShelfLife(input.category, input.subcategory, input.subtype);
      const factor = resolveFactor(input.category, input.subcategory, input.subtype);
      const storedAt = new Date().toISOString();
      const id = nextId("FD");
      const item: FoodItem = {
        id,
        barcode: input.barcode ?? `SS-${id.replace("FD-", "")}`,
        name: input.name,
        category: input.category,
        subcategory: input.subcategory,
        subtype: input.subtype,
        massG: input.massG,
        storedAt,
        expiresAt: addDays(storedAt, shelf.days),
        status: "Stored",
        compartmentId: comp.id,
        compartmentLabel: `${comp.hub} / ${comp.id}`,
        ownerUserId: session.userId,
        ownerLabel: session.name,
        photoLabel: input.photoLabel,
        photoDataUrl: input.photoDataUrl,
        freshness: input.freshness,
        // Every new deposit enters the Manager mass-verification queue
        // (photo-on-scale workflow) as Pending.
        massVerification: {
          status: "Pending",
          declaredG: Math.round(input.massG),
          confirmedG: null,
          reviewedBy: null,
          reviewedAt: null,
        },
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
      setFood((prev) => [item, ...prev]);
      pushLog(
        session.name,
        "Registered food",
        id,
        `${input.massG.toLocaleString("en-US")} g · locker ${comp.hub} / ${comp.id} · expiry auto-calculated from demo rule (${shelf.ruleLabel}).`,
      );
      showToast(`Food registered — ${id} is now Stored in ${comp.hub} / ${comp.id}.`);
      return item;
    },
    [session, food, compartments, pushLog, showToast],
  );

  /**
   * One mass/lot is claimed once per outcome (§18). The claim key makes a
   * second attempt a no-op instead of a double count.
   */
  const recordEvent = useCallback(
    (
      item: FoodItem,
      type: CarbonImpactEvent["type"],
      actor: string,
    ): CarbonImpactEvent | null => {
      const claimKey = `${item.id}:${type}`;
      let created: CarbonImpactEvent | null = null;
      setEvents((prev) => {
        if (prev.some((e) => e.claimKey === claimKey)) return prev;
        const factor = resolveFactor(
          item.category,
          item.subcategory,
          item.subtype,
        );
        let co2eKg: number | null = null;
        if (factor.state.kind === "valid" && factor.factor) {
          co2eKg =
            Math.round((item.massG / 1000) * factor.factor.factorP90 * 100) / 100;
        }
        created = {
          id: nextId("CIE"),
          claimKey,
          type,
          foodId: item.id,
          label: item.name,
          massG: item.massG,
          factorP90: factor.factor?.factorP90 ?? null,
          unit: factor.factor?.unit ?? null,
          co2eKg,
          factorState: factor.state,
          occurredAt: new Date().toISOString(),
          methodologyVersion: factor.factor?.methodologyVersion ?? "—",
          sourceLabel: factor.factor?.sourceLabel ?? "—",
        };
        return [created, ...prev];
      });
      pushLog(
        actor,
        type === "Collected" ? "Collected food" : "Recorded impact event",
        item.id,
        type === "Collected"
          ? `${item.massG.toLocaleString("en-US")} g recorded; consumption assumed, not proven.`
          : `${item.massG.toLocaleString("en-US")} g recorded as donated mass.`,
      );
      return created;
    },
    [pushLog],
  );

  const collectFood: AppActions["collectFood"] = useCallback(
    (foodId) => {
      const item = food.find((f) => f.id === foodId);
      if (!item || !session) return;
      // Flow diagram 8: the acting user must own the record.
      if (item.ownerUserId !== session.userId) {
        showToast(`Access Denied — ${item.id} is not owned by your account.`);
        return;
      }
      // Flow diagram 12: only `Stored` transitions to `Collected`.
      const effective = effectiveFoodStatus(item.status, item.expiresAt);
      if (effective !== "Stored") {
        showToast(
          effective === "Expired"
            ? `${item.id} is expired — it cannot be collected.`
            : `This action is not available for the current status (${item.status}).`,
        );
        return;
      }
      recordEvent(item, "Collected", session.name);
      setFood((prev) =>
        prev.map((f) => (f.id === foodId ? { ...f, status: "Collected" } : f)),
      );
      showToast(`${item.id} marked as Collected.`);
    },
    [food, session, recordEvent, showToast],
  );

  /**
   * Manager mass verification. Approve keeps the declared mass; edit rewrites
   * `massG` to the confirmed value and stamps the record "Edited" so the UI
   * can say who corrected it. Expiry is never touched — only the mass.
   */
  const reviewMass: AppActions["reviewMass"] = useCallback(
    (foodId, decision, confirmedG, note) => {
      if (!session || session.role !== "Manager") return;
      const item = food.find((f) => f.id === foodId);
      if (!item) return;
      const declared = item.massVerification.declaredG;
      const approvedG =
        decision === "approve" ? declared : Math.max(0, Math.round(confirmedG ?? declared));
      if (decision === "edit" && (!Number.isFinite(approvedG) || approvedG <= 0)) {
        showToast("Enter a corrected mass greater than 0 grams.");
        return;
      }
      setFood((prev) =>
        prev.map((f) =>
          f.id === foodId
            ? {
                ...f,
                massG: approvedG,
                massVerification: {
                  status: decision === "approve" ? "Approved" : "Edited",
                  declaredG: declared,
                  confirmedG: approvedG,
                  reviewedBy: session.name,
                  reviewedAt: new Date().toISOString(),
                  note:
                    note?.trim() ||
                    (decision === "approve"
                      ? undefined
                      : "Mass corrected against the scale photo at Manager review."),
                },
              }
            : f,
        ),
      );
      pushLog(
        session.name,
        decision === "approve" ? "Approved food mass" : "Edited food mass",
        foodId,
        decision === "approve"
          ? `Declared ${declared.toLocaleString("en-US")} g confirmed against the scale photo.`
          : `Mass changed from ${declared.toLocaleString("en-US")} g to ${approvedG.toLocaleString("en-US")} g after Manager review.`,
      );
      showToast(
        decision === "approve"
          ? `${foodId} mass approved — ${approvedG.toLocaleString("en-US")} g confirmed.`
          : `${foodId} mass edited to ${approvedG.toLocaleString("en-US")} g and marked as Manager-edited.`,
      );
    },
    [food, session, pushLog, showToast],
  );

  const createDonation: AppActions["createDonation"] = useCallback(
    ({ foodIds, note }) => {
      if (!session) return null;
      // Only the owner may offer their own food, and only while still Stored
      // (flow diagram 9: Stored → Available for Donation). Expired records
      // are excluded even when their stored status has not been rewritten.
      const items = food.filter(
        (f) =>
          foodIds.includes(f.id) &&
          f.ownerUserId === session.userId &&
          effectiveFoodStatus(f.status, f.expiresAt) === "Stored",
      );
      if (items.length === 0) return null;
      const massG = items.reduce((sum, f) => sum + f.massG, 0);
      const donation: Donation = {
        id: nextId("DN"),
        foodIds: items.map((f) => f.id),
        label: items.map((f) => f.name).join(", "),
        massG,
        status: "Pending",
        createdBy: session.name,
        createdAt: new Date().toISOString(),
        note,
      };
      setDonations((prev) => [donation, ...prev]);
      setFood((prev) =>
        prev.map((f) =>
          foodIds.includes(f.id)
            ? { ...f, status: "Available for Donation" }
            : f,
        ),
      );
      pushLog(
        session.name,
        "Created donation",
        donation.id,
        `${massG.toLocaleString("en-US")} g offered to Green Community.`,
      );
      showToast(`Donation ${donation.id} created with status Pending.`);
      return donation;
    },
    [food, session, pushLog, showToast],
  );

  const cancelDonation: AppActions["cancelDonation"] = useCallback(
    (id) => {
      const donation = donations.find((d) => d.id === id);
      if (!donation || donation.status !== "Pending") return;
      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "Cancelled" } : d)),
      );
      setFood((prev) =>
        prev.map((f) =>
          donation.foodIds.includes(f.id) && f.status === "Available for Donation"
            ? { ...f, status: "Stored" }
            : f,
        ),
      );
      setRequests((prev) =>
        prev.map((r) =>
          r.donationId === id && r.status === "Pending"
            ? { ...r, status: "Rejected", reason: "Donation was cancelled by the donor." }
            : r,
        ),
      );
      pushLog(
        session?.name ?? "User",
        "Cancelled donation",
        id,
        "Status recorded; no impact event was created.",
      );
      showToast(`Donation ${id} cancelled.`);
    },
    [donations, session, pushLog, showToast],
  );

  const submitRequest: AppActions["submitRequest"] = useCallback(
    (donationId) => {
      const donation = donations.find((d) => d.id === donationId);
      if (!donation || !session || donation.status !== "Pending") return;
      if (requests.some((r) => r.donationId === donationId && r.submittedBy === session.name)) {
        showToast("A request for this donation is already recorded.");
        return;
      }
      const request: GcRequest = {
        id: nextId("RQ"),
        donationId,
        label: donation.label,
        massG: donation.massG,
        status: "Pending",
        submittedBy: session.name,
        submittedAt: new Date().toISOString(),
      };
      setRequests((prev) => [request, ...prev]);
      pushLog(
        session.name,
        "Submitted request",
        request.id,
        `${donation.massG.toLocaleString("en-US")} g requested from ${donation.id}.`,
      );
      showToast(`Request ${request.id} submitted for Manager review.`);
    },
    [donations, requests, session, pushLog, showToast],
  );

  const decideRequest: AppActions["decideRequest"] = useCallback(
    (id, approve, reason) => {
      const request = requests.find((r) => r.id === id);
      if (!request || request.status !== "Pending") return;
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: approve ? "Approved" : "Rejected",
                decidedAt: new Date().toISOString(),
                reason: approve ? undefined : reason,
              }
            : r,
        ),
      );
      pushLog(
        session?.name ?? "Manager",
        approve ? "Approved request" : "Rejected request",
        id,
        approve
          ? "Allocation confirmed for Green Community."
          : reason || "No reason recorded.",
      );
      showToast(
        `Request ${id} ${approve ? "approved" : "rejected"}. Status recorded.`,
      );
    },
    [requests, session, pushLog, showToast],
  );

  /**
   * Manager records the mass actually handed over. This is the single point
   * where a donation becomes Completed and its impact event is written.
   */
  const distributeDonation: AppActions["distributeDonation"] = useCallback(
    (donationId) => {
      const donation = donations.find((d) => d.id === donationId);
      if (!donation || donation.status !== "Pending" || !session) return;
      const approved = requests.find(
        (r) => r.donationId === donationId && r.status === "Approved",
      );
      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId
            ? {
                ...d,
                status: "Completed",
                allocatedTo: approved?.submittedBy ?? d.allocatedTo,
                completedAt: new Date().toISOString(),
              }
            : d,
        ),
      );
      setRequests((prev) =>
        prev.map((r) =>
          r.donationId === donationId && r.status === "Approved"
            ? { ...r, status: "Completed", decidedAt: new Date().toISOString() }
            : r,
        ),
      );
      const items = food.filter((f) => donation.foodIds.includes(f.id));
      items.forEach((item) => {
        recordEvent(item, "Distributed", session.name);
      });
      setFood((prev) =>
        prev.map((f) =>
          donation.foodIds.includes(f.id) ? { ...f, status: "Donated" } : f,
        ),
      );
      pushLog(
        session.name,
        "Distributed donation",
        donationId,
        `${donation.massG.toLocaleString("en-US")} g recorded as delivered.`,
      );
      showToast(`Donation ${donationId} completed and distributed.`);
    },
    [donations, requests, food, session, recordEvent, pushLog, showToast],
  );

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const updateShelfLife: AppActions["updateShelfLife"] = useCallback(
    (categoryId, days) => {
      pushLog(
        session?.name ?? "Manager",
        "Changed shelf-life rule",
        categoryId,
        `Demo rule set to ${days} days. Historical records keep their snapshot.`,
      );
      showToast(`Shelf-life rule for ${categoryId} saved to ${days} days.`);
    },
    [session, pushLog, showToast],
  );

  /**
   * Manager edits a virtual locker compartment (§9 configuration).
   * Capacity may not drop below the mass currently stored, so an edit can
   * never orphan an existing record.
   */
  const updateCompartment: AppActions["updateCompartment"] = useCallback(
    (id, patch) => {
      const current = compartments.find((c) => c.id === id);
      if (!current) return;
      const nextCapacity = patch.capacityG ?? current.capacityG;
      const used = compartmentOccupancy(food, id);
      if (nextCapacity < used) {
        showToast(
          `Capacity cannot be below the ${used.toLocaleString("en-US")} g currently stored in ${current.hub} / ${id}.`,
        );
        return;
      }
      setCompartments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch, capacityG: nextCapacity } : c)),
      );
      const changed = (Object.keys(patch) as (keyof typeof patch)[])
        .filter((k) => patch[k] !== undefined && patch[k] !== current[k])
        .map((k) => `${k} → ${String(patch[k])}`)
        .join(", ");
      pushLog(
        session?.name ?? "Manager",
        "Updated locker compartment",
        `${current.hub} / ${id}`,
        changed ? `${changed} (simulation — no hardware).` : "No field changed.",
      );
      showToast(`Locker ${current.hub} / ${id} updated.`);
    },
    [session, food, compartments, pushLog, showToast],
  );

  const value = useMemo(
    () => ({
      session,
      route,
      accounts: ACCOUNTS,
      food,
      compartments,
      donations,
      requests,
      events,
      notifications,
      logs,
      toast,
      navigate,
      signIn,
      signOut,
      registerFood,
      updateCompartment,
      createDonation,
      cancelDonation,
      submitRequest,
      decideRequest,
      distributeDonation,
      collectFood,
      reviewMass,
      markNotificationsRead,
      updateShelfLife,
      setToast: showToast,
    }),
    [
      session,
      route,
      food,
      compartments,
      donations,
      requests,
      events,
      notifications,
      logs,
      toast,
      navigate,
      signIn,
      signOut,
      registerFood,
      updateCompartment,
      createDonation,
      cancelDonation,
      submitRequest,
      decideRequest,
      distributeDonation,
      collectFood,
      reviewMass,
      markNotificationsRead,
      updateShelfLife,
      showToast,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}

export function homeFor(role: Role): Route {
  if (role === "Manager") return { name: "manager-dashboard" };
  if (role === "Green Community") return { name: "gc-dashboard" };
  return { name: "user-dashboard" };
}
