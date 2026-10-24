/** User pages: dashboard, inventory, food detail, print label. */
import { useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  AnalyticsNote,
  Badge,
  BarChart,
  CarbonValue,
  EmptyState,
  Field,
  Modal,
  Notice,
  PageHead,
  Panel,
  PeriodFilter,
  PhotoModal,
  PhotoThumb,
  PolicyBox,
  QuantityHeader,
  SafetyNotice,
  SimulationBanner,
  StatusBadge,
  SummaryList,
  TableEmpty,
  TableWrap,
  Toolbar,
} from "../components/ui";
import {
  IconBox,
  IconChart,
  IconClock,
  IconDownload,
  IconGift,
  IconHand,
  IconPrint,
  IconSearch,
} from "../components/icons";
import { DetailLabelCard } from "../components/Barcode";
import { useStore, type Route } from "../lib/store";
import {
  bucketValue,
  chartBuckets,
  computeCarbon,
  formatCo2e,
  formatMass,
  inPeriod,
  periodLabel,
  resolveForItem,
} from "../lib/carbon";
import {
  downloadCsv,
  effectiveFoodStatus,
  foodStatusVariant,
  formatDate,
  formatDateTime,
  isExpiringSoon,
  isExpired,
} from "../lib/format";
import type { FoodItem, Period } from "../lib/types";

/* ---------------------------- shared bits ----------------------------- */

export function itemCarbon(item: FoodItem) {
  return computeCarbon(item.massG, resolveForItem(item.category, item.subcategory, item.subtype));
}

export function openDetail(navigate: (r: Route) => void, id: string) {
  navigate({ name: "food-detail", id });
}

/* --------------------------- User dashboard --------------------------- */

