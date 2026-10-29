/** Green Community pages: dashboard, food waste, requests, received history. */
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { Barcode } from "../components/Barcode";
import {
  AnalyticsNote,
  Badge,
  BarChart,
  CarbonValue,
  EmptyState,
  Notice,
  PageHead,
  Panel,
  PeriodFilter,
  QuantityHeader,
  SimulationBanner,
  StatusBadge,
  SummaryList,
  TableEmpty,
  TableWrap,
  Toolbar,
} from "../components/ui";
import { IconChart, IconGift, IconHand, IconList } from "../components/icons";
import { useStore } from "../lib/store";
import {
  bucketValue,
  chartBuckets,
  computeCarbon,
  formatCo2e,
  formatMass,
  periodLabel,
  resolveForItem,
} from "../lib/carbon";
import {
  donationStatusVariant,
  expiryDeltaLabel,
  foodStatusVariant,
  formatDate,
  formatDateTime,
  requestStatusVariant,
} from "../lib/format";
import type { FoodItem, GcRequest, Period } from "../lib/types";

/* ---------------- Expiry status (food waste / surplus) ---------------- */

/**
 * §GC flow: expired food is food waste, food inside its shelf life is surplus
 * food. The badge states which, and how many days past (waste) or before
 * (surplus) the expiry date the record sits.
 */
function ExpiryBadge({ item }: { item: FoodItem }) {
  const delta = expiryDeltaLabel(item.expiresAt);
  return delta.expired ? (
    <span>
      <Badge variant="danger">Food waste — expired</Badge>
      <span className="cell-sub">{delta.label}</span>
    </span>
  ) : (
    <span>
      <Badge variant="success">Surplus food</Badge>
      <span className="cell-sub">{delta.label}</span>
    </span>
  );
}

/** The waste-bank detail line shown for expired food waste. */
function WasteBankDetail() {
  return (
    <span className="tiny">
      Managed by the Manager and stored at the waste bank — delivery details
      follow via email.
    </span>
  );
}

/**
 * The pickup-barcode detail for surplus food. When the Manager approved the
 * request, a new scannable barcode was issued and the record's previous
 * barcode was deactivated, so the requester collects the food with the new
 * code. The issued code is drawn as a real Code 128 barcode for handover.
 */
function PickupDetail({
  item,
  request,
}: {
  item: FoodItem;
  request?: GcRequest;
}) {
  const issued = request?.pickupBarcode;
  if (issued && issued.replaces.includes(item.barcode)) {
    return (
      <span>
        <Barcode code={issued.code} />
        <span className="cell-sub">
          Pickup barcode — show this at handover. Previous barcode {item.barcode}{" "}
          was deactivated and no longer scans.
        </span>
      </span>
    );
  }
  if (request && (request.status === "Approved" || request.status === "Distributed")) {
    return <span className="tiny">Collect with the Manager at handover.</span>;
  }
  return (
    <span className="tiny">
      A pickup barcode is issued when the Manager approves the request.
    </span>
  );
}

