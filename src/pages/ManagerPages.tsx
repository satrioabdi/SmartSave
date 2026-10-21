/** Manager pages: dashboard, users, config, donations, requests, monitoring, logs, reports. */
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  AnalyticsNote,
  Badge,
  BarChart,
  CarbonValue,
  EmptyState,
  Field,
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
import {
  IconAlert,
  IconBox,
  IconCamera,
  IconChart,
  IconClock,
  IconDownload,
  IconFile,
  IconGift,
  IconHand,
  IconLeaf,
  IconList,
  IconSearch,
} from "../components/icons";
import { useStore } from "../lib/store";
import {
  bucketValue,
  chartBuckets,
  formatCo2e,
  formatMass,
  periodLabel,
} from "../lib/carbon";
import {
  downloadCsv,
  donationStatusVariant,
  effectiveFoodStatus,
  foodStatusVariant,
  formatDate,
  formatDateTime,
  relativeTime,
  requestStatusVariant,
  roleVariant,
} from "../lib/format";
import { CATEGORIES, FACTORS, METHODOLOGY, SHELF_LIFE_DISCLAIMER } from "../data/catalog";
import {
  compartmentLabel,
  compartmentOccupancy,
  compartmentOccupants,
  remainingCapacity,
} from "../data/compartments";
import type { CompartmentStatus, Period, Account } from "../lib/types";
import type { Route } from "../lib/store";

/* ---------------------------- Dashboard ------------------------------ */

