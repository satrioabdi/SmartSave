/** Register Food wizard (§3, §4, §9) and expiry notifications (§10, §11). */
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  Badge,
  Countdown,
  EmptyState,
  PageHead,
  Panel,
  PeriodFilter,
  PolicyBox,
  SimulationBanner,
  StatusBadge,
  SummaryList,
  TableEmpty,
  TableWrap,
} from "../components/ui";
import { IconGift } from "../components/icons";
import { useStore } from "../lib/store";
import { formatMass } from "../lib/carbon";
import {
  formatDateTime,
  isExpiringSoon,
  isExpired,
  relativeTime,
} from "../lib/format";
import type { Period } from "../lib/types";

/**
 * Register Food is a 5-step deposit wizard (Choose compartment → Register food
 * → Review estimate → Print label → Deposit complete). The implementation
 * lives in RegisterWizard so this file stays scoped to notifications.
 */
export { RegisterFoodPage } from "./RegisterWizard";

/* ----------------------- Expiry Notifications ------------------------- */

export function ExpiryNotificationsPage() {
  const { session, food, notifications, navigate, collectFood, markNotificationsRead } =
    useStore();
  const [period, setPeriod] = useState<Period>("Daily");
  const [now] = useState(() => new Date());

  if (!session) return null;
  const mine = food.filter((f) => f.ownerUserId === session.userId);
  const reminders = mine.filter(
    (f) => f.status === "Stored" && (isExpiringSoon(f.expiresAt) || isExpired(f.expiresAt)),
  );

  return (
    <AppShell title="Expiry Notifications">
      <PageHead
        eyebrow="Role: User"
        title="Expiry Notifications"
        description="In-website reminders two hours before expiry, plus the notification history and delivery status."
        actions={
          <>
            <PeriodFilter value={period} onChange={setPeriod} />
            <button type="button" className="button button--secondary" onClick={markNotificationsRead}>
              Mark all as read
            </button>
          </>
        }
      />

      <div className="stack">
        <SimulationBanner>
          Website notifications only — no email or push channel is configured.
          The two-hour reminder and one-hour follow-up are simulated here; a real
          deployment runs them on a backend scheduler.
        </SimulationBanner>

        <Panel
          title="How the expiry rule works (§10 / §11)"
          description="Example timeline for an item that is about to expire"
        >
          <PolicyBox>
            <strong>No automatic donation.</strong> The requirement never donates
            food on its own — the User always responds manually.
          </PolicyBox>
          <ol className="timeline">
            <li>
              <strong>T-2 hours (reminder):</strong> if the scheduler and a
              notification channel are configured, the system sends a reminder
              two hours before expiry. Example:{" "}
              <strong>Banana batch A (FD-1042)</strong> expires in about 90
              minutes and appears below as <em>Expiring Soon</em>.
            </li>
            <li>
              <strong>Before expiry (manual response):</strong> the User decides
              — <em>Donate</em> or <em>Collect now</em>. Nothing happens without
              that action.
            </li>
            <li>
              <strong>Expiry passes, no response:</strong> nothing is
              donated automatically.
            </li>
            <li>
              <strong>T+1 hour after expiry:</strong> the Manager records a
              follow-up per the agreed policy. Example:{" "}
              <strong>Cooked rice trays (FD-1044)</strong> expired 30 minutes
              ago — its one-hour Manager follow-up starts once the hour is up.
            </li>
          </ol>
        </Panel>

        <div className="alert-grid">
          {reminders.length === 0 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <EmptyState
                title="No items expiring soon"
                hint="Reminders appear here two hours before a record expires."
              />
            </div>
          )}
          {reminders.map((f) => {
            const expired = isExpired(f.expiresAt);
            return (
              <div
                key={f.id}
                className={`expiration-card${expired ? " expiration-card--expired" : ""}`}
              >
                <div className="row row--between">
                  <h3 className="card-title">{f.name}</h3>
                  <StatusBadge
                    label={expired ? "Expired" : "Expiring Soon"}
                    variant={expired ? "danger" : "warning"}
                  />
                </div>

                {!expired ? (
                  <Countdown ms={new Date(f.expiresAt).getTime() - now.getTime()} />
                ) : (
                  <div className="policy-box">
                    Expired {relativeTime(f.expiresAt)}. Manager follow-up is
                    required after one hour without a response.
                  </div>
                )}

                <SummaryList
                  rows={[
                    { label: "Food ID", value: f.id },
                    { label: "Quantity", value: formatMass(f.massG) },
                    { label: "Expires", value: formatDateTime(f.expiresAt) },
                  ]}
                />

                <div className="button-row">
                  <button
                    type="button"
                    className="button button--primary button--sm"
                    onClick={() => collectFood(f.id)}
                  >
                    Collect now
                  </button>
                  <button
                    type="button"
                    className="button button--secondary button--sm"
                    onClick={() => navigate({ name: "food-donation" })}
                  >
                    <IconGift />
                    Donate
                  </button>
                  <button
                    type="button"
                    className="button button--ghost button--sm"
                    onClick={() => navigate({ name: "food-detail", id: f.id })}
                  >
                    Open detail
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <Panel title="Notification history" description="Delivery status for every website notification">
          <TableWrap>
            <thead>
              <tr>
                <th scope="col">Notification</th>
                <th scope="col">Kind</th>
                <th scope="col">Created</th>
                <th scope="col">Delivery status</th>
                <th scope="col">Read</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 && (
                <TableEmpty colSpan={5} text="No notifications recorded." />
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
                        n.kind === "expired-followup"
                          ? "danger"
                          : n.kind === "reminder-2h"
                            ? "warning"
                            : "info"
                      }
                    >
                      {n.kind === "reminder-2h"
                        ? "Reminder 2h"
                        : n.kind === "expired-followup"
                          ? "Expired follow-up"
                          : "System"}
                    </Badge>
                  </td>
                  <td className="num-col">{formatDateTime(n.createdAt)}</td>
                  <td>
                    <Badge variant={n.delivery === "Failed" ? "danger" : "success"}>
                      {n.delivery}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={n.read ? "neutral" : "info"}>
                      {n.read ? "Read" : "Unread"}
                    </Badge>
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
