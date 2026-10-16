/** Green Community pages: dashboard, donations, requests, received history. */
import { useState } from "react";
import { AppShell } from "../components/AppShell";
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
  foodStatusVariant,
  formatDate,
  formatDateTime,
  requestStatusVariant,
} from "../lib/format";
import type { Period } from "../lib/types";

/* ----------------------------- Dashboard ----------------------------- */

export function GcDashboardPage() {
  const { session, donations, requests, food, events, navigate } = useStore();
  const [period, setPeriod] = useState<Period>("Monthly");

  if (!session) return null;

  const open = donations.filter((d) => d.status === "Pending");
  const mine = requests.filter((r) => r.submittedBy === session.name);
  const approved = mine.filter((r) => r.status === "Approved" || r.status === "Completed");
  const completed = mine.filter((r) => r.status === "Completed");
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
                        <td>
                          <Badge variant="neutral">Counted only when distributed</Badge>
                        </td>
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
  const { session, donations, requests, food, submitRequest, navigate, setToast } =
    useStore();
  const [status, setStatus] = useState("Pending");

  if (!session) return null;
  const rows = donations.filter((d) => status === "All" || d.status === status);
  const mine = requests.filter((r) => r.submittedBy === session.name);

  return (
    <AppShell title="Available Food Waste / Donations">
      <PageHead
        eyebrow="Role: Green Community"
        title="Available Food Waste / Donations"
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
              <th scope="col" style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={7} text="No donations in this status." />}
            {rows.map((d) => {
              const items = food.filter((f) => d.foodIds.includes(f.id));
              const kg = items.reduce((s, f) => {
                const c = computeCarbon(f.massG, resolveForItem(f.category, f.subcategory, f.subtype));
                return s + (c.kind === "value" ? c.kg : 0);
              }, 0);
              const already = mine.find((r) => r.donationId === d.id);
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
  const { session, donations, requests, food, events, submitRequest, navigate } =
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
                  <QuantityHeader />
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
                      <td className="num-col">{formatMass(f.massG)}</td>
                      <td className="num-col">
                        <CarbonValue value={c} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
            <AnalyticsNote />
          </Panel>

          <div className="stack">
            <div className="estimate-card">
              <span className="eyebrow">Donation mass</span>
              <span className="estimate-value">{donation.massG.toLocaleString("en-US")} g</span>
              <span className="estimate-sub">
                Status {donation.status} · created {formatDateTime(donation.createdAt)}
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
                            <span className="cell-sub">{formatDateTime(e.occurredAt)}</span>
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

export function GcRequestsPage() {
  const { session, requests, donations, navigate } = useStore();
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
            {["All", "Pending", "Approved", "Rejected", "Completed"].map((s) => (
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
              <QuantityHeader />
              <th scope="col">Reason / note</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={7} text="No requests in this status." />}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="cell-strong">{r.label}</span>
                  <span className="cell-sub">{r.id} · {r.donationId}</span>
                </td>
                <td>
                  <StatusBadge label={r.status} variant={requestStatusVariant(r.status)} />
                </td>
                <td className="num-col">{formatDateTime(r.submittedAt)}</td>
                <td className="num-col">
                  {r.decidedAt ? formatDateTime(r.decidedAt) : "—"}
                </td>
                <td className="num-col">{formatMass(r.massG)}</td>
                <td>
                  <Badge variant={r.status === "Completed" ? "neutral" : "info"}>
                    {r.status === "Completed"
                      ? "Counted once when distributed"
                      : "Not counted until distributed"}
                  </Badge>
                </td>
                <td className="tiny">{r.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </AppShell>
  );
}

/* ------------------------- Received history -------------------------- */

export function GcHistoryPage() {
  const { session, donations, requests, events } = useStore();

  if (!session) return null;
  const completedIds = requests
    .filter((r) => r.submittedBy === session.name && r.status === "Completed")
    .map((r) => r.donationId);
  const received = donations.filter((d) => completedIds.includes(d.id));
  const foodIds = received.flatMap((d) => d.foodIds);
  const histEvents = events.filter((e) => foodIds.includes(e.foodId));

  const totalMass = received.reduce((s, d) => s + d.massG, 0);
  const totalCo2e = histEvents.reduce((s, e) => s + (e.co2eKg ?? 0), 0);
  const unresolved = histEvents.filter((e) => e.co2eKg === null).length;

  return (
    <AppShell title="Received / Distributed Food History">
      <PageHead
        eyebrow="Role: Green Community"
        title="Received / Distributed Food History"
        description="Food a Manager recorded as handed over to you, with the impact event written once per mass and outcome."
      />

      <div className="stack">
        <div className="metrics-grid metrics-grid--3">
          <div className="metric-card">
            <div className="metric-icon"><IconList /></div>
            <div>
              <div className="metric-label">Distributions received</div>
              <div className="metric-value">{received.length}</div>
            </div>
            <div className="metric-foot">Completed donations allocated to you</div>
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
                  <th scope="col">Completed</th>
                  <QuantityHeader />
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
                        {d.completedAt ? formatDateTime(d.completedAt) : "—"}
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