/** Donation-level expiry summary over its items. */
function donationExpiry(items: FoodItem[]): {
  expired: number;
  edible: number;
  worst: FoodItem | undefined;
} {
  const expired = items.filter(
    (f) => expiryDeltaLabel(f.expiresAt).expired,
  );
  const edible = items.filter((f) => !expiryDeltaLabel(f.expiresAt).expired);
  // The most urgent item drives the label: nearest expiry among surplus,
  // or the longest-expired one when everything is waste.
  const worst = [...items].sort(
    (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
  )[0];
  return { expired: expired.length, edible: edible.length, worst };
}

/* ----------------------------- Dashboard ----------------------------- */

export function GcDashboardPage() {
  const { session, donations, requests, food, events, navigate, timezone } = useStore();
  const [period, setPeriod] = useState<Period>("Monthly");

  if (!session) return null;

  const open = donations.filter((d) => d.status === "Pending");
  const mine = requests.filter((r) => r.submittedBy === session.name);
  const approved = mine.filter((r) => r.status === "Approved" || r.status === "Distributed");
  const completed = mine.filter((r) => r.status === "Distributed");
  const receivedMass = completed.reduce((s, r) => s + r.massG, 0);

  const myFoodIds = new Set(
    donations
      .filter((d) => d.allocatedTo === session.name)
      .flatMap((d) => d.foodIds),
  );
  const myEvents = events.filter((e) => myFoodIds.has(e.foodId));
  const co2eTotal = myEvents.reduce((s, e) => s + (e.co2eKg ?? 0), 0);
  const unresolved = myEvents.filter((e) => e.co2eKg === null).length;

  const buckets = chartBuckets(period);
  const chartData = buckets.map((b) => ({
    label: b.label,
    value: myEvents
      .filter((e) => bucketValue(e.occurredAt, b) && e.co2eKg !== null)
      .reduce((s, e) => s + (e.co2eKg ?? 0), 0),
  }));

  return (
    <AppShell title="Green Community Dashboard">
      <PageHead
        eyebrow="Role: Green Community"
        title="Green Community Dashboard"
        description="Donations you can request, the status of your requests, and the food actually received."
        actions={<PeriodFilter value={period} onChange={setPeriod} />}
      />

      <div className="stack">
        <SimulationBanner>
          Aggregate demo data. Received-mass figures reflect what a Manager
          recorded as handed over — not a sensor reading.
        </SimulationBanner>

        <div className="metrics-grid metrics-grid--4">
          <div className="metric-card">
            <div className="metric-icon"><IconGift /></div>
            <div>
              <div className="metric-label">Open donations</div>
              <div className="metric-value">{open.length}</div>
            </div>
            <div className="metric-foot">Available to request now</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--blue"><IconHand /></div>
            <div>
              <div className="metric-label">My requests</div>
              <div className="metric-value">{mine.length}</div>
            </div>
            <div className="metric-foot">{approved.length} approved or completed</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--amber"><IconList /></div>
            <div>
              <div className="metric-label">Received mass</div>
              <div className="metric-value">
                {receivedMass.toLocaleString("en-US")}
                <small>g</small>
              </div>
            </div>
            <div className="metric-foot">{completed.length} completed distributions</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><IconChart /></div>
            <div>
              <div className="metric-label">Estimated CO₂e avoided</div>
              <div className="metric-value">
                {co2eTotal > 0 ? formatCo2e(Math.round(co2eTotal * 100) / 100) : "—"}
              </div>
            </div>
            <div className="metric-foot">
              {unresolved > 0
                ? `${unresolved} event(s) without a usable factor`
                : "Qualified events only"}
            </div>
          </div>
        </div>

        <div className="report-grid">
          <Panel
            title="Estimated CO₂e by period"
            description={`${periodLabel(period)} · food allocated to you`}
          >
            <BarChart data={chartData} unit="kg CO₂e" />
            <AnalyticsNote />
          </Panel>

          <Panel
            title="Pending requests"
            description="Waiting for Manager review"
            action={
              <button
                type="button"
                className="button button--secondary button--sm"
                onClick={() => navigate({ name: "gc-requests" })}
              >
                All requests
              </button>
            }
          >
            {mine.filter((r) => r.status === "Pending").length === 0 ? (
              <EmptyState title="No pending requests" hint="Request an open donation to get started." />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <th scope="col">Request</th>
                    <th scope="col">Status</th>
                    <QuantityHeader />
                  </tr>
                </thead>
                <tbody>
                  {mine
                    .filter((r) => r.status === "Pending")
                    .map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="cell-strong">{r.label}</span>
                          <span className="cell-sub">{r.id} · {r.donationId}</span>
                        </td>
                        <td>
                          <StatusBadge label={r.status} variant={requestStatusVariant(r.status)} />
                        </td>
                        <td className="num-col">{formatMass(r.massG)}</td>
                      </tr>
                    ))}
                </tbody>
              </TableWrap>
            )}
          </Panel>
        </div>

        <Panel
          title="Open donations"
          description="Pending donations you can request"
          action={
            <button
              type="button"
              className="button button--primary button--sm"
              onClick={() => navigate({ name: "gc-donations" })}
            >
              Browse all
            </button>
          }
        >
          {open.length === 0 ? (
            <EmptyState title="No open donations right now" />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col">Donation</th>
                  <th scope="col">Offered by</th>
                  <th scope="col">Created</th>
                  <QuantityHeader />
                  <th scope="col">Estimated CO₂e</th>
                  <th scope="col" style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {open.map((d) => {
                  const items = food.filter((f) => d.foodIds.includes(f.id));
                  const kg = items.reduce((s, f) => {
                    const c = computeCarbon(f.massG, resolveForItem(f.category, f.subcategory, f.subtype));
                    return s + (c.kind === "value" ? c.kg : 0);
                  }, 0);
                  return (
                    <tr key={d.id}>
                      <td>
                        <span className="cell-strong">{d.label}</span>
                        <span className="cell-sub">{d.id} · {d.foodIds.join(", ")}</span>
                      </td>
                      <td className="num-col">{d.createdBy}</td>
                      <td className="num-col">{formatDate(d.createdAt, timezone)}</td>
                      <td className="num-col">{formatMass(d.massG)}</td>
                      <td className="num-col">
                        {kg > 0 ? (
                          <CarbonValue value={{ kind: "value", kg: Math.round(kg * 100) / 100 }} />
                        ) : (
                          <Badge variant="warning">Emission factor not configured</Badge>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button button--secondary button--sm"
                            onClick={() => navigate({ name: "gc-donation-detail", id: d.id })}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

/* ------------------------- Available donations ------------------------ */

export function GcDonationsPage() {
  const { session, donations, requests, food, submitRequest, navigate, setToast, timezone } =
    useStore();
  const [status, setStatus] = useState("Pending");

  if (!session) return null;
  const rows = donations.filter((d) => status === "All" || d.status === status);
  const mine = requests.filter((r) => r.submittedBy === session.name);

  return (
    <AppShell title="Available Food Waste/Surplus Food">
      <PageHead
        eyebrow="Role: Green Community"
        title="Available Food Waste/Surplus Food"
        description="Browse donations offered by Users. Submit a request for anything you can still use — a Manager reviews and records the actual handover."
      />

      <div className="stack">
        <SimulationBanner>
          Requests created here stay in memory. Manager approval and distribution
          are performed on the Manager pages.
        </SimulationBanner>

        <Toolbar>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            {["Pending", "Completed", "Cancelled", "All"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="tiny">{rows.length} of {donations.length} donations</span>
        </Toolbar>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">Donation</th>
              <th scope="col">Status</th>
              <th scope="col">Offered by</th>
              <th scope="col">Created</th>
              <QuantityHeader />
              <th scope="col">Estimated CO₂e</th>
              <th scope="col">Expiry status</th>
              <th scope="col">Detail</th>
              <th scope="col" style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={9} text="No donations in this status." />}
            {rows.map((d) => {
              const items = food.filter((f) => d.foodIds.includes(f.id));
              const kg = items.reduce((s, f) => {
                const c = computeCarbon(f.massG, resolveForItem(f.category, f.subcategory, f.subtype));
                return s + (c.kind === "value" ? c.kg : 0);
              }, 0);
              const already = mine.find((r) => r.donationId === d.id);
              const expiry = donationExpiry(items);
              return (
                <tr key={d.id}>
                  <td>
                    <span className="cell-strong">{d.label}</span>
                    <span className="cell-sub">{d.id} · {d.foodIds.join(", ")}</span>
                  </td>
                  <td>
                    <StatusBadge label={d.status} variant={donationStatusVariant(d.status)} />
                  </td>
                  <td className="num-col">{d.createdBy}</td>
                  <td className="num-col">{formatDate(d.createdAt)}</td>
                  <td className="num-col">{formatMass(d.massG)}</td>
                  <td className="num-col">
                    {kg > 0 ? (
                      <CarbonValue value={{ kind: "value", kg: Math.round(kg * 100) / 100 }} />
                    ) : (
                      <Badge variant="warning">Emission factor not configured</Badge>
                    )}
                  </td>
                  <td>
                    {expiry.expired > 0 && expiry.edible > 0 ? (
                      <span>
                        <Badge variant="warning">Mixed</Badge>
                        <span className="cell-sub">
                          {expiry.edible} surplus · {expiry.expired} expired
                        </span>
                      </span>
                    ) : expiry.worst ? (
                      <ExpiryBadge item={expiry.worst} />
                    ) : (
                      <span className="tiny">—</span>
                    )}
                  </td>
                  <td>
                    {/* Link to the Pickup Barcode page instead of drawing a
                        barcode inside the cell. */}
                    {already?.pickupBarcode && items.length > 0 ? (
                      <button
                        type="button"
                        className="button button--secondary button--sm"
                        onClick={() =>
                          navigate({ name: "gc-pickup-barcode", id: already.id })
                        }
                      >
                        Pickup barcode
                      </button>
                    ) : items.some((f) => expiryDeltaLabel(f.expiresAt).expired) ? (
                      <WasteBankDetail />
                    ) : items.length > 0 ? (
                      <PickupDetail item={items[0]} request={already} />
                    ) : (
                      <span className="tiny">—</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="button button--secondary button--sm"
                        onClick={() => navigate({ name: "gc-donation-detail", id: d.id })}
                      >
                        View
                      </button>
                      {d.status === "Pending" &&
                        (already ? (
                          <Badge variant={requestStatusVariant(already.status)}>
                            Request {already.status}
                          </Badge>
                        ) : (
                          <button
                            type="button"
                            className="button button--primary button--sm"
                            onClick={() => submitRequest(d.id)}
                          >
                            Request
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>

        <Notice title="How to read the expiry status">
          <div className="stack stack--sm">
            <div>
              The expiry badge on every listing states which of the two the
              food is, and how many days past or before the expiry date it
              sits.
            </div>
            <div>
              <strong>Food waste — expired:</strong> managed by the Manager and
              stored at the waste bank. Delivery details follow via email; it
              is not collectible with a barcode.
            </div>
            <div>
              <strong>Surplus food — not yet expired:</strong> collectible with
              the pickup barcode issued at Manager approval. Issuing it
              deactivates the record's previous barcode — the old code no
              longer scans.
            </div>
          </div>
        </Notice>

        <Notice title="Requesting is not receiving">
          A request only records your intent. The donation is allocated after a
          Manager approves it, and the impact is written once when the mass is
          actually handed over.
        </Notice>
      </div>
    </AppShell>
  );
}

/* ------------------------- Donation detail --------------------------- */

export function GcDonationDetailPage({ id }: { id: string }) {
  const { session, donations, requests, food, events, submitRequest, navigate, timezone } =
    useStore();

  if (!session) return null;
  const donation = donations.find((d) => d.id === id);
  if (!donation) {
    return (
      <AppShell title="Donation not found">
        <EmptyState
          title="Donation not found"
          hint="This donation may have been cancelled or removed."
        />
      </AppShell>
    );
  }

  const items = food.filter((f) => donation.foodIds.includes(f.id));
  const myRequest = requests.find(
    (r) => r.donationId === donation.id && r.submittedBy === session.name,
  );
  const distributed = events.filter((e) =>
    donation.foodIds.includes(e.foodId) && e.type === "Distributed",
  );

  return (
    <AppShell title={`Donation ${donation.id}`}>
      <PageHead
        eyebrow="Role: Green Community"
        title={donation.label}
        description={`${donation.id} · offered by ${donation.createdBy}`}
        actions={
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate({ name: "gc-donations" })}
          >
            Back to donations
          </button>
        }
      />

      <div className="stack">
        <div className="form-layout">
          <Panel title="Food included">
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col">Record</th>
                  <th scope="col">Status</th>
                  <th scope="col">Expiry status</th>
                  <QuantityHeader />
                  <th scope="col">Estimated CO₂e</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <TableEmpty colSpan={5} text="No food records linked to this donation." />
                )}
                {items.map((f) => {
                  const c = computeCarbon(f.massG, resolveForItem(f.category, f.subcategory, f.subtype));
                  return (
                    <tr key={f.id}>
                      <td>
                        <span className="cell-strong">{f.name}</span>
                        <span className="cell-sub">
                          {f.id} · {f.category} · {f.subcategory}
                          {f.subtype ? ` · ${f.subtype}` : ""}
                        </span>
                      </td>
                      <td>
                        <StatusBadge label={f.status} variant={foodStatusVariant(f.status)} />
                      </td>
                      <td>
                        <ExpiryBadge item={f} />
                      </td>
                      <td className="num-col">{formatMass(f.massG)}</td>
                      <td className="num-col">
                        <CarbonValue value={c} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>

            {items.some((f) => expiryDeltaLabel(f.expiresAt).expired) && (
              <Notice title="Expired food waste">
                Expired records in this donation are managed by the Manager and
                stored at the waste bank — you will be informed further by
                email about the delivery.
              </Notice>
            )}
            {myRequest?.pickupBarcode && (
              <Notice title="Pickup barcode issued">
                Manager approval issued pickup barcode{" "}
                <strong>{myRequest.pickupBarcode.code}</strong> for the surplus
                food. The previous record barcode(s){" "}
                {myRequest.pickupBarcode.replaces.join(", ")} were deactivated
                — collect the food with the new code.
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="button button--secondary button--sm"
                    onClick={() =>
                      navigate({
                        name: "gc-pickup-barcode",
                        id: myRequest.id,
                      })
                    }
                  >
                    Open Pickup Barcode page
                  </button>
                </div>
              </Notice>
            )}
            <AnalyticsNote />
          </Panel>

          <div className="stack">
            <div className="estimate-card">
              <span className="eyebrow">Donation mass</span>
              <span className="estimate-value">{donation.massG.toLocaleString("en-US")} g</span>
              <span className="estimate-sub">
                Status {donation.status} · created {formatDateTime(donation.createdAt, timezone)}
              </span>
            </div>

            <SummaryList
              rows={[
                { label: "Donation ID", value: donation.id },
                { label: "Status", value: <StatusBadge label={donation.status} variant={donationStatusVariant(donation.status)} /> },
                { label: "Offered by", value: donation.createdBy },
                { label: "Allocated to", value: donation.allocatedTo ?? "Not allocated yet" },
                { label: "Note", value: donation.note ?? "—" },
                {
                  label: "Your request",
                  value: myRequest ? (
                    <StatusBadge label={myRequest.status} variant={requestStatusVariant(myRequest.status)} />
                  ) : (
                    "None yet"
                  ),
                },
              ]}
            />

            {donation.status === "Pending" &&
              (myRequest ? (
                <Notice title="Request already submitted">
                  Your request {myRequest.id} is {myRequest.status}. A Manager
                  reviews it before any allocation.
                </Notice>
              ) : (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => submitRequest(donation.id)}
                >
                  <IconHand />
                  Request this donation
                </button>
              ))}

            {donation.status === "Completed" && (
              <Panel title="Distribution record">
                {distributed.length === 0 ? (
                  <EmptyState title="No impact event for this donation" />
                ) : (
                  <TableWrap>
                    <thead>
                      <tr>
                        <th scope="col">Item</th>
                        <QuantityHeader />
                      </tr>
                    </thead>
                    <tbody>
                      {distributed.map((e) => (
                        <tr key={e.id}>
                          <td>
                            <span className="cell-strong">{e.label}</span>
                            <span className="cell-sub">{formatDateTime(e.occurredAt, timezone)}</span>
                          </td>
                          <td className="num-col">{formatMass(e.massG)}</td>
                          <td className="num-col">
                            <CarbonValue
                              value={
                                e.co2eKg != null
                                  ? { kind: "value", kg: e.co2eKg }
                                  : e.factorState.kind === "unit-mismatch"
                                    ? { kind: "unable" }
                                    : { kind: "not-configured" }
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrap>
                )}
              </Panel>
            )}

            {donation.status === "Cancelled" && (
              <Notice title="Donation cancelled">
                This donation was cancelled by the donor. No impact event was
                created and no mass is counted.
              </Notice>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* --------------------------- My requests ----------------------------- */

/** CO₂e for a request's donation, from the items' Distributed events. */
function requestCo2e(
  items: FoodItem[],
  events: { foodId: string; type: string; co2eKg: number | null }[],
): { kind: "value"; kg: number } | { kind: "none" } | { kind: "pending" } {
  const ids = new Set(items.map((f) => f.id));
  const distributed = events.filter(
    (e) => ids.has(e.foodId) && e.type === "Distributed",
  );
  if (distributed.length === 0) return { kind: "pending" };
  const kg = distributed.reduce((s, e) => s + (e.co2eKg ?? 0), 0);
  if (kg <= 0) return { kind: "none" };
  return { kind: "value", kg: Math.round(kg * 100) / 100 };
}

export function GcRequestsPage() {
  const { session, requests, donations, food, events, navigate, timezone } = useStore();
  const [status, setStatus] = useState("All");

  if (!session) return null;
  const mine = requests.filter((r) => r.submittedBy === session.name);
  const rows = mine.filter((r) => status === "All" || r.status === status);

  return (
    <AppShell title="My Requests / Request Status">
      <PageHead
        eyebrow="Role: Green Community"
        title="My Requests / Request Status"
        description="Every request you have submitted and its current decision. Statuses are recorded — a rejected request is not retried automatically."
      />

      <div className="stack">
        <Toolbar>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            {["All", "Pending", "Approved", "Rejected", "Distributed"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="tiny">{rows.length} of {mine.length} requests</span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => navigate({ name: "gc-donations" })}
          >
            Browse donations
          </button>
        </Toolbar>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">Request</th>
              <th scope="col">Status</th>
              <th scope="col">Submitted</th>
              <th scope="col">Decided</th>
              <th scope="col">Locker record</th>
              <QuantityHeader />
              <th scope="col">Estimated CO₂e</th>
              <th scope="col">Contact (address · email)</th>
              <th scope="col">Expiry status</th>
              <th scope="col">Detail</th>
              <th scope="col">Reason / note</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={11} text="No requests in this status." />}
            {rows.map((r) => {
              const donation = donations.find((d) => d.id === r.donationId);
              const items = donation
                ? food.filter((f) => donation.foodIds.includes(f.id))
                : [];
              const expiry = donationExpiry(items);
              const co2e = requestCo2e(items, events);
              const lockerLabel = items.find((f) => f.compartmentLabel)?.compartmentLabel;
              return (
                <tr key={r.id}>
                  <td>
                    <span className="cell-strong">{r.label}</span>
                    <span className="cell-sub">
                      {r.id} · {r.donationId}
                      {items[0] ? ` · ${items[0].id}` : ""}
                    </span>
                  </td>
                  <td>
                    <StatusBadge label={r.status} variant={requestStatusVariant(r.status)} />
                  </td>
                  <td className="num-col">{formatDateTime(r.submittedAt, timezone)}</td>
                  <td className="num-col">
                    {r.decidedAt ? formatDateTime(r.decidedAt, timezone) : "—"}
                  </td>
                  <td className="num-col">
                    {lockerLabel ? (
                      <span>
                        <span className="cell-strong">{lockerLabel}</span>
                        <span className="cell-sub">{items[0]?.id}</span>
                      </span>
                    ) : items[0] ? (
                      <span className="cell-sub">{items[0].id}</span>
                    ) : (
                      <span className="tiny">—</span>
                    )}
                  </td>
                  <td className="num-col">{formatMass(r.massG)}</td>
                  <td>
                    {co2e.kind === "value" ? (
                      <CarbonValue value={{ kind: "value", kg: co2e.kg }} />
                    ) : co2e.kind === "pending" ? (
                      <Badge variant="neutral">Not counted until distributed</Badge>
                    ) : (
                      <Badge variant="warning">Emission factor not configured</Badge>
                    )}
                  </td>
                  <td className="tiny">
                    {r.contactAddress ?? "—"}
                    <span className="cell-sub">{r.contactEmail ?? "—"}</span>
                  </td>
                  <td>
                    {expiry.worst ? <ExpiryBadge item={expiry.worst} /> : <span className="tiny">—</span>}
                  </td>
                  <td>
                    {/* The scannable code lives on the Pickup Barcode page —
                        the cell only links to it. An issued barcode outranks
                        the expiry branch. */}
                    {r.pickupBarcode && items.length > 0 ? (
                      <button
                        type="button"
                        className="button button--secondary button--sm"
                        onClick={() =>
                          navigate({ name: "gc-pickup-barcode", id: r.id })
                        }
                      >
                        Pickup barcode
                      </button>
                    ) : items.some((f) => expiryDeltaLabel(f.expiresAt).expired) ? (
                      <WasteBankDetail />
                    ) : items.length > 0 ? (
                      <PickupDetail item={items[0]} request={r} />
                    ) : (
                      <span className="tiny">—</span>
                    )}
                  </td>
                  <td className="tiny">{r.reason ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </div>
    </AppShell>
  );
}

/* --------------------------- Pickup barcode --------------------------- */

/**
 * Pickup-barcode page for the Green Community, mirroring the User's
 * "Barcode / Print Label" page: one request selected from
 * My Requests / Request Status, one full-size scannable label — not a
 * barcode squeezed into a table cell.
 */
export function GcPickupBarcodePage({ id }: { id?: string }) {
  const { session, requests, food, donations, navigate, timezone } = useStore();
  const [selected, setSelected] = useState(id ?? "");

  if (!session) return null;
  const mine = requests.filter((r) => r.submittedBy === session.name);
  // Deep-linked id wins; otherwise default to the newest request that
  // already carries a pickup barcode, so the page opens ready to print.
  const initial =
    mine.find((r) => r.id === (selected || id)) ??
    mine.find((r) => r.pickupBarcode) ??
    mine[0];
  const current = mine.find((r) => r.id === (selected || id)) ?? initial;

  if (mine.length === 0) {
    return (
      <AppShell title="Pickup Barcode">
        <PageHead
          eyebrow="Role: Green Community"
          title="Pickup Barcode"
          description="The scannable code for each of your approved requests."
        />
        <EmptyState
          title="No requests yet"
          hint="Request an open donation — after Manager approval the pickup barcode appears here."
        />
        <div className="button-row" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate({ name: "gc-donations" })}
          >
            Browse donations
          </button>
        </div>
      </AppShell>
    );
  }

  const donation = current
    ? donations.find((d) => d.id === current.donationId)
    : undefined;
  const items = donation
    ? food.filter((f) => donation.foodIds.includes(f.id))
    : [];
  const issued = current?.pickupBarcode;

  return (
    <AppShell title="Pickup Barcode">
      <PageHead
        eyebrow="Role: Green Community"
        title="Pickup Barcode"
        description="The barcode that matches each request in My Requests / Request Status. Show the code for the selected request at handover."
      />

      <div className="stack">
        <SimulationBanner>
          Barcodes are generated by the demo (Code 128). Scanning is exercised
          on the Scan Barcode page; the pickup code replaces the record's
          previous barcode at Manager approval.
        </SimulationBanner>

        <div className="label-layout">
          <Panel title="Select a request" description="From My Requests / Request Status">
            <div className="control">
              <label htmlFor="pickup-select">Request</label>
              <select
                id="pickup-select"
                value={current?.id ?? ""}
                onChange={(e) => setSelected(e.target.value)}
              >
                {mine.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.label} ({r.status})
                  </option>
                ))}
              </select>
              <span className="control-hint">
                A pickup barcode is issued when the Manager approves the
                request; it stays valid for the completed handover.
              </span>
            </div>

            {current && (
              <SummaryList
                rows={[
                  { label: "Request", value: `${current.id} · ${current.status}` },
                  { label: "Donation", value: `${current.donationId}${donation ? ` · ${donation.status}` : ""}` },
                  {
                    label: "Food record",
                    value: items[0] ? `${items[0].id} · ${items[0].name}` : "—",
                  },
                  { label: "Quantity", value: formatMass(current.massG) },
                ]}
              />
            )}

            {current && !issued && (
              <Notice title="No pickup barcode yet">
                {current.status === "Pending"
                  ? "This request is waiting for Manager review — the barcode is issued at approval."
                  : current.status === "Rejected"
                    ? "This request was rejected, so no pickup barcode was issued."
                    : "This request has no pickup barcode recorded."}
              </Notice>
            )}

            {issued && (
              <Notice title="Replaced barcode">
                The record's previous barcode{" "}
                <strong>{issued.replaces.join(", ")}</strong> was deactivated
                when this pickup barcode was issued — the old code no longer
                scans.
              </Notice>
            )}
          </Panel>

          <div className="stack stack--sm">
            {current && issued ? (
              <div className="label-card">
                <div className="stack stack--sm">
                  <span className="brand" style={{ fontSize: 18 }}>
                    <span className="brand-mark" style={{ width: 22, height: 22, fontSize: 11 }}>
                      S
                    </span>
                    SmartSave
                  </span>
                  <div>
                    <div className="label-name">{current.label}</div>
                    <div className="label-meta" style={{ marginTop: 8 }}>
                      <span>Request: {current.id}</span>
                      <span>Donation: {current.donationId}</span>
                      {items[0] && <span>Food ID: {items[0].id}</span>}
                      <span>Quantity: {formatMass(current.massG)}</span>
                      <span>Status: {current.status}</span>
                    </div>
                  </div>
                  <Barcode code={issued.code} />
                  <p className="contribution-message">
                    Pickup barcode — show this at handover.
                    {donation?.allocatedTo ? ` Allocated to ${donation.allocatedTo}.` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No barcode for this request"
                hint={
                  current?.status === "Rejected"
                    ? "Rejected requests never receive a pickup barcode."
                    : "The scannable label appears here as soon as the Manager approves the request."
                }
              />
            )}
          </div>
        </div>

        <div className="button-row">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate({ name: "gc-requests" })}
          >
            Open My Requests / Request Status
          </button>
        </div>
      </div>
    </AppShell>
  );
}

/* ------------------------- Received history -------------------------- */

export function GcHistoryPage() {
  const { session, donations, requests, events, timezone } = useStore();

  if (!session) return null;
  const completedIds = requests
    .filter((r) => r.submittedBy === session.name && r.status === "Distributed")
    .map((r) => r.donationId);
  const received = donations.filter((d) => completedIds.includes(d.id));
  const foodIds = received.flatMap((d) => d.foodIds);
  const histEvents = events.filter((e) => foodIds.includes(e.foodId));

  const totalMass = received.reduce((s, d) => s + d.massG, 0);
  const totalCo2e = histEvents.reduce((s, e) => s + (e.co2eKg ?? 0), 0);
  const unresolved = histEvents.filter((e) => e.co2eKg === null).length;

  return (
    <AppShell title="Received Surplus Food/Food waste History">
      <PageHead
        eyebrow="Role: Green Community"
        title="Received Surplus Food/Food waste History"
        description="Surplus food and food waste a Manager recorded as handed over to you, with the impact event written once per mass and outcome."
      />

      <div className="stack">
        <div className="metrics-grid metrics-grid--3">
          <div className="metric-card">
            <div className="metric-icon"><IconList /></div>
            <div>
              <div className="metric-label">Distributions received</div>
              <div className="metric-value">{received.length}</div>
            </div>
            <div className="metric-foot">Distributed donations allocated to you</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--blue"><IconGift /></div>
            <div>
              <div className="metric-label">Mass received</div>
              <div className="metric-value">
                {totalMass.toLocaleString("en-US")}
                <small>g</small>
              </div>
            </div>
            <div className="metric-foot">Recorded by a Manager at handover</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><IconChart /></div>
            <div>
              <div className="metric-label">Estimated CO₂e avoided</div>
              <div className="metric-value">
                {totalCo2e > 0 ? formatCo2e(Math.round(totalCo2e * 100) / 100) : "—"}
              </div>
            </div>
            <div className="metric-foot">
              {unresolved > 0 ? `${unresolved} event(s) without a usable factor` : "All events calculated"}
            </div>
          </div>
        </div>

        <Panel title="Received donations">
          {received.length === 0 ? (
            <EmptyState
              title="No completed distributions yet"
              hint="Request an open donation — after Manager approval and handover it appears here."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col">Donation</th>
                  <th scope="col">Distributed</th>
                  <QuantityHeader />
                  <th scope="col">Estimated CO₂e</th>
                </tr>
              </thead>
              <tbody>
                {received.map((d) => {
                  const evs = histEvents.filter((e) => d.foodIds.includes(e.foodId));
                  const kg = evs.reduce((s, e) => s + (e.co2eKg ?? 0), 0);
                  return (
                    <tr key={d.id}>
                      <td>
                        <span className="cell-strong">{d.label}</span>
                        <span className="cell-sub">{d.id} · from {d.createdBy}</span>
                      </td>
                      <td className="num-col">
                        {d.completedAt ? formatDateTime(d.completedAt, timezone) : "—"}
                      </td>
                      <td className="num-col">{formatMass(d.massG)}</td>
                      <td className="num-col">
                        {kg > 0 ? (
                          <CarbonValue value={{ kind: "value", kg: Math.round(kg * 100) / 100 }} />
                        ) : evs.some((e) => e.factorState.kind === "unit-mismatch") ? (
                          <CarbonValue value={{ kind: "unable" }} />
                        ) : (
                          <CarbonValue value={{ kind: "not-configured" }} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
          <AnalyticsNote />
        </Panel>

        <Notice title="Consumption is not assumed here">
          As a Green Community you record distribution — that the mass was handed
          over. How the food was subsequently used is outside this platform and is
          never presented as measured consumption.
        </Notice>
      </div>
    </AppShell>
  );
}
