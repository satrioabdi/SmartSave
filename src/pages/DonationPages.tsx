/** Food Donation, Donation History and Food Retrieval / Collection Status. */
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  AnalyticsNote,
  Badge,
  CarbonValue,
  EmptyState,
  Field,
  Notice,
  PageHead,
  Panel,
  QuantityHeader,
  SimulationBanner,
  StatusBadge,
  TableEmpty,
  TableWrap,
  Toolbar,
} from "../components/ui";
import { IconGift, IconHand } from "../components/icons";
import { useStore } from "../lib/store";
import {
  computeCarbon,
  formatMass,
  resolveForItem,
} from "../lib/carbon";
import {
  donationStatusVariant,
  effectiveFoodStatus,
  expiredWithinGrace,
  foodStatusVariant,
  formatDate,
  formatDateTime,
  isExpired,
  ownerActionOpen,
} from "../lib/format";

/* --------------------------- Food Donation ---------------------------- */

export function FoodDonationPage() {
  const { session, food, createDonation, cancelDonation, navigate, setToast } =
    useStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  // Stored records are eligible; records expired less than one hour ago are
  // also offered — the owner may still donate during the grace window.
  const eligible = food.filter(
    (f) =>
      f.ownerUserId === session.userId &&
      f.status === "Stored" &&
      (!isExpired(f.expiresAt) || expiredWithinGrace(f.expiresAt)),
  );
  const chosen = eligible.filter((f) => selected.includes(f.id));
  const massG = chosen.reduce((s, f) => s + f.massG, 0);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const submit = () => {
    if (chosen.length === 0) {
      setError("Select at least one stored food record.");
      return;
    }
    const blocked = chosen.filter(
      (f) => resolveForItem(f.category, f.subcategory, f.subtype).state.kind !== "valid",
    );
    if (blocked.length > 0) {
      setError(
        `These records cannot be offered yet: ${blocked.map((b) => b.id).join(", ")} — their emission factor is not configured for this unit.`,
      );
      return;
    }
    setError(null);
    const d = createDonation({ foodIds: selected, note: note.trim() || undefined });
    if (d) {
      setSelected([]);
      setNote("");
      setToast(`Donation ${d.id} created.`);
    }
  };

  return (
    <AppShell title="Food Donation">
      <PageHead
        eyebrow="Role: User"
        title="Food Donation"
        description="Offer stored food to Green Community. The donation starts as Pending and only becomes an impact event when it is actually distributed."
        actions={
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate({ name: "donation-history" })}
          >
            Donation History
          </button>
        }
      />

      <div className="stack">
        <SimulationBanner>
          Donations created here are recorded in memory for the prototype. Manager
          approval and distribution happen on the Manager pages.
        </SimulationBanner>

        <div className="form-layout">
          <Panel
            title="Select food to donate"
            description="Stored records are eligible — plus records expired less than one hour ago (grace window)."
          >
            <div className="stack stack--sm">
              {eligible.length === 0 && (
                <EmptyState
                  title="No stored food available"
                  hint="Register food first — records expired beyond the grace window or already donated cannot be offered."
                />
              )}
              {eligible.map((f) => {
                const res = resolveForItem(f.category, f.subcategory, f.subtype);
                const ok = res.state.kind === "valid";
                const grace = isExpired(f.expiresAt) && expiredWithinGrace(f.expiresAt);
                const checked = selected.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className="check"
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      padding: 13,
                      background: checked ? "var(--green-soft)" : "var(--white)",
                      borderColor: checked ? "var(--green)" : "var(--line)",
                      cursor: ok ? "pointer" : "not-allowed",
                      opacity: ok ? 1 : 0.65,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!ok}
                      onChange={() => toggle(f.id)}
                    />
                    <span style={{ flex: 1 }}>
                      <strong style={{ display: "block", color: "var(--navy)" }}>
                        {f.name}
                        {grace && (
                          <span style={{ marginLeft: 8 }}>
                            <Badge variant="warning">Expired — grace window</Badge>
                          </span>
                        )}
                      </strong>
                      <span className="tiny">
                        {f.id} · {formatMass(f.massG)} · expires {formatDateTime(f.expiresAt)}
                        {grace
                          ? " · still donatable inside the one-hour grace window"
                          : ""}
                      </span>
                      <span style={{ display: "block", marginTop: 6 }}>
                        {ok ? (
                          <CarbonValue
                            value={computeCarbon(f.massG, res)}
                          />
                        ) : (
                          <Badge variant="warning">
                            {res.state.kind === "unit-mismatch"
                              ? "Unable to calculate"
                              : "Emission factor not configured"}
                          </Badge>
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}

              {error && <div className="scan-error">{error}</div>}

              <Field label="Note (optional)" hint="Shown to the reviewing Manager">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Surplus from morning delivery."
                />
              </Field>

              <button
                type="button"
                className="button button--primary"
                onClick={submit}
                disabled={chosen.length === 0}
              >
                <IconGift />
                Create donation
              </button>
            </div>
          </Panel>

          <div className="stack">
            <div className="estimate-card">
              <span className="eyebrow">Selected quantity</span>
              <span className="estimate-value">{massG.toLocaleString("en-US")} g</span>
              <span className="estimate-sub">
                {chosen.length} record(s) · donation status will be Pending
              </span>
            </div>

            <Notice title="No double counting">
              The same mass is claimed once per outcome. Creating a donation does
              not add CO₂e — only completed distribution does, and only once.
            </Notice>

            <AnalyticsNote />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* -------------------------- Donation History -------------------------- */

export function DonationHistoryPage() {
  const { session, donations, food, cancelDonation, navigate } = useStore();
  const [status, setStatus] = useState("All");

  if (!session) return null;
  const mine = donations.filter((d) => d.createdBy === session.name);
  const rows = mine.filter((d) => status === "All" || d.status === status);
  const totalMass = mine.reduce((s, d) => s + d.massG, 0);

  return (
    <AppShell title="Donation History">
      <PageHead
        eyebrow="Role: User"
        title="Donation History"
        description="Completed, cancelled and pending donations with the mass offered and the impact recorded once."
      />

      <div className="stack">
        <div className="metrics-grid metrics-grid--3">
          <div className="metric-card">
            <div className="metric-icon"><IconGift /></div>
            <div>
              <div className="metric-label">Donations created</div>
              <div className="metric-value">{mine.length}</div>
            </div>
            <div className="metric-foot">{formatMass(totalMass)} offered in total</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--blue"><IconHand /></div>
            <div>
              <div className="metric-label">Completed</div>
              <div className="metric-value">
                {mine.filter((d) => d.status === "Completed").length}
              </div>
            </div>
            <div className="metric-foot">Distributed to a Green Community</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon--amber"><IconGift /></div>
            <div>
              <div className="metric-label">Pending / Cancelled</div>
              <div className="metric-value">
                {mine.filter((d) => d.status === "Pending").length}
                <small>pending</small>
              </div>
            </div>
            <div className="metric-foot">
              {mine.filter((d) => d.status === "Cancelled").length} cancelled
            </div>
          </div>
        </div>

        <Toolbar>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            {["All", "Pending", "Completed", "Cancelled"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="tiny">{rows.length} of {mine.length} donations</span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => navigate({ name: "food-donation" })}
          >
            Create new donation
          </button>
        </Toolbar>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">Donation</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
              <QuantityHeader />
              <th scope="col">Allocated to</th>
              <th scope="col" style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <TableEmpty colSpan={7} text="No donations in this status." />}
            {rows.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className="cell-strong">{d.label}</span>
                  <span className="cell-sub">
                    {d.id} · {d.foodIds.join(", ")}
                  </span>
                </td>
                <td>
                  <StatusBadge label={d.status} variant={donationStatusVariant(d.status)} />
                </td>
                <td className="num-col">{formatDate(d.createdAt)}</td>
                <td className="num-col">{formatMass(d.massG)}</td>
                <td className="num-col">
                  {d.status === "Completed" ? (
                    <CarbonValue
                      value={
                        (() => {
                          const items = food.filter((f) => d.foodIds.includes(f.id));
                          const kg = items.reduce((s, f) => {
                            const r = resolveForItem(f.category, f.subcategory, f.subtype);
                            const c = computeCarbon(f.massG, r);
                            return s + (c.kind === "value" ? c.kg : 0);
                          }, 0);
                          return { kind: "value" as const, kg: Math.round(kg * 100) / 100 };
                        })()
                      }
                    />
                  ) : (
                    <Badge variant="neutral">Not counted until distributed</Badge>
                  )}
                </td>
                <td>{d.allocatedTo ?? "—"}</td>
                <td>
                  <div className="table-actions">
                    {d.status === "Pending" && (
                      <button
                        type="button"
                        className="button button--secondary button--sm"
                        onClick={() => cancelDonation(d.id)}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      className="button button--ghost button--sm"
                      onClick={() =>
                        navigate(
                          d.foodIds[0]
                            ? { name: "food-detail", id: d.foodIds[0] }
                            : { name: "donation-history" },
                        )
                      }
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>

        <Notice title="Same mass is never counted twice">
          A donation moves Pending → Completed or Cancelled. Only completed
          distribution writes an impact event, keyed by mass/lot and outcome.
        </Notice>
      </div>
    </AppShell>
  );
}

/* --------------------- Food Retrieval / Collection -------------------- */

export function RetrievalPage() {
  const { session, food, collectFood, events, navigate } = useStore();
  const [filter, setFilter] = useState<"All" | "Collectable" | "Recorded">("Collectable");

  if (!session) return null;
  const mine = food.filter((f) => f.ownerUserId === session.userId);
  const rows = mine.filter((f) => {
    // Grace policy: Stored inside its shelf life, or expired less than one
    // hour ago, is still collectable by the owner. Beyond the hour the
    // record has been handed over to the Manager.
    if (filter === "Collectable") return ownerActionOpen(f.status, f.expiresAt);
    if (filter === "Recorded") return f.status === "Collected";
    return true;
  });

  const collectedEvents = events.filter((e) =>
    mine.some((f) => f.id === e.foodId && e.type === "Collected"),
  );

  return (
    <AppShell title="Food Retrieval / Collection Status">
      <PageHead
        eyebrow="Role: User"
        title="Food Retrieval / Collection Status"
        description="Collect the food you own. Recording a collection writes one impact event for that mass — never twice."
        actions={
          <div className="segmented" role="group" aria-label="Filter">
            {(["Collectable", "Recorded", "All"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={filter === f ? "is-active" : ""}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="stack">
        <Notice title="Consumption is an assumption">
          Food taken by a User is recorded as an assumed consumption outcome —
          it is not proof that the food was actually eaten. Reports state this
          explicitly.
        </Notice>

        <TableWrap>
          <thead>
            <tr>
              <th scope="col">Food</th>
              <th scope="col">Status</th>
              <th scope="col">Expires</th>
              <QuantityHeader />
              <th scope="col" style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <TableEmpty colSpan={6} text="Nothing to show in this filter." />
            )}
            {rows.map((f) => {
              const eff = effectiveFoodStatus(f.status, f.expiresAt);
              // Flow diagram 12: only `Stored` transitions to `Collected`.
              // The one-hour grace window after expiry keeps the record
              // collectable; beyond it the Manager holds the record.
              const collectable = ownerActionOpen(f.status, f.expiresAt);
              const grace = eff === "Expired" && expiredWithinGrace(f.expiresAt);
              const ev = events.find((e) => e.foodId === f.id && e.type === "Collected");
              return (
                <tr key={f.id}>
                  <td>
                    <button
                      type="button"
                      className="cell-strong"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                      onClick={() => navigate({ name: "food-detail", id: f.id })}
                    >
                      {f.name}
                    </button>
                    <span className="cell-sub">{f.id} · {f.category}</span>
                  </td>
                  <td>
                    <StatusBadge
                      label={eff}
                      variant={foodStatusVariant(eff)}
                    />
                    {grace && (
                      <span className="cell-sub">
                        Grace window — still collectable for another{" "}
                        {Math.max(1, Math.round((new Date(f.expiresAt).getTime() + 3600000 - Date.now()) / 60000))} min
                      </span>
                    )}
                  </td>
                  <td className="num-col">{formatDateTime(f.expiresAt)}</td>
                  <td className="num-col">{formatMass(f.massG)}</td>
                  <td className="num-col">
                    {ev ? (
                      <CarbonValue
                        value={
                          ev.co2eKg != null
                            ? { kind: "value", kg: ev.co2eKg }
                            : { kind: "unable" }
                        }
                      />
                    ) : (
                      <Badge variant="neutral">No qualifying event yet</Badge>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className={`button button--sm ${collectable ? "button--primary" : "button--ghost"}`}
                        disabled={!collectable}
                        title={
                          collectable
                            ? "Record this food as collected"
                            : eff === "Expired"
                              ? "Expired beyond the one-hour grace window — handed over to the Manager"
                              : `Status ${eff} does not allow collection`
                        }
                        onClick={() => collectFood(f.id)}
                      >
                        {collectable
                          ? "Record collection"
                          : eff === "Expired"
                            ? "Handed over"
                            : "Not available"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>

        <Panel title="Recorded collections" description="Impact events created by your retrievals">
          {collectedEvents.length === 0 ? (
            <EmptyState title="No collections recorded yet" />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col">Food</th>
                  <th scope="col">Recorded at</th>
                  <QuantityHeader />
                  <th scope="col">Outcome note</th>
                </tr>
              </thead>
              <tbody>
                {collectedEvents.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <span className="cell-strong">{e.label}</span>
                      <span className="cell-sub">{e.foodId}</span>
                    </td>
                    <td className="num-col">{formatDateTime(e.occurredAt)}</td>
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
                    <td className="tiny">
                      Assumed consumption — not proof of actual consumption.
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