export function UserDashboardPage() {
  const { session, food, donations, events, navigate } = useStore();
  const [period, setPeriod] = useState<Period>("Monthly");

  if (!session) return null;
  const mine = food.filter((f) => f.ownerUserId === session.userId);
  const myEvents = events.filter((e) => inPeriod(e.occurredAt, period));
  const mineIds = new Set(mine.map((f) => f.id));
  const myPeriodEvents = myEvents.filter((e) => mineIds.has(e.foodId));

  const active = mine.filter((f) => f.status === "Stored" && !isExpired(f.expiresAt));
  const expiring = mine.filter((f) => isExpiringSoon(f.expiresAt) && f.status === "Stored");
  const expired = mine.filter((f) => f.status === "Expired" || (isExpired(f.expiresAt) && f.status === "Stored"));
  const massG = mine.reduce((s, f) => s + f.massG, 0);
  const co2e = myPeriodEvents.reduce((s, e) => s + (e.co2eKg ?? 0), 0);
  const unresolved = myPeriodEvents.filter((e) => e.co2eKg === null).length;

  const myDonations = donations.filter((d) => d.createdBy === session.name);
  const pendingDonations = myDonations.filter((d) => d.status === "Pending").length;

  const buckets = chartBuckets(period);
  const chartData = buckets.map((b) => ({
    label: b.label,
    value: myPeriodEvents
      .filter((e) => bucketValue(e.occurredAt, b) && e.co2eKg !== null)
      .reduce((s, e) => s + (e.co2eKg ?? 0), 0),
  }));

  const recent = mine.slice(0, 5);

  return (
    <AppShell title="User Dashboard">
      <PageHead
        eyebrow="Role: User"
        title="User Dashboard"
        description="Food registered, active/expiring/expired items, donation status, mass and estimated CO₂e for the selected period."
        actions={
          <>
            <PeriodFilter value={period} onChange={setPeriod} />
            <button
              type="button"
              className="button button--primary"
              onClick={() => navigate({ name: "register-food" })}
            >
              Register Food
            </button>
          </>
        }
      />

      <div className="stack">
        <div className="metrics-grid">
          <MetricMass massG={massG} foot={`${mine.length} food records in total`} />
          <MetricCo2e kg={co2e} foot={`${periodLabel(period)} · qualified events only`} />
          <div className="metric-card">
            <div className="metric-icon metric-icon--blue"><IconClock /></div>
            <div>
              <div className="metric-label">Active / expiring / expired</div>
              <div className="metric-value">
                {active.length}
                <small>active</small>
              </div>
            </div>
            <div className="metric-foot">
              {expiring.length} expiring within 2 hours · {expired.length} expired
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--amber"><IconGift /></div>
            <div>
              <div className="metric-label">Donation status</div>
              <div className="metric-value">
                {pendingDonations}
                <small>pending</small>
              </div>
            </div>
            <div className="metric-foot">
              {myDonations.filter((d) => d.status === "Completed").length} completed ·{" "}
              {myDonations.filter((d) => d.status === "Cancelled").length} cancelled
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <Panel
            title="Estimated CO₂e avoided"
            description={`${periodLabel(period)} · aggregated without double counting`}
          >
            <div className="stack stack--sm">
              <BarChart data={chartData} unit="kg CO₂e" />
              <AnalyticsNote extra="Food taken by a User is assumed to be consumed; this is not proof of actual consumption." />
              {unresolved > 0 && (
                <Notice title={`${unresolved} event(s) without a usable factor`}>
                  These are reported as “Emission factor not configured” or
                  “Unable to calculate” instead of zero.
                </Notice>
              )}
            </div>
          </Panel>

          <Panel title="Recent activity" description="Your latest records">
            <div className="activity-list">
              {recent.length === 0 && <EmptyState title="No food registered yet" />}
              {recent.map((f, i) => (
                <div className="activity-item" key={f.id}>
                  <span
                    className={`activity-dot${i % 3 === 1 ? " activity-dot--blue" : i % 3 === 2 ? " activity-dot--amber" : ""}`}
                  />
                  <div style={{ minWidth: 0 }}>
                    <button
                      type="button"
                      className="activity-title"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                      onClick={() => openDetail(navigate, f.id)}
                    >
                      {f.name}
                    </button>
                    <div className="activity-time">
                      {formatMass(f.massG)} · {f.status} · stored {formatDate(f.storedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="button button--secondary button--sm"
              style={{ width: "100%", marginTop: 14 }}
              onClick={() => navigate({ name: "inventory" })}
            >
              Open My Food Inventory
            </button>
          </Panel>
        </div>

        <Panel
          title="Food inventory snapshot"
          description="Quantity and Estimated CO₂e Avoided always appear together."
          action={
            <button
              type="button"
              className="button button--secondary button--sm"
              onClick={() => navigate({ name: "inventory" })}
            >
              View all
            </button>
          }
        >
          <TableWrap>
            <thead>
              <tr>
                <th scope="col">Food</th>
                <th scope="col">Status</th>
                <th scope="col">Expiration</th>
                <QuantityHeader />
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && <TableEmpty colSpan={5} text="No records yet." />}
              {recent.map((f) => (
                <tr key={f.id}>
                  <td>
                    <button
                      type="button"
                      className="cell-strong"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                      onClick={() => openDetail(navigate, f.id)}
                    >
                      {f.name}
                    </button>
                    <span className="cell-sub">
                      {f.id} · {f.category}
                    </span>
                  </td>
                  <td>
                    <StatusBadge label={f.status} variant={foodStatusVariant(f.status)} />
                  </td>
                  <td className="num-col">{formatDate(f.expiresAt)}</td>
                  <td className="num-col">{formatMass(f.massG)}</td>
                  <td className="num-col">
                    <ItemCarbonCell item={f} events={myPeriodEvents} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      </div>
    </AppShell>
  );
}

/**
 * §18: registration alone is not an avoided emission. Until a qualifying event
 * exists the cell explains that, instead of showing a number or a bare dash.
 */
function ItemCarbonCell({
  item,
  events,
}: {
  item: FoodItem;
  events: { foodId: string; co2eKg: number | null }[];
}) {
  const event = events.find((e) => e.foodId === item.id && e.co2eKg !== null);
  if (event && event.co2eKg !== null) {
    return <CarbonValue value={{ kind: "value", kg: event.co2eKg }} />;
  }
  return (
    <Badge variant="neutral">No qualifying event yet</Badge>
  );
}

function MetricMass({ massG, foot }: { massG: number; foot: string }) {
  return (
    <div className="metric-card">
      <div className="metric-icon"><IconBox /></div>
      <div>
        <div className="metric-label">Food mass registered</div>
        <div className="metric-value">
          {massG.toLocaleString("en-US")}
          <small>g</small>
        </div>
      </div>
      <div className="metric-foot">{foot}</div>
    </div>
  );
}

function MetricCo2e({ kg, foot }: { kg: number; foot: string }) {
  return (
    <div className="metric-card">
      <div className="metric-icon"><IconChart /></div>
      <div>
        <div className="metric-label">Estimated CO₂e Avoided</div>
        <div className="metric-value">
          {kg.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <small>kg CO₂e</small>
        </div>
      </div>
      <div className="metric-foot">{foot}</div>
    </div>
  );
}

/* ----------------------------- Inventory ------------------------------ */

export function InventoryPage({
  role = "User",
  initialOwner,
}: {
  role?: "User" | "Manager";
  /** Manager entry from User and Role Management — pre-filtered to one person. */
  initialOwner?: string;
}) {
  const { session, food, events, navigate, reviewMass, cancelMassReview, setToast } =
    useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  // Manager-only person filter. Seeded from the route when arriving from
  // User and Role Management (the page remounts with a fresh key), then
  // freely changeable with the "All owners" option.
  const [owner, setOwner] = useState(initialOwner ?? "All");
  const [photo, setPhoto] = useState<FoodItem | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNote, setEditNote] = useState("");

  if (!session) return null;
  const base =
    role === "Manager"
      ? owner === "All"
        ? food
        : food.filter((f) => f.ownerUserId === owner)
      : food.filter((f) => f.ownerUserId === session.userId);

  const ownerNames = new Map(food.map((f) => [f.ownerUserId, f.ownerLabel] as const));
  const ownerOptions = ["All", ...Array.from(new Set(food.map((f) => f.ownerUserId)))];
  const categories = ["All", ...Array.from(new Set(base.map((f) => f.category)))];
  const rows = base.filter(
    (f) =>
      (status === "All" || effectiveFoodStatus(f.status, f.expiresAt) === status) &&
      (category === "All" || f.category === category) &&
      (q.trim() === "" ||
        f.name.toLowerCase().includes(q.toLowerCase()) ||
        f.id.toLowerCase().includes(q.toLowerCase()) ||
        f.barcode.toLowerCase().includes(q.toLowerCase())),
  );

  const exportCsv = () => {
    downloadCsv("smartsave-inventory.csv", [
      [
        "Food ID",
        "Name",
        "Category",
        "Subcategory",
        "Quantity (g)",
        "Estimated CO₂e Avoided (kg CO₂e)",
        "Status",
        "Locker",
        "Stored At",
        "Expiration Date & Time",
      ],
      ...rows.map((f) => {
        const ev = events.find((e) => e.foodId === f.id && e.co2eKg !== null);
        const resolution = resolveForItem(f.category, f.subcategory, f.subtype);
        const value = ev?.co2eKg != null
          ? formatCo2e(ev.co2eKg)
          : computeCarbon(f.massG, resolution).kind === "value"
            ? "No qualifying event yet"
            : computeCarbon(f.massG, resolution).kind === "unable"
              ? "Unable to calculate"
              : "Emission factor not configured";
        return [
          f.id,
          f.name,
          f.category,
          f.subcategory,
          f.massG,
          value,
          // Same label as the on-screen table (§8: CSV mirrors the screen).
          effectiveFoodStatus(f.status, f.expiresAt),
          f.compartmentLabel ?? "—",
          formatDateTime(f.storedAt),
          formatDateTime(f.expiresAt),
        ];
      }),
    ]);
  };

  return (
    <AppShell title={role === "Manager" ? "Food & Inventory Management" : "My Food Inventory"}>
      <PageHead
        eyebrow={`Role: ${role}`}
        title={role === "Manager" ? "Food & Inventory Management" : "My Food Inventory"}
        description={
          role === "Manager"
            ? "Search and filter records, inspect status and audit trail. Expiration is displayed as text and cannot be edited or extended here."
            : "Every record with its mass, automatic expiration and the impact of any qualifying event."
        }
        actions={
          <>
            <button type="button" className="button button--secondary" onClick={exportCsv}>
              <IconDownload />
              Export CSV
            </button>
            {role === "User" && (
              <button
                type="button"
                className="button button--primary"
                onClick={() => navigate({ name: "register-food" })}
              >
                Register Food
              </button>
            )}
          </>
        }
      />

      <div className="stack">
        <Toolbar>
          <input
            className="grow"
            placeholder="Search by name, food ID or barcode"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search records"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            {["All", "Stored", "Available for Donation", "Donated", "Collected", "Expired"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category filter">
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {role === "Manager" && (
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              aria-label="Owner filter"
            >
              {ownerOptions.map((o) => (
                <option key={o} value={o}>
                  {o === "All" ? "All owners" : ownerNames.get(o) ?? o}
                </option>
              ))}
            </select>
          )}
          <span className="tiny">
            {rows.length} of {base.length} records
          </span>
        </Toolbar>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">Photo</th>
              <th scope="col">Food</th>
              <th scope="col">Category / Subcategory</th>
              <th scope="col">Status</th>
              {role === "Manager" && <th scope="col">Owner</th>}
              <th scope="col">Locker</th>
              <th scope="col">Stored At</th>
              <th scope="col">Expiration Date &amp; Time</th>
              <QuantityHeader />
              {role === "Manager" && <th scope="col">Mass check</th>}
              <th scope="col" style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <TableEmpty colSpan={role === "Manager" ? 12 : 10} text="No records match these filters." />
            )}
            {rows.map((f) => {
              const verification = f.massVerification;
              const edited = verification.status === "Edited";
              return (
            <tr
              key={f.id}
              className={role === "Manager" ? "row-click" : undefined}
              onClick={role === "Manager" ? () => openDetail(navigate, f.id) : undefined}
            >
                <td>
                  {f.photoLabel ? (
                    <PhotoThumb
                      name={f.photoLabel}
                      label={`${f.name} (${f.id})`}
                      dataUrl={f.photoDataUrl}
                      onOpen={() => setPhoto(f)}
                    />
                  ) : (
                    <span className="tiny">—</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="cell-strong"
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(navigate, f.id);
                    }}
                  >
                    {f.name}
                  </button>
                  <span className="cell-sub">{f.id} · {f.barcode}</span>
                </td>
                <td>
                  {f.category}
                  <span className="cell-sub">
                    {f.subcategory}
                    {f.subtype ? ` · ${f.subtype}` : ""}
                  </span>
                </td>
                <td>
                  <StatusBadge
                    label={
                      effectiveFoodStatus(f.status, f.expiresAt) === "Expired"
                        ? "Expired"
                        : f.status === "Stored" && isExpiringSoon(f.expiresAt)
                          ? "Expiring Soon"
                          : f.status
                    }
                    variant={
                      effectiveFoodStatus(f.status, f.expiresAt) === "Expired"
                        ? "danger"
                        : f.status === "Stored" && isExpiringSoon(f.expiresAt)
                          ? "warning"
                          : foodStatusVariant(f.status)
                    }
                  />
                </td>
                {role === "Manager" && (
                  <td className="num-col">{f.ownerLabel}</td>
                )}
                <td>
                  {f.compartmentLabel ?? "—"}
                  {f.compartmentLabel && (
                    <span className="cell-sub">Virtual locker</span>
                  )}
                </td>
                <td className="num-col">{formatDateTime(f.storedAt)}</td>
                <td className="num-col">
                  {formatDateTime(f.expiresAt)}
                  <span className="cell-sub">auto — not editable</span>
                </td>
                <td className="num-col">
                  {formatMass(f.massG)}
                  {edited && (
                    <span className="cell-sub" style={{ color: "var(--amber)" }}>
                      Edited by management (was {verification.declaredG.toLocaleString("en-US")} g)
                    </span>
                  )}
                </td>
                <td className="num-col">
                  <ItemCarbonCell item={f} events={events} />
                </td>
                {role === "Manager" && (
                  <td>
                    {verification.status === "Pending" ? (
                      <Badge variant="warning">Pending review</Badge>
                    ) : verification.status === "Approved" ? (
                      <Badge variant="success">Approved by management</Badge>
                    ) : (
                      <Badge variant="info">Edited by management</Badge>
                    )}
                  </td>
                )}
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="table-actions">
                    {role === "Manager" && verification.status === "Pending" && (
                      <>
                        <button
                          type="button"
                          className="button button--primary button--sm"
                          title="Confirm the declared mass matches the scale photo"
                          onClick={() => reviewMass(f.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="button button--secondary button--sm"
                          onClick={() => {
                            setEditId(f.id);
                            setEditValue(String(f.massG));
                            setEditNote("");
                          }}
                        >
                          Edit mass
                        </button>
                      </>
                    )}
                    {role === "Manager" && verification.status !== "Pending" && (
                      <button
                        type="button"
                        className="button button--ghost button--sm"
                        title="Cancel the recorded decision — the record returns to Pending with the declared mass restored"
                        onClick={() => cancelMassReview(f.id)}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      className="button button--secondary button--sm"
                      onClick={() => openDetail(navigate, f.id)}
                    >
                      Detail
                    </button>
                    <button
                      type="button"
                      className="button button--secondary button--sm"
                      onClick={() => navigate({ name: "print-label", id: f.id })}
                    >
                      Label
                    </button>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </TableWrap>

        {role === "Manager" && (
          <Notice title="Mass verification workflow">
            Click a photo to open it. The photo must show the food on the
            weighing scale — approve the declared mass, or edit it to the scale
            reading. Edited records are marked <strong>Edited by
            management</strong> with the original value kept, and every decision
            is written to the Activity Logs. A recorded decision can be
            withdrawn with <strong>Cancel</strong> — the record returns to
            Pending with the declared mass restored, so an accidental click is
            never final.
          </Notice>
        )}

        <p className="tiny">
          Expiration Date &amp; Time is calculated automatically from the
          shelf-life rule captured in each record's snapshot. Neither the User nor
          a Manager can edit or extend it.
        </p>
      </div>

      {photo && (
        <PhotoModal
          name={photo.photoLabel ?? "photo"}
          label={`${photo.name} · ${photo.id} · declared ${formatMass(photo.massG)}`}
          dataUrl={photo.photoDataUrl}
          onClose={() => setPhoto(null)}
        />
      )}

      {editId && (
        <Modal
          title={`Edit mass — ${editId}`}
          onClose={() => setEditId(null)}
          actions={
            <>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  const n = Number(editValue);
                  if (!Number.isFinite(n) || n <= 0) {
                    setToast("Enter a corrected mass greater than 0 grams.");
                    return;
                  }
                  reviewMass(editId, "edit", Math.round(n), editNote.trim() || undefined);
                  setEditId(null);
                }}
              >
                Save correction
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setEditId(null)}
              >
                Cancel
              </button>
            </>
          }
        >
          <div className="stack stack--sm">
            <Notice title="Manager correction">
              The record keeps its original declared value and is marked
              “Edited by management”. This note is shown to the owner and logged.
            </Notice>
            <Field label="Corrected mass (g)" hint="Take the value from the weighing scale in the photo">
              <input
                inputMode="numeric"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field label="Reason (optional)" hint="e.g. Scale photo shows 1,950 g, declared 2,100 g">
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Why is the declared mass being corrected?"
              />
            </Field>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

/* ---------------------------- Food detail ----------------------------- */

export function FoodDetailPage({ role = "User" }: { role?: "User" | "Manager" }) {
  const { session, food, donations, events, navigate, collectFood } = useStore();
  const route = useStore().route;
  const id = route.name === "food-detail" ? route.id : "";
  const item = food.find((f) => f.id === id);
  // Photo dialog state lives before the early returns so the hook order stays
  // stable across the "not found" and "access denied" renders.
  const [photoOpen, setPhotoOpen] = useState(false);

  if (!session) return null;
  if (!item) {
    return (
      <AppShell title="Food Detail">
        <EmptyState title="Record not found" hint="This food ID does not exist in the demo dataset." />
      </AppShell>
    );
  }
  // Flow diagram 6/8: calculation detail is visible only to a signed-in user
  // who is authorized for this record. Managers may inspect read-only.
  const isOwner = item.ownerUserId === session.userId;
  if (!isOwner && role !== "Manager") {
    return (
      <AppShell title="Access Denied">
        <PageHead
          eyebrow="System"
          title="Access Denied"
          description="This food record does not belong to your account."
        />
        <div className="stack">
          <EmptyState
            title="You are not authorized for this record"
            hint={`${item.id} is owned by another user. Open it from a public barcode to see the non-personal view instead.`}
          />
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              onClick={() => navigate({ name: "inventory" })}
            >
              Back to my inventory
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => navigate({ name: "public-lookup" })}
            >
              Open public barcode view
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const resolution = resolveForItem(item.category, item.subcategory, item.subtype);
  const value = computeCarbon(item.massG, resolution);
  const event = events.find((e) => e.foodId === item.id);
  const donation = donations.find((d) => d.foodIds.includes(item.id));
  const expired = effectiveFoodStatus(item.status, item.expiresAt) === "Expired";
  const canCollect = role === "User" && isOwner && effectiveFoodStatus(item.status, item.expiresAt) === "Stored";
  const canDonate = role === "User" && isOwner && item.status === "Stored" && !expired;

  return (
    <AppShell title="Food Detail">
      <PageHead
        eyebrow={`Role: ${role}`}
        title={item.name}
        description={`${item.id} · ${item.category} · ${item.subcategory}${item.subtype ? ` · ${item.subtype}` : ""}`}
        actions={
          <>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => navigate({ name: "print-label", id: item.id })}
            >
              <IconPrint />
              Barcode / Print Label
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => navigate(role === "Manager" ? { name: "manager-inventory" } : { name: "inventory" })}
            >
              Back to list
            </button>
          </>
        }
      />

      <div className="stack">
        <div className="metrics-grid metrics-grid--3">
          <div className="metric-card">
            <div className="metric-icon"><IconBox /></div>
            <div>
              <div className="metric-label">Quantity</div>
              <div className="metric-value">
                {item.massG.toLocaleString("en-US")}
                <small>g</small>
              </div>
            </div>
            <div className="metric-foot">
              Converted: {value.kind === "value" ? `${(item.massG / 1000).toFixed(2)} kg` : `${(item.massG / 1000).toFixed(2)} kg`}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--blue"><IconClock /></div>
            <div>
              <div className="metric-label">Expiration Date &amp; Time</div>
              <div className="metric-value" style={{ fontSize: 20 }}>
                {formatDateTime(item.expiresAt)}
              </div>
            </div>
            <div className="metric-foot">
              Auto-calculated · rule snapshot: {item.ruleSnapshot.ruleLabel}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--amber"><IconHand /></div>
            <div>
              <div className="metric-label">Estimated CO₂e Avoided</div>
              <div className="metric-value" style={{ fontSize: 20 }}>
                <CarbonValue value={event?.co2eKg != null ? { kind: "value", kg: event.co2eKg } : value} />
              </div>
            </div>
            <div className="metric-foot">
              {event ? `Qualified event: ${event.type}` : "No qualifying event recorded yet"}
            </div>
          </div>
        </div>

        <div className="review-layout">
          <div className="stack">
            <Panel title="Record status">
              <div className="stack stack--sm">
                <div className="row">
                  <StatusBadge
                    label={
                      expired
                        ? "Expired"
                        : item.status === "Stored" && isExpiringSoon(item.expiresAt)
                          ? "Expiring Soon"
                          : item.status
                    }
                    variant={
                      expired
                        ? "danger"
                        : item.status === "Stored" && isExpiringSoon(item.expiresAt)
                          ? "warning"
                          : foodStatusVariant(item.status)
                    }
                  />
                  <Badge variant="info">{item.barcode}</Badge>
                </div>
                <SummaryList
                  rows={[
                    { label: "Food ID", value: item.id },
                    { label: "Owner", value: item.ownerLabel },
                    {
                      label: "Compartment",
                      value: item.compartmentLabel ?? "—",
                    },
                    { label: "Created / Stored At", value: formatDateTime(item.storedAt) },
                    { label: "Shelf-life rule applied", value: item.ruleSnapshot.ruleLabel },
                    {
                      label: "Photo",
                      value: item.photoLabel ? (
                        <PhotoThumb
                          name={item.photoLabel}
                          label={`${item.name} (${item.id})`}
                          size={56}
                          dataUrl={item.photoDataUrl}
                          onOpen={() => setPhotoOpen(true)}
                        />
                      ) : (
                        "—"
                      ),
                    },
                    {
                      label: "Mass verification",
                      value: <MassVerificationLine item={item} />,
                    },
                  ]}
                />
                <PolicyBox>
                  Expiry is calculated automatically from the category rule and
                  cannot be edited or extended by you or by a Manager. To store
                  the food again, register it as a new record with a fresh photo.
                </PolicyBox>
                <SafetyNotice>Demo shelf-life rules, not real food-safety guidance.</SafetyNotice>
              </div>
            </Panel>

            <Panel title="Allowed actions">
              <div className="stack stack--sm">
                {canCollect ? (
                  <button
                    type="button"
                    className="button button--primary button--block"
                    onClick={() => collectFood(item.id)}
                  >
                    <IconHand />
                    Record food retrieval (Collected)
                  </button>
                ) : (
                  <div className="confirmation-panel">
                    {role !== "User"
                      ? "Collection is a User action. A Manager can only inspect this record."
                      : !isOwner
                        ? "Collection is not available: this record is not owned by your account."
                        : expired
                          ? "Collection is not available: this record has expired."
                          : `Collection is not available: this record is already ${item.status.toLowerCase()}.`}
                  </div>
                )}
                {canDonate && role === "User" && (
                  <button
                    type="button"
                    className="button button--secondary button--block"
                    onClick={() => navigate({ name: "food-donation" })}
                  >
                    <IconGift />
                    Create a donation for this food
                  </button>
                )}
                {donation && (
                  <Notice title="Donation linked">
                    {donation.id} · status {donation.status}
                    {donation.allocatedTo ? ` · allocated to ${donation.allocatedTo}` : ""}
                  </Notice>
                )}
                {expired && (
                  <div className="scan-error">
                    This item is expired. Registration of expired food is
                    rejected — a new photo check is required before it can be
                    stored again.
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <div className="stack">
            <Panel
              title="Carbon calculation detail"
              description="Visible only to a signed-in, authorized user (§6.2)"
            >
              <div className="stack stack--sm">
                <SummaryList
                  rows={[
                    { label: "Initial mass", value: formatMass(item.massG) },
                    { label: "Converted mass", value: `${(item.massG / 1000).toFixed(2)} kg` },
                    {
                      label: "Emission factor",
                      value: resolution.factor
                        ? `${resolution.factor.factorP90} kg CO₂e/kg`
                        : <Badge variant="warning">Emission factor not configured</Badge>,
                    },
                    {
                      label: "Factor source and unit",
                      value: resolution.factor ? (
                        <span style={{ fontWeight: 400 }}>
                          {resolution.factor.sourceLabel}
                          <span className="cell-sub">{resolution.factor.unit}</span>
                        </span>
                      ) : (
                        "—"
                      ),
                    },
                    { label: "Formula", value: "(Food Mass (g) ÷ 1000) × Emission Factor" },
                    { label: "Estimated CO₂e", value: <CarbonValue value={value} /> },
                    {
                      label: "Period / date",
                      value: event ? formatDate(event.occurredAt) : formatDate(item.storedAt),
                    },
                    {
                      label: "Data status",
                      value:
                        resolution.state.kind === "valid" ? (
                          <Badge variant="success">Configured</Badge>
                        ) : resolution.state.kind === "unit-mismatch" ? (
                          <Badge variant="warning">Unable to calculate</Badge>
                        ) : (
                          <Badge variant="warning">Emission factor not configured</Badge>
                        ),
                    },
                    { label: "Methodology version", value: item.factorSnapshot.methodologyVersion },
                  ]}
                />
                {resolution.state.kind !== "valid" && (
                  <Notice title="Why no number is shown">{resolution.reason}</Notice>
                )}
                <AnalyticsNote
                  extra={
                    event?.type === "Collected"
                      ? "Food taken by a User is assumed to be consumed; this is not proof of actual consumption."
                      : undefined
                  }
                />
              </div>
            </Panel>

            <div className="stack stack--sm">
              <SimulationBanner>
                Photo freshness checks are simulated. Real AI freshness detection
                is not part of the initial scope.
              </SimulationBanner>
              <DetailLabelCard item={item} />
            </div>
          </div>
        </div>
      </div>

      {photoOpen && item.photoLabel && (
        <PhotoModal
          name={item.photoLabel}
          label={`${item.name} · ${item.id} · declared ${formatMass(item.massG)}`}
          dataUrl={item.photoDataUrl}
          onClose={() => setPhotoOpen(false)}
        />
      )}
    </AppShell>
  );
}

/**
 * One-line mass-verification status for the Food Detail summary list. When a
 * Manager corrected the mass, the original declared value is kept visible so
 * the change is always attributable.
 */
function MassVerificationLine({ item }: { item: FoodItem }) {
  const v = item.massVerification;
  if (v.status === "Pending") {
    return <Badge variant="warning">Pending Manager review</Badge>;
  }
  if (v.status === "Approved") {
    return (
      <span>
        <Badge variant="success">Approved by management</Badge>
        <span className="cell-sub">
          {v.reviewedBy} · {v.reviewedAt ? formatDateTime(v.reviewedAt) : "—"}
        </span>
      </span>
    );
  }
  return (
    <span>
      <Badge variant="info">Edited by management</Badge>
      <span className="cell-sub">
        Declared {v.declaredG.toLocaleString("en-US")} g → confirmed{" "}
        {(v.confirmedG ?? v.declaredG).toLocaleString("en-US")} g
        {v.reviewedBy ? ` · ${v.reviewedBy}` : ""}
        {v.note ? ` · ${v.note}` : ""}
      </span>
    </span>
  );
}

/* ---------------------------- Print label ----------------------------- */

export function PrintLabelPage() {
  const { session, food, navigate, route } = useStore();
  const id = route.name === "print-label" ? route.id : "";
  const [selected, setSelected] = useState(id);

  if (!session) return null;
  const mine = food.filter((f) => f.ownerUserId === session.userId);
  const list = mine.length > 0 ? mine : food;
  const item = list.find((f) => f.id === selected) ?? list[0];

  return (
    <AppShell title="Barcode / Print Label">
      <PageHead
        eyebrow="Role: User"
        title="Barcode / Print Label"
        description="Print a label for a record. The code encodes only a unique identifier."
        actions={
          <>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => window.print()}
            >
              <IconPrint />
              Print label
            </button>
            {item && (
              <button
                type="button"
                className="button button--primary"
                onClick={() => navigate({ name: "food-detail", id: item.id })}
              >
                Open Food Detail
              </button>
            )}
          </>
        }
      />

      <div className="stack">
        <SimulationBanner>
          Print output is simulated on screen. To scan this label with your
          camera, open <strong>Scan Barcode (camera)</strong> in the sidebar.
        </SimulationBanner>

        <div className="label-layout">
          <Panel title="Select a record">
            <div className="control">
              <label htmlFor="label-select">Food record</label>
              <select
                id="label-select"
                value={item?.id ?? ""}
                onChange={(e) => setSelected(e.target.value)}
              >
                {list.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.id}
                  </option>
                ))}
              </select>
              <span className="control-hint">
                Labels show the record ID, category and date only — no personal
                data is encoded.
              </span>
            </div>
          </Panel>

          <div className="stack stack--sm">
            {item ? (
              <DetailLabelCard item={item} />
            ) : (
              <EmptyState title="No record selected" />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