export function ManagerDashboardPage() {
  const { food, donations, requests, events, notifications, logs, navigate } =
    useStore();
  const [period, setPeriod] = useState<Period>("Monthly");

  const expiring = food.filter((f) => {
    const h = (new Date(f.expiresAt).getTime() - Date.now()) / 3600000;
    return h > 0 && h <= 24 && effectiveFoodStatus(f.status, f.expiresAt) === "Stored";
  });
  const expired = food.filter(
    (f) => effectiveFoodStatus(f.status, f.expiresAt) === "Expired",
  );
  const pendingDonations = donations.filter((d) => d.status === "Pending");
  const pendingRequests = requests.filter((r) => r.status === "Pending");

  const counted = events.filter((e) => e.co2eKg !== null);
  const unresolved = events.filter((e) => e.co2eKg === null);
  const totalCo2e = counted.reduce((s, e) => s + (e.co2eKg ?? 0), 0);
  const massHandled = events.reduce((s, e) => s + e.massG, 0);

  const buckets = chartBuckets(period);
  const chartData = buckets.map((b) => ({
    label: b.label,
    value: counted
      .filter((e) => bucketValue(e.occurredAt, b))
      .reduce((s, e) => s + (e.co2eKg ?? 0), 0),
  }));

  return (
    <AppShell title="Manager Dashboard">
      <PageHead
        eyebrow="Role: Manager"
        title="Manager Dashboard"
        description="Operational overview of inventory, donations, requests and the environmental totals reported for the selected period."
        actions={<PeriodFilter value={period} onChange={setPeriod} />}
      />

      <div className="stack">
        <SimulationBanner>
          All figures are estimates from configured emission factors and demo
          data. This prototype has no live sensor or scheduler.
        </SimulationBanner>

        <div className="metrics-grid metrics-grid--4">
          <div className="metric-card">
            <div className="metric-icon"><IconBox /></div>
            <div>
              <div className="metric-label">Active inventory</div>
              <div className="metric-value">
                {food.filter(
                  (f) => effectiveFoodStatus(f.status, f.expiresAt) === "Stored",
                ).length}
              </div>
            </div>
            <div className="metric-foot">{food.length} records in total</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--amber"><IconGift /></div>
            <div>
              <div className="metric-label">Pending donations</div>
              <div className="metric-value">{pendingDonations.length}</div>
            </div>
            <div className="metric-foot">
              {formatMass(pendingDonations.reduce((s, d) => s + d.massG, 0))} offered
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--blue"><IconHand /></div>
            <div>
              <div className="metric-label">Requests to review</div>
              <div className="metric-value">{pendingRequests.length}</div>
            </div>
            <div className="metric-foot">
              {requests.filter((r) => r.status === "Approved").length} approved, awaiting handover
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><IconLeaf /></div>
            <div>
              <div className="metric-label">Estimated CO₂e avoided</div>
              <div className="metric-value">
                {totalCo2e > 0 ? formatCo2e(Math.round(totalCo2e * 100) / 100) : "—"}
              </div>
            </div>
            <div className="metric-foot">
              {counted.length} qualified events · {periodLabel(period)}
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <Panel
            title="Estimated CO₂e by period"
            description={`${periodLabel(period)} · qualified events only`}
          >
            <BarChart data={chartData} unit="kg CO₂e" />
            <AnalyticsNote />
          </Panel>

          <Panel title="Needs attention">
            <div className="stack stack--sm">
              {expiring.length + expired.length + pendingRequests.length === 0 ? (
                <EmptyState title="Nothing needs attention" />
              ) : (
                <>
                  {expiring.length > 0 && (
                    <div className="notice">
                      <span className="notice-icon"><IconClock /></span>
                      <strong>Expiring within 24 hours</strong>
                      <span>
                        {expiring.length} record(s) — remind owners to donate or
                        collect: {expiring.map((f) => f.id).join(", ")}.
                      </span>
                    </div>
                  )}
                  {expired.length > 0 && (
                    <div className="notice">
                      <span className="notice-icon"><IconAlert /></span>
                      <strong>Expired without follow-up</strong>
                      <span>
                        {expired.length} record(s) — follow up with owners or close
                        the record: {expired.map((f) => f.id).join(", ")}.
                      </span>
                    </div>
                  )}
                  {pendingRequests.length > 0 && (
                    <div className="notice">
                      <span className="notice-icon"><IconHand /></span>
                      <strong>Requests awaiting review</strong>
                      <span>
                        {pendingRequests.map((r) => r.id).join(", ")} — approve or
                        reject before the donation window closes.
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="button-row">
                <button
                  type="button"
                  className="button button--secondary button--sm"
                  onClick={() => navigate({ name: "manager-requests" })}
                >
                  Review requests
                </button>
                <button
                  type="button"
                  className="button button--secondary button--sm"
                  onClick={() => navigate({ name: "manager-expiry-monitor" })}
                >
                  Expiry monitoring
                </button>
              </div>
            </div>
          </Panel>
        </div>

        <div className="report-grid">
          <Panel title="Mass handled" description="Across all qualified events">
            <SummaryList
              rows={[
                { label: "Total mass in events", value: formatMass(massHandled) },
                { label: "Collected events", value: String(events.filter((e) => e.type === "Collected").length) },
                { label: "Distributed events", value: String(events.filter((e) => e.type === "Distributed" || e.type === "DonationCompleted").length) },
                { label: "Without a usable factor", value: <Badge variant="warning">{unresolved.length} event(s) — not counted as zero</Badge> },
              ]}
            />
          </Panel>
          <Panel
            title="Recent activity"
            action={
              <button
                type="button"
                className="button button--secondary button--sm"
                onClick={() => navigate({ name: "activity-logs" })}
              >
                All logs
              </button>
            }
          >
            {logs.slice(0, 5).map((l) => (
              <div key={l.id} className="checklist-item" style={{ paddingLeft: 0 }}>
                <span className="checklist-mark"><IconList /></span>
                <span>
                  <strong>{l.action}</strong> — {l.target}
                  <span className="cell-sub">
                    {l.actor} · {relativeTime(l.at)}
                  </span>
                </span>
              </div>
            ))}
            {logs.length === 0 && <EmptyState title="No activity yet" />}
          </Panel>
        </div>

        {notifications.filter((n) => n.delivery === "Failed").length > 0 && (
          <SimulationBanner>
            {notifications.filter((n) => n.delivery === "Failed").length} notification
            batch(es) are marked Failed in the demo scheduler log. Real delivery is
            not implemented.
          </SimulationBanner>
        )}
      </div>
    </AppShell>
  );
}

/* ------------------------ User and Role Management -------------------- */

export function ManagerUsersPage() {
  const { accounts, food, requests, donations, events, session, navigate } =
    useStore();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");

  const rows = accounts.filter(
    (a) =>
      (role === "All" || a.role === role) &&
      (q.trim() === "" ||
        a.name.toLowerCase().includes(q.toLowerCase()) ||
        a.email.toLowerCase().includes(q.toLowerCase())),
  );

  // Per-user mass and qualified CO₂e totals (§8: mass and CO₂e shown together;
  // only qualified events count — registration alone is never an emission).
  const totalsFor = (a: Account) => {
    const owned = food.filter((f) => f.ownerUserId === a.id);
    const ownedIds = new Set(owned.map((f) => f.id));
    const mass = owned.reduce((s, f) => s + f.massG, 0);
    const co2e = events
      .filter((e) => ownedIds.has(e.foodId) && e.co2eKg !== null)
      .reduce((s, e) => s + (e.co2eKg ?? 0), 0);
    const pending = owned.filter(
      (f) => f.massVerification.status === "Pending",
    ).length;
    return { records: owned.length, mass, co2e, pending };
  };

  return (
    <AppShell title="User and Role Management">
      <PageHead
        eyebrow="Role: Manager"
        title="User and Role Management"
        description="Accounts registered in this prototype, grouped by role, with each User's total registered mass and qualified CO₂e impact."
      />

      <div className="stack">
        <SimulationBanner>
          Accounts are seeded in memory. Sign-up creates a session-only record and
          there is no real authentication, password storage or email verification.
        </SimulationBanner>

        <Toolbar>
          <div className="search-box">
            <IconSearch />
            <input
              value={q}
              placeholder="Search name or email"
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search accounts"
            />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role filter">
            {["All", "User", "Manager", "Green Community"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <span className="tiny">{rows.length} of {accounts.length} accounts</span>
        </Toolbar>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">Account</th>
              <th scope="col">Role</th>
              <th scope="col">Organization</th>
              <th scope="col">Joined</th>
              <th scope="col">Records</th>
              <QuantityHeader />
              <th scope="col" style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={8} text="No accounts match this filter." />}
            {rows.map((a) => {
              const owned = food.filter((f) => f.ownerUserId === a.id).length;
              const reqs = requests.filter((r) => r.submittedBy === a.name).length;
              const dons = donations.filter((d) => d.createdBy === a.name).length;
              const totals = totalsFor(a);
              const self = session?.userId === a.id;
              return (
                <tr key={a.id}>
                  <td>
                    <span className="cell-strong">{a.name}{self ? " (you)" : ""}</span>
                    <span className="cell-sub">{a.email}</span>
                  </td>
                  <td>
                    <StatusBadge label={a.role} variant={roleVariant(a.role)} />
                  </td>
                  <td className="num-col">{a.organization ?? "—"}</td>
                  <td className="num-col">{formatDate(a.createdAt)}</td>
                  <td className="num-col">
                    {a.role === "User" && `${owned} food · ${dons} donations`}
                    {a.role === "Green Community" && `${reqs} requests`}
                    {a.role === "Manager" && "Operations"}
                  </td>
                  {a.role === "User" ? (
                    <>
                      <td className="num-col cell-strong num">
                        {totals.mass.toLocaleString("en-US")} g
                      </td>
                      <td className="num-col">
                        {totals.co2e > 0 ? (
                          <CarbonValue value={{ kind: "value", kg: Math.round(totals.co2e * 100) / 100 }} />
                        ) : (
                          <Badge variant="neutral">No qualified event yet</Badge>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {totals.pending > 0 && (
                            <Badge variant="warning">{totals.pending} to verify</Badge>
                          )}
                          <button
                            type="button"
                            className="button button--secondary button--sm"
                            onClick={() =>
                              navigate({
                                name: "manager-inventory",
                                owner: a.id,
                              } as Route)
                            }
                          >
                            View inventory
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="num-col tiny">—</td>
                      <td className="num-col tiny">—</td>
                      <td className="num-col tiny">
                        {a.role === "Green Community" ? "Receives donations" : "Sees all records"}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </TableWrap>

        <Notice title="Mass and CO₂e rules">
          Total mass sums every record the User registered (their declared
          weights, corrected where a Manager edited them). Estimated CO₂e counts
          qualified events only — collection or a completed donation — and never
          registration alone.
        </Notice>
        <Notice title="Role boundaries are enforced in navigation">
          Opening a page outside your role shows Access Denied. Managers can also
          inspect food records read-only, but expiry is never editable by any role.
        </Notice>
      </div>
    </AppShell>
  );
}

/* -------------------- Category & Subcategory Config ------------------- */

export function ManagerCategoriesPage() {
  const [open, setOpen] = useState<string | null>("fruit");

  return (
    <AppShell title="Category & Subcategory Configuration">
      <PageHead
        eyebrow="Role: Manager"
        title="Category & Subcategory Configuration"
        description="The food taxonomy used by Register Food. Dependent subtypes appear only under Prepared and Cooked Food."
      />

      <div className="stack">
        <SimulationBanner>
          Read-only in this prototype. Adding, renaming or removing categories
          would change historical records — that requires a versioned change with
          snapshots, which is out of scope here.
        </SimulationBanner>

        {CATEGORIES.map((c) => (
          <Panel
            key={c.id}
            title={c.name}
            description={`${c.subcategories.length} subcategory/subcategories · demo shelf life ${c.shelfLifeNote ?? `${c.shelfLifeDays} days`}`}
            action={
              <button
                type="button"
                className="button button--secondary button--sm"
                onClick={() => setOpen(open === c.id ? null : c.id)}
              >
                {open === c.id ? "Hide detail" : "Show detail"}
              </button>
            }
          >
            <p className="small"><strong>Factor note:</strong> {c.factorNote}</p>
            {open === c.id && (
              <div className="stack stack--sm">
                <TableWrap>
                  <thead>
                    <tr>
                      <th scope="col">Subcategory</th>
                      <th scope="col">Dependent subtypes</th>
                      <th scope="col">Demo shelf life</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.subcategories.map((sub) => {
                      const ov = c.shelfLifeOverrides?.filter((o) => o.match === sub);
                      const subtypes = c.dependentSubtypes?.[sub];
                      return (
                        <tr key={sub}>
                          <td><span className="cell-strong">{sub}</span></td>
                          <td>
                            {subtypes ? (
                              <div className="tag-row">
                                {subtypes.map((s) => (
                                  <Badge
                                    key={s}
                                    variant={s === "Mixed dish" ? "warning" : "neutral"}
                                  >
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="tiny">None</span>
                            )}
                          </td>
                          <td className="num-col">
                            {ov && ov.length > 0
                              ? ov.map((o) => `${o.match}: ${o.days} days`).join(" · ")
                              : `${c.shelfLifeDays} days`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableWrap>
                {c.dependentSubtypes && (
                  <Notice title="Dependent subtype shelf life">
                    {Object.entries(c.dependentSubtypes).map(([sub, list]) => (
                      <div key={sub}>
                        <strong>{sub}:</strong>{" "}
                        {list.map((s) => {
                          const o = c.shelfLifeOverrides?.find((x) => x.match === s);
                          return `${s} = ${o ? `${o.days} days` : `${c.shelfLifeDays} days`}`;
                        }).join(" · ")}
                      </div>
                    ))}
                  </Notice>
                )}
              </div>
            )}
          </Panel>
        ))}

        <Notice title="Unmapped subcategories">
          Other Vegetables, Other Beverages and Spices have no matching WRI source
          row, so records in those subcategories show "Emission factor not
          configured" — never a zero.
        </Notice>
      </div>
    </AppShell>
  );
}

/* --------------------- Shelf-Life Rule Configuration ------------------ */

export function ManagerShelfLifePage() {
  const { updateShelfLife, setToast } = useStore();
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.id, String(c.shelfLifeDays)])),
  );
  const [saved, setSaved] = useState<string | null>(null);

  const save = (id: string, name: string) => {
    const n = Number(drafts[id]);
    if (!Number.isFinite(n) || n < 1 || n > 3650) {
      setToast("Enter a whole number of days between 1 and 3650.");
      return;
    }
    updateShelfLife(name, Math.round(n));
    setSaved(id);
    window.setTimeout(() => setSaved((s) => (s === id ? null : s)), 2500);
  };

  return (
    <AppShell title="Shelf-Life Rule Configuration">
      <PageHead
        eyebrow="Role: Manager"
        title="Shelf-Life Rule Configuration"
        description="Demo shelf-life rules in days. Changing a rule affects records created afterwards — historical records keep their snapshot."
      />

      <div className="stack">
        <SimulationBanner>
          {SHELF_LIFE_DISCLAIMER} These values are not food-safety guidance and are
          not validated against any lab or regulation.
        </SimulationBanner>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Rule (days)</th>
              <th scope="col">Overrides in the taxonomy</th>
              <th scope="col" style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="cell-strong">{c.name}</span>
                  <span className="cell-sub">{c.shelfLifeNote ?? `${c.shelfLifeDays} days`}</span>
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={drafts[c.id]}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [c.id]: e.target.value }))
                    }
                    style={{ width: 110 }}
                    aria-label={`Shelf life for ${c.name}`}
                  />
                </td>
                <td className="tiny">
                  {c.shelfLifeOverrides && c.shelfLifeOverrides.length > 0
                    ? c.shelfLifeOverrides
                        .map((o) => `${o.match} = ${o.days} d`)
                        .join(" · ")
                    : "None — category default applies"}
                </td>
                <td>
                  <div className="table-actions">
                    {saved === c.id ? (
                      <Badge variant="success">Saved (demo)</Badge>
                    ) : (
                      <button
                        type="button"
                        className="button button--secondary button--sm"
                        onClick={() => save(c.id, c.name)}
                      >
                        Save rule
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>

        <Panel title="Why expiry is never edited by hand">
          <div className="stack stack--sm">
            <p className="small">
              When a User registers food, the platform resolves the rule that
              applies to the selected category/subcategory/subtype, computes the
              expiration datetime, and stores both the result and a snapshot of the
              rule on the record. Neither the User nor the Manager can type a new
              expiration date over that value — the field is read-only everywhere.
            </p>
            <SummaryList
              rows={[
                { label: "Computed at", value: "Registration time" },
                { label: "Stored as", value: "Recorded expiration datetime + rule snapshot" },
                { label: "Editable by User", value: <Badge variant="danger">No</Badge> },
                { label: "Editable by Manager", value: <Badge variant="danger">No</Badge> },
                { label: "Effect of a rule change", value: "Applies to new records only" },
              ]}
            />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

/* --------------------- Emission Factor Configuration ------------------ */

export function ManagerFactorsPage() {
  const [q, setQ] = useState("");
  const [unit, setUnit] = useState("All");

  const rows = FACTORS.filter(
    (f) =>
      (unit === "All" || f.unit === unit) &&
      (q.trim() === "" ||
        f.appMapping.toLowerCase().includes(q.toLowerCase()) ||
        f.sourceLabel.toLowerCase().includes(q.toLowerCase())),
  );

  const literCount = FACTORS.filter((f) => f.unit === "kg CO₂e/liter").length;
  const pendingCount = FACTORS.filter((f) => f.verification === "pending-source-check").length;

  return (
    <AppShell title="Emission Factor Configuration">
      <PageHead
        eyebrow="Role: Manager"
        title="Emission Factor Configuration"
        description="WRI Indonesia emission factors used for the CO₂e estimate. The 90th-percentile value is applied when the source unit matches the recorded mass unit."
        actions={
          <button
            type="button"
            className="button button--secondary"
            onClick={() =>
              downloadCsv("smartsave-emission-factors.csv", [
                ["App mapping", "Source label", "Source category", "p5", "p95", "p90", "Unit", "Verification", "Effective date", "Methodology"],
                ...FACTORS.map((f) => [
                  f.appMapping,
                  f.sourceLabel,
                  f.category,
                  f.rangeLow,
                  f.rangeHigh,
                  f.factorP90,
                  f.unit,
                  f.verification,
                  f.effectiveDate,
                  f.methodologyVersion,
                ]),
              ])
            }
          >
            <IconDownload />
            Export CSV
          </button>
        }
      />

      <div className="stack">
        <Notice title="Formula">
          Estimated CO₂e (kg) = (Food Mass (g) ÷ 1000) × Emission Factor — and only
          when the factor unit is per kg of food. Liter-based factors are never
          applied to a gram mass without an approved density conversion.
        </Notice>

        <div className="metrics-grid metrics-grid--3">
          <div className="metric-card">
            <div className="metric-icon"><IconLeaf /></div>
            <div>
              <div className="metric-label">Configured rows</div>
              <div className="metric-value">{FACTORS.length}</div>
            </div>
            <div className="metric-foot">Source: {METHODOLOGY.source}</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--amber"><IconAlert /></div>
            <div>
              <div className="metric-label">Liter-based rows</div>
              <div className="metric-value">{literCount}</div>
            </div>
            <div className="metric-foot">Yield "Unable to calculate" for gram masses</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--blue"><IconFile /></div>
            <div>
              <div className="metric-label">Pending source check</div>
              <div className="metric-value">{pendingCount}</div>
            </div>
            <div className="metric-foot">Carbohydrate rows to verify before operational use</div>
          </div>
        </div>

        <Toolbar>
          <div className="search-box">
            <IconSearch />
            <input
              value={q}
              placeholder="Search mapping or source label"
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search factors"
            />
          </div>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unit filter">
            {["All", "kg CO₂e/kg food", "kg CO₂e/liter"].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
          <span className="tiny">{rows.length} of {FACTORS.length} rows</span>
        </Toolbar>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">App mapping</th>
              <th scope="col">Source row</th>
              <th scope="col">Range (p5–p95)</th>
              <th scope="col">Factor p90</th>
              <th scope="col">Unit</th>
              <th scope="col">Verification</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={6} text="No factors match this filter." />}
            {rows.map((f) => (
              <tr key={f.id}>
                <td>
                  <span className="cell-strong">{f.appMapping}</span>
                  <span className="cell-sub">{f.category}</span>
                </td>
                <td className="tiny">{f.sourceLabel}</td>
                <td className="num-col">
                  {f.rangeLow.toLocaleString("en-US")} – {f.rangeHigh.toLocaleString("en-US")}
                </td>
                <td className="num-col cell-strong">
                  {f.factorP90.toLocaleString("en-US")}
                </td>
                <td>
                  <Badge variant={f.unit === "kg CO₂e/kg food" ? "success" : "warning"}>
                    {f.unit}
                  </Badge>
                </td>
                <td>
                  <Badge variant={f.verification === "verified" ? "info" : "warning"}>
                    {f.verification === "verified" ? "Verified" : "Pending source check"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>

        <Panel title="Source and methodology">
          <SummaryList
            rows={[
              { label: "Source", value: METHODOLOGY.source },
              { label: "Reference", value: <span className="tiny">{METHODOLOGY.url}</span> },
              { label: "Methodology version", value: METHODOLOGY.version },
              { label: "Effective date", value: METHODOLOGY.effectiveDate },
              { label: "Applied percentile", value: "90th percentile (p90) of the published range" },
              { label: "Historical rows", value: "Keep the factor snapshot taken at registration — a later config change does not rewrite them" },
            ]}
          />
          <AnalyticsNote />
        </Panel>

        <SimulationBanner>
          Editing a factor value is out of scope for this prototype. In production
          every change would be versioned with an effective date so historical
          reports stay reproducible.
        </SimulationBanner>
      </div>
    </AppShell>
  );
}

/* --------------------------- Barcode Management ---------------------- */

export function ManagerBarcodesPage() {
  const { food, navigate } = useStore();
  const [q, setQ] = useState("");

  const rows = food.filter(
    (f) =>
      q.trim() === "" ||
      f.barcode.toLowerCase().includes(q.toLowerCase()) ||
      f.id.toLowerCase().includes(q.toLowerCase()) ||
      f.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell title="Barcode Management">
      <PageHead
        eyebrow="Role: Manager"
        title="Barcode Management"
        description="Every food record carries a unique barcode. Scan one with the camera to open its record — managers see full details for any record."
        actions={
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate({ name: "scan-barcode" })}
          >
            <IconCamera />
            Scan with camera
          </button>
        }
      />

      <div className="stack">
        <SimulationBanner>
          Barcodes are generated deterministically from the record ID (SS-nnnn).
          Camera decoding runs in the browser (Shape Detection API) on the Scan
          Barcode page; elsewhere you can still type the value into the public
          lookup.
        </SimulationBanner>

        <Toolbar>
          <div className="search-box">
            <IconSearch />
            <input
              value={q}
              placeholder="Search barcode, ID or name"
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search barcodes"
            />
          </div>
          <span className="tiny">{rows.length} of {food.length} barcodes</span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => navigate({ name: "public-lookup" })}
          >
            Open public lookup
          </button>
        </Toolbar>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">Barcode</th>
              <th scope="col">Record</th>
              <th scope="col">Status</th>
              <th scope="col">Owner</th>
              <th scope="col" style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={5} text="No barcodes match this search." />}
            {rows.map((f) => (
              <tr key={f.id}>
                <td><span className="cell-strong num">{f.barcode}</span></td>
                <td>
                  <span className="cell-strong">{f.name}</span>
                  <span className="cell-sub">{f.id} · {f.category}</span>
                </td>
                <td>
                  <StatusBadge label={f.status} variant={foodStatusVariant(f.status)} />
                </td>
                <td className="num-col">{f.ownerLabel}</td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="button button--secondary button--sm"
                      onClick={() => navigate({ name: "print-label", id: f.id })}
                    >
                      Label
                    </button>
                    <button
                      type="button"
                      className="button button--ghost button--sm"
                      onClick={() => navigate({ name: "public-lookup" })}
                    >
                      Public view
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </AppShell>
  );
}

/* --------------------------- Donation Management --------------------- */

export function ManagerDonationsPage() {
  const { donations, food, requests, distributeDonation, navigate } = useStore();
  const [status, setStatus] = useState("All");

  const rows = donations.filter((d) => status === "All" || d.status === status);

  return (
    <AppShell title="Donation Management">
      <PageHead
        eyebrow="Role: Manager"
        title="Donation Management"
        description="Review offered donations, see which Green Community requested them, and record the mass actually handed over."
      />

      <div className="stack">
        <SimulationBanner>
          Recording a handover writes the impact event for that mass — once. This
          prototype records the full offered mass; a partial handover would need a
          quantity picker, which is out of scope.
        </SimulationBanner>

        <Toolbar>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            {["All", "Pending", "Completed", "Cancelled"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="tiny">{rows.length} of {donations.length} donations</span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => navigate({ name: "manager-requests" })}
          >
            Review requests
          </button>
        </Toolbar>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">Donation</th>
              <th scope="col">Status</th>
              <th scope="col">Created by</th>
              <th scope="col">Created</th>
              <QuantityHeader />
              <th scope="col">Requests</th>
              <th scope="col" style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={8} text="No donations in this status." />}
            {rows.map((d) => {
              const reqs = requests.filter((r) => r.donationId === d.id);
              const approved = reqs.find((r) => r.status === "Approved");
              const items = food.filter((f) => d.foodIds.includes(f.id));
              // Show the offered mass's estimate using the factor snapshot taken
              // at registration — shown in full only once the donation is Completed.
              const kg = items.reduce((s, f) => {
                const factorP90 = f.factorSnapshot.factorP90;
                return factorP90 != null ? s + (f.massG / 1000) * factorP90 : s;
              }, 0);
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
                    {d.status === "Completed" ? (
                      kg > 0 ? (
                        <CarbonValue value={{ kind: "value", kg: Math.round(kg * 100) / 100 }} />
                      ) : (
                        <CarbonValue value={{ kind: "not-configured" }} />
                      )
                    ) : (
                      <Badge variant="neutral">Not counted until distributed</Badge>
                    )}
                  </td>
                  <td>
                    {reqs.length === 0 ? (
                      <span className="tiny">None</span>
                    ) : (
                      <div className="tag-row">
                        {reqs.map((r) => (
                          <Badge key={r.id} variant={requestStatusVariant(r.status)}>
                            {r.id} {r.status}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      {d.status === "Pending" && (
                        <button
                          type="button"
                          className="button button--primary button--sm"
                          disabled={!approved}
                          title={
                            approved
                              ? "Record the mass handed over — writes the impact event once"
                              : "Approve a Green Community request first"
                          }
                          onClick={() => distributeDonation(d.id)}
                        >
                          Record handover
                        </button>
                      )}
                      <button
                        type="button"
                        className="button button--ghost button--sm"
                        onClick={() =>
                          d.foodIds[0] && navigate({ name: "food-detail", id: d.foodIds[0] })
                        }
                      >
                        View food
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>

        <Notice title="Handover is the single counting point">
          A donation moves Pending → Completed when a Manager records the handover.
          At that moment one Distributed impact event is written per food record,
          keyed by mass/lot, so the same mass is never counted twice.
        </Notice>
      </div>
    </AppShell>
  );
}

/* -------------------- Green Community Requests ------------------------ */

export function ManagerRequestsPage() {
  const { requests, donations, decideRequest, navigate } = useStore();
  const [status, setStatus] = useState("All");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const rows = requests.filter((r) => status === "All" || r.status === status);

  const confirmReject = () => {
    if (!rejectId) return;
    decideRequest(rejectId, false, reason.trim() || "No reason recorded.");
    setRejectId(null);
    setReason("");
  };

  return (
    <AppShell title="Green Community Requests">
      <PageHead
        eyebrow="Role: Manager"
        title="Green Community Requests"
        description="Review requests from Green Communities. Approval allocates the donation; the impact is written only when you record the handover."
      />

      <div className="stack">
        <Toolbar>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            {["All", "Pending", "Approved", "Rejected", "Completed"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="tiny">{rows.length} of {requests.length} requests</span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => navigate({ name: "manager-donations" })}
          >
            Donation management
          </button>
        </Toolbar>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">Request</th>
              <th scope="col">Status</th>
              <th scope="col">Submitted by</th>
              <th scope="col">Submitted</th>
              <th scope="col">Address · Email</th>
              <QuantityHeader />
              <th scope="col" style={{ textAlign: "right" }}>Decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={8} text="No requests in this status." />}
            {rows.map((r) => {
              const donation = donations.find((d) => d.id === r.donationId);
              return (
                <tr key={r.id}>
                  <td>
                    <span className="cell-strong">{r.label}</span>
                    <span className="cell-sub">
                      {r.id} · donation {r.donationId}
                      {donation ? ` (${donation.status})` : ""}
                    </span>
                  </td>
                  <td>
                    <StatusBadge label={r.status} variant={requestStatusVariant(r.status)} />
                  </td>
                  <td className="num-col">{r.submittedBy}</td>
                  <td className="num-col">{formatDateTime(r.submittedAt)}</td>
                  <td className="tiny">
                    {r.contactAddress ?? "—"}
                    <span className="cell-sub">{r.contactEmail ?? "—"}</span>
                  </td>
                  <td className="num-col">{formatMass(r.massG)}</td>
                  <td className="num-col">
                    <Badge variant="neutral">Counted only after handover</Badge>
                  </td>
                  <td>
                    <div className="table-actions">
                      {r.status === "Pending" ? (
                        <>
                          <button
                            type="button"
                            className="button button--primary button--sm"
                            onClick={() => decideRequest(r.id, true)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="button button--secondary button--sm"
                            onClick={() => setRejectId(r.id)}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="tiny">{r.reason ?? "—"}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>

        {rejectId && (
          <Panel title={`Reject request ${rejectId}`}>
            <div className="stack stack--sm">
              <Field
                label="Reason"
                hint="Recorded on the request and shown to the Green Community"
              >
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Donation was cancelled by the donor before allocation."
                />
              </Field>
              <div className="button-row">
                <button
                  type="button"
                  className="button button--primary"
                  onClick={confirmReject}
                >
                  Confirm rejection
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    setRejectId(null);
                    setReason("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}

/* --------------- Expiry / Website Notification Monitoring -------------- */

export function ManagerExpiryMonitorPage() {
  const { food, notifications, markNotificationsRead } = useStore();
  const [tab, setTab] = useState<"expiring" | "expired" | "notifications">("expiring");

  const expiring = food.filter((f) => {
    const h = (new Date(f.expiresAt).getTime() - Date.now()) / 3600000;
    return h > 0 && h <= 2 && f.status !== "Collected" && f.status !== "Donated";
  });
  const expired = food.filter(
    (f) => effectiveFoodStatus(f.status, f.expiresAt) === "Expired",
  );
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AppShell title="Expiry / Website Notification Monitoring">
      <PageHead
        eyebrow="Role: Manager"
        title="Expiry / Website Notification Monitoring"
        description="Records approaching expiry, records already expired, and the website notification log."
        actions={
          <div className="segmented" role="group" aria-label="View">
            <button type="button" className={tab === "expiring" ? "is-active" : ""} onClick={() => setTab("expiring")}>
              Expiring (2 h)
            </button>
            <button type="button" className={tab === "expired" ? "is-active" : ""} onClick={() => setTab("expired")}>
              Expired
            </button>
            <button type="button" className={tab === "notifications" ? "is-active" : ""} onClick={() => setTab("notifications")}>
              Notifications{unread > 0 ? ` (${unread})` : ""}
            </button>
          </div>
        }
      />

      <div className="stack">
        <SimulationBanner>
          The two-hour reminder and the expired follow-up are computed from the
          stored expiration datetime for this prototype. A production deployment
          would run them on a scheduler and deliver only through the website — no
          email or SMS is configured.
        </SimulationBanner>

        {tab === "expiring" && (
          <Panel title="Expiring within two hours" description="Remind owners to donate or collect">
            {expiring.length === 0 ? (
              <EmptyState title="Nothing expiring in the next two hours" />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <th scope="col">Record</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Expires</th>
                    <th scope="col">Time left</th>
                    <QuantityHeader />
                  </tr>
                </thead>
                <tbody>
                  {expiring.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <span className="cell-strong">{f.name}</span>
                        <span className="cell-sub">{f.id} · {f.category}</span>
                      </td>
                      <td className="num-col">{f.ownerLabel}</td>
                      <td className="num-col">{formatDateTime(f.expiresAt)}</td>
                      <td className="num-col">
                        <Badge variant="warning">
                          {relativeTime(f.expiresAt)}
                        </Badge>
                      </td>
                      <td className="num-col">{formatMass(f.massG)}</td>
                      <td>
                        <Badge variant="neutral">Counted only after a qualified event</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Panel>
        )}

        {tab === "expired" && (
          <Panel title="Expired records" description="Follow up with the owner or close the record">
            {expired.length === 0 ? (
              <EmptyState title="No expired records" />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <th scope="col">Record</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Expired at</th>
                    <QuantityHeader />
                    <th scope="col">Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {expired.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <span className="cell-strong">{f.name}</span>
                        <span className="cell-sub">{f.id} · {f.category}</span>
                      </td>
                      <td className="num-col">{f.ownerLabel}</td>
                      <td className="num-col">{formatDateTime(f.expiresAt)}</td>
                      <td className="num-col">{formatMass(f.massG)}</td>
                      <td>
                        <Badge variant="neutral">No qualifying event yet</Badge>
                      </td>
                      <td className="tiny">
                        Expired with no qualifying event — no impact counted.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Panel>
        )}

        {tab === "notifications" && (
          <Panel
            title="Website notification log"
            description="Delivery status as recorded by the demo scheduler"
            action={
              unread > 0 ? (
                <button
                  type="button"
                  className="button button--secondary button--sm"
                  onClick={markNotificationsRead}
                >
                  Mark all read
                </button>
              ) : undefined
            }
          >
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col">Notification</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Created</th>
                  <th scope="col">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 && (
                  <TableEmpty colSpan={4} text="No notifications in the demo log." />
                )}
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <span className="cell-strong">{n.title}</span>
                      <span className="cell-sub">{n.body}</span>
                    </td>
                    <td>
                      <Badge
                        variant={
                          n.kind === "reminder-2h"
                            ? "warning"
                            : n.kind === "expired-followup"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {n.kind === "reminder-2h"
                          ? "2-hour reminder"
                          : n.kind === "expired-followup"
                            ? "Expired follow-up"
                            : "System"}
                      </Badge>
                    </td>
                    <td className="num-col">{formatDateTime(n.createdAt)}</td>
                    <td>
                      <Badge
                        variant={
                          n.delivery === "Delivered"
                            ? "success"
                            : n.delivery === "Failed"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {n.delivery}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}

/* ------------------------------ Activity Logs ------------------------- */

export function ActivityLogsPage() {
  const { logs } = useStore();
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("All");

  const actors = Array.from(new Set(logs.map((l) => l.actor)));
  const rows = logs.filter(
    (l) =>
      (actor === "All" || l.actor === actor) &&
      (q.trim() === "" ||
        l.action.toLowerCase().includes(q.toLowerCase()) ||
        l.target.toLowerCase().includes(q.toLowerCase()) ||
        (l.detail ?? "").toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <AppShell title="Activity Logs">
      <PageHead
        eyebrow="Role: Manager"
        title="Activity Logs"
        description="Audit trail of the actions performed in this prototype session, newest first."
        actions={
          <button
            type="button"
            className="button button--secondary"
            onClick={() =>
              downloadCsv("smartsave-activity-logs.csv", [
                ["Timestamp", "Actor", "Action", "Target", "Detail"],
                ...rows.map((l) => [l.at, l.actor, l.action, l.target, l.detail ?? ""]),
              ])
            }
          >
            <IconDownload />
            Export CSV
          </button>
        }
      />

      <div className="stack">
        <SimulationBanner>
          Logs are held in memory for this session only. A production deployment
          would persist them with tamper-evident timestamps.
        </SimulationBanner>

        <Toolbar>
          <div className="search-box">
            <IconSearch />
            <input
              value={q}
              placeholder="Search action, target or detail"
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search logs"
            />
          </div>
          <select value={actor} onChange={(e) => setActor(e.target.value)} aria-label="Actor filter">
            {["All", ...actors].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <span className="tiny">{rows.length} of {logs.length} entries</span>
        </Toolbar>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Actor</th>
              <th scope="col">Action</th>
              <th scope="col">Target</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={5} text="No log entries match this filter." />}
            {rows.map((l) => (
              <tr key={l.id}>
                <td className="num-col">
                  {formatDateTime(l.at)}
                  <span className="cell-sub">{relativeTime(l.at)}</span>
                </td>
                <td className="num-col">{l.actor}</td>
                <td><span className="cell-strong">{l.action}</span></td>
                <td className="num-col">{l.target}</td>
                <td className="tiny">{l.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </AppShell>
  );
}

/* --------------------------- Environmental Reports -------------------- */

export function ReportsPage() {
  const { events, food, donations, requests, logs } = useStore();
  const [period, setPeriod] = useState<Period>("Monthly");

  const counted = events.filter((e) => e.co2eKg !== null && new Date(e.occurredAt) >= periodStartDate(period));
  const unresolved = events.filter((e) => e.co2eKg === null);
  const totalCo2e = counted.reduce((s, e) => s + (e.co2eKg ?? 0), 0);
  const massCounted = counted.reduce((s, e) => s + e.massG, 0);

  const buckets = chartBuckets(period);
  const co2eData = buckets.map((b) => ({
    label: b.label,
    value: counted
      .filter((e) => bucketValue(e.occurredAt, b))
      .reduce((s, e) => s + (e.co2eKg ?? 0), 0),
  }));
  const massData = buckets.map((b) => ({
    label: b.label,
    value: counted
      .filter((e) => bucketValue(e.occurredAt, b))
      .reduce((s, e) => s + e.massG, 0),
  }));

  const byCategory = new Map<string, number>();
  counted.forEach((e) => {
    const item = food.find((f) => f.id === e.foodId);
    const key = item?.category ?? "Unknown";
    byCategory.set(key, (byCategory.get(key) ?? 0) + (e.co2eKg ?? 0));
  });
  const categoryData = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }));

  return (
    <AppShell title="Environmental Reports">
      <PageHead
        eyebrow="Role: Manager"
        title="Environmental Reports"
        description="Aggregated estimated impact for the selected period, with the disclosure, exclusions and unresolved items stated explicitly."
        actions={
          <>
            <PeriodFilter value={period} onChange={setPeriod} />
            <button
              type="button"
              className="button button--secondary"
              onClick={() =>
                downloadCsv(`smartsave-impact-${period.toLowerCase()}.csv`, [
                  ["Event", "Type", "Food", "Occurred at", "Mass (g)", "Factor p90", "Unit", "Estimated CO₂e avoided (kg CO₂e)", "Factor state", "Methodology"],
                  ...counted.map((e) => [
                    e.id,
                    e.type,
                    e.label,
                    e.occurredAt,
                    e.massG,
                    e.factorP90 ?? "",
                    e.unit ?? "",
                    e.co2eKg ?? "",
                    e.factorState.kind,
                    e.methodologyVersion,
                  ]),
                ])
              }
            >
              <IconDownload />
              Export CSV
            </button>
          </>
        }
      />

      <div className="stack">
        <AnalyticsNote extra="Registration alone is not counted — only qualified events (collected or distributed) appear in these totals." />

        <div className="metrics-grid metrics-grid--4">
          <div className="metric-card">
            <div className="metric-icon"><IconChart /></div>
            <div>
              <div className="metric-label">Estimated CO₂e avoided</div>
              <div className="metric-value">
                {totalCo2e > 0 ? formatCo2e(Math.round(totalCo2e * 100) / 100) : "—"}
              </div>
            </div>
            <div className="metric-foot">{periodLabel(period)} · qualified events only</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--blue"><IconBox /></div>
            <div>
              <div className="metric-label">Mass in counted events</div>
              <div className="metric-value">
                {massCounted.toLocaleString("en-US")}
                <small>g</small>
              </div>
            </div>
            <div className="metric-foot">{counted.length} events in period</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--amber"><IconGift /></div>
            <div>
              <div className="metric-label">Donations completed</div>
              <div className="metric-value">
                {donations.filter((d) => d.status === "Completed").length}
              </div>
            </div>
            <div className="metric-foot">
              {donations.filter((d) => d.status === "Pending").length} still pending
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--red"><IconAlert /></div>
            <div>
              <div className="metric-label">Unresolved events</div>
              <div className="metric-value">{unresolved.length}</div>
            </div>
            <div className="metric-foot">Reported as a status, never as zero</div>
          </div>
        </div>

        <div className="report-grid">
          <Panel title="Estimated CO₂e by period" description={`${periodLabel(period)} · kg CO₂e`}>
            <BarChart data={co2eData} unit="kg CO₂e" />
          </Panel>
          <Panel title="Mass in qualified events" description={`${periodLabel(period)} · grams`}>
            <BarChart data={massData} unit="g" />
          </Panel>
        </div>

        <div className="report-grid">
          <Panel title="Estimated CO₂e by food category" description="Top categories in the period">
            {categoryData.length === 0 ? (
              <EmptyState title="No counted events in this period" />
            ) : (
              <BarChart data={categoryData} unit="kg CO₂e" />
            )}
          </Panel>

          <Panel title="Methodology, exclusions and caveats">
            <div className="stack stack--sm">
              <SummaryList
                rows={[
                  { label: "Formula", value: "(Food Mass (g) ÷ 1000) × Emission Factor (p90)" },
                  { label: "Source", value: METHODOLOGY.source },
                  { label: "Version", value: METHODOLOGY.version },
                  { label: "Counted outcomes", value: "Collected by a User · donation distributed to a requester" },
                  { label: "Not counted", value: "Registration alone · pending or cancelled donations · records with no usable factor" },
                  { label: "Double counting", value: "One claim per mass/lot per outcome" },
                  { label: "Consumption", value: "Collection is an assumed consumption outcome — not proof the food was eaten" },
                  { label: "Sensors", value: "No CO₂ ppm is displayed; none is measured" },
                ]}
              />
              {unresolved.length > 0 && (
                <Notice title="Events without a usable factor">
                  <TableWrap>
                    <thead>
                      <tr>
                        <th scope="col">Event</th>
                        <th scope="col">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unresolved.map((e) => (
                        <tr key={e.id}>
                          <td>
                            <span className="cell-strong">{e.label}</span>
                            <span className="cell-sub">{e.id} · {e.foodId}</span>
                          </td>
                          <td>
                            <Badge variant="warning">
                              {e.factorState.kind === "unit-mismatch"
                                ? "Unable to calculate"
                                : "Emission factor not configured"}
                            </Badge>
                            <span className="cell-sub">
                              Source unit: {e.unit ?? "—"} · {e.sourceLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrap>
                </Notice>
              )}
            </div>
          </Panel>
        </div>

        <SimulationBanner>
          This prototype aggregates in-memory demo data. A production report would
          read from a persisted store with the same labels, units and disclosures
          used on screen.
        </SimulationBanner>
      </div>
    </AppShell>
  );
}

/** Local helper so the report can filter events by period without importing more. */
function periodStartDate(period: Period): Date {
  const d = new Date();
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

/* --------------------- Virtual Locker Management ----------------------- */

const STATUS_OPTIONS: CompartmentStatus[] = ["Available", "Maintenance", "Offline"];

function statusVariant(s: CompartmentStatus) {
  if (s === "Available") return "success" as const;
  if (s === "Maintenance") return "warning" as const;
  return "danger" as const;
}

export function ManagerLockersPage() {
  const { compartments, food, updateCompartment, session } = useStore();
  const [editing, setEditing] = useState<string | null>(null);

  const target = compartments.find((c) => c.id === editing) ?? null;
  const [form, setForm] = useState<{
    category: string;
    capacityG: string;
    temperatureC: string;
    status: CompartmentStatus;
  }>({ category: "", capacityG: "", temperatureC: "", status: "Available" });

  const startEdit = (id: string) => {
    const c = compartments.find((x) => x.id === id);
    if (!c) return;
    setForm({
      category: c.category,
      capacityG: String(c.capacityG),
      temperatureC: c.temperatureC === null ? "" : String(c.temperatureC),
      status: c.status,
    });
    setEditing(id);
  };

  const save = () => {
    if (!target) return;
    const capacityG = Number(form.capacityG);
    if (!Number.isFinite(capacityG) || capacityG <= 0) return;
    const temp = form.temperatureC.trim();
    updateCompartment(target.id, {
      category: form.category,
      capacityG: Math.round(capacityG),
      temperatureC: temp === "" ? null : Number(temp),
      status: form.status,
    });
    setEditing(null);
  };

  return (
    <AppShell title="Virtual Locker Management">
      <PageHead
        eyebrow="Role: Manager"
        title="Virtual Locker Management"
        description="Configure the category, capacity, temperature and availability of each virtual compartment. Capacity cannot be set below the mass currently stored."
      />

      <div className="stack">
        <SimulationBanner>
          Compartments are simulated website data. Temperature and availability
          are not read from any sensor or locker hardware (§14).
        </SimulationBanner>

        <div className="locker-grid">
          {compartments.map((c) => {
            const used = compartmentOccupancy(food, c.id);
            const free = remainingCapacity(food, c);
            const occupants = compartmentOccupants(food, c.id);
            const pct = Math.min(100, Math.round((used / c.capacityG) * 100));
            return (
              <article key={c.id} className="panel locker-card">
                <div className="locker-card-head">
                  <span className="locker-card-id">{compartmentLabel(c)}</span>
                  <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                </div>

                <div className="locker-meter" aria-hidden>
                  <span style={{ width: `${pct}%` }} />
                </div>

                <SummaryList
                  rows={[
                    { label: "Accepts", value: c.category },
                    { label: "Capacity", value: formatMass(c.capacityG) },
                    { label: "Occupied", value: formatMass(used) },
                    { label: "Available", value: formatMass(free) },
                    {
                      label: "Temperature",
                      value:
                        c.temperatureC === null ? (
                          "Not monitored"
                        ) : (
                          <>
                            {c.temperatureC.toFixed(1)} °C{" "}
                            <Badge variant="neutral">Simulated</Badge>
                          </>
                        ),
                    },
                    {
                      label: "Stored records",
                      value:
                        occupants.length === 0 ? (
                          "Empty"
                        ) : (
                          <span className="tag-row">
                            {occupants.map((o) => (
                              <Badge key={o.id} variant="neutral">
                                {o.name}
                              </Badge>
                            ))}
                          </span>
                        ),
                    },
                  ]}
                />

                {editing === c.id ? (
                  <div className="stack stack--sm">
                    <Field label="Accepts category">
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="Capacity (g)"
                      hint={`Occupied: ${formatMass(used)} — capacity cannot be lower`}
                    >
                      <input
                        inputMode="numeric"
                        value={form.capacityG}
                        onChange={(e) =>
                          setForm({ ...form, capacityG: e.target.value.replace(/\D/g, "") })
                        }
                      />
                    </Field>
                    <Field
                      label="Temperature (°C)"
                      hint="Leave empty for an unmonitored compartment"
                    >
                      <input
                        inputMode="decimal"
                        value={form.temperatureC}
                        onChange={(e) =>
                          setForm({ ...form, temperatureC: e.target.value.replace(/[^\d.]/g, "") })
                        }
                      />
                    </Field>
                    <Field label="Status">
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value as CompartmentStatus })
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="button-row">
                      <button type="button" className="button button--primary button--sm" onClick={save}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="button button--ghost button--sm"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="button-row">
                    <button
                      type="button"
                      className="button button--secondary button--sm"
                      onClick={() => startEdit(c.id)}
                    >
                      Edit settings
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {target && (
          <Notice title="Editing scope">
            Changes apply to {compartmentLabel(target)} only. Records already
            stored keep their own snapshot; reducing capacity below{" "}
            {formatMass(compartmentOccupancy(food, target.id))} is blocked.
          </Notice>
        )}

        {session && (
          <p className="tiny">
            Signed in as {session.name} · edits are logged to the activity log.
          </p>
        )}
      </div>
    </AppShell>
  );
}
