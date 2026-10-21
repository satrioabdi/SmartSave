/** Profile / Account Settings plus system states (Access Denied, Not Found). */
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  Badge,
  EmptyState,
  Field,
  Notice,
  PageHead,
  Panel,
  SimulationBanner,
  StatusBadge,
  SummaryList,
} from "../components/ui";
import { IconShield, IconUser } from "../components/icons";
import { useStore, homeFor } from "../lib/store";
import { avatarClass, formatDate, initials, roleVariant } from "../lib/format";

/* ---------------------------- Profile -------------------------------- */

export function ProfilePage() {
  const { session, accounts, food, donations, requests, events, signOut, setToast } =
    useStore();
  const [name, setName] = useState(session?.name ?? "");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [saved, setSaved] = useState(false);

  if (!session) return null;
  const account = accounts.find((a) => a.id === session.userId);

  const myFood = food.filter((f) => f.ownerUserId === session.userId);
  const myDons = donations.filter((d) => d.createdBy === session.name);
  const myReqs = requests.filter((r) => r.submittedBy === session.name);
  const myEvents = events.filter((e) =>
    myFood.some((f) => f.id === e.foodId) || myDons.some((d) => d.foodIds.includes(e.foodId)),
  );

  const save = () => {
    setSaved(true);
    setToast("Profile changes are session-only in this prototype.");
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell title="Profile / Account Settings">
      <PageHead
        eyebrow={`Role: ${session.role}`}
        title="Profile / Account Settings"
        description="Your account details and the data associated with your role. Changes are not persisted beyond this prototype session."
      />

      <div className="stack">
        <SimulationBanner>
          No real authentication, password storage or email verification is
          configured. Sign out returns you to the Sign In page and clears the
          in-memory session.
        </SimulationBanner>

        <div className="form-layout">
          <Panel title="Account">
            <div className="stack stack--sm">
              <div className="row" style={{ gap: 14, alignItems: "center" }}>
                <span className={`avatar ${avatarClass(session.role)}`}>
                  {initials(session.name)}
                </span>
                <div>
                  <strong style={{ display: "block", color: "var(--navy)" }}>{session.name}</strong>
                  <StatusBadge label={session.role} variant={roleVariant(session.role)} />
                </div>
              </div>

              <SummaryList
                rows={[
                  { label: "User ID", value: session.userId },
                  { label: "Email", value: account?.email ?? "—" },
                  { label: "Organization", value: account?.organization ?? "—" },
                  { label: "Address", value: account?.address ?? "—" },
                  { label: "Joined", value: account ? formatDate(account.createdAt) : "—" },
                ]}
              />

              <div className="form-grid">
                <Field label="Display name">
                  <input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Email address" hint="Not verified in this prototype">
                  <input
                    value={email}
                    placeholder={account?.email ?? ""}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                  />
                </Field>
                <Field label="Organization" wide hint="Shown in reports for this role">
                  <input
                    value={org}
                    placeholder={account?.organization ?? "—"}
                    onChange={(e) => setOrg(e.target.value)}
                  />
                </Field>
              </div>

              {saved && (
                <Notice title="Saved (session only)">
                  The prototype keeps this change in memory until you sign out.
                </Notice>
              )}

              <div className="button-row">
                <button type="button" className="button button--primary" onClick={save}>
                  Save changes
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={signOut}
                >
                  Sign out
                </button>
              </div>
            </div>
          </Panel>

          <div className="stack">
            <Panel title="Your data in this prototype">
              <SummaryList
                rows={[
                  { label: "Food records", value: session.role === "User" ? String(myFood.length) : "—" },
                  { label: "Donations created", value: session.role === "User" ? String(myDons.length) : "—" },
                  { label: "Requests submitted", value: session.role === "Green Community" ? String(myReqs.length) : "—" },
                  { label: "Impact events", value: String(myEvents.length) },
                  { label: "Role home", value: homeFor(session.role).name },
                ]}
              />
            </Panel>

            <Panel title="Role permissions">
              <div className="stack stack--sm">
                <p className="small">
                  <IconShield style={{ width: 14, height: 14, verticalAlign: -3, marginRight: 6, color: "var(--green)" }} />
                  Opening a page outside your role shows Access Denied. Expiry is
                  never editable by any role.
                </p>
                <SummaryList
                  rows={
                    session.role === "Manager"
                      ? [
                          { label: "Configure", value: "Categories, shelf-life rules, emission factors" },
                          { label: "Review", value: "Donations and Green Community requests" },
                          { label: "Record", value: "Handover mass — the single counting point" },
                          { label: "Report", value: "Activity logs and environmental reports" },
                          { label: "Cannot", value: <Badge variant="danger">Edit a record's expiration</Badge> },
                        ]
                      : session.role === "Green Community"
                        ? [
                            { label: "Browse", value: "Available food waste" },
                            { label: "Submit", value: "Requests and track their status" },
                            { label: "View", value: "Received food history" },
                            { label: "Cannot", value: <Badge variant="danger">Approve requests or edit rules</Badge> },
                          ]
                        : [
                            { label: "Register", value: "Food with automatic expiry and a barcode" },
                            { label: "Donate", value: "Offer stored food to Green Community" },
                            { label: "Collect", value: "Record retrieval — assumed consumption" },
                            { label: "Cannot", value: <Badge variant="danger">Edit expiry or configure factors</Badge> },
                          ]
                  }
                />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* --------------------------- Access Denied --------------------------- */

export function UnauthorizedPage() {
  const { session, navigate } = useStore();
  return (
    <AppShell title="Access Denied">
      <div className="page page--narrow">
        <PageHead
          eyebrow="System"
          title="Access Denied"
          description="This page is not available for your role."
        />
        <div className="stack">
          <EmptyState
            title="You do not have permission to open this page"
            hint={
              session
                ? `You are signed in as ${session.name} with the role ${session.role}.`
                : "You are not signed in."
            }
          />
          <Notice title="Role boundaries">
            Each role sees only its own pages. Managers configure rules and review
            requests; Users register, donate and collect; Green Communities request
            and receive food.
          </Notice>
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              onClick={() => navigate(session ? homeFor(session.role) : { name: "signin" })}
            >
              <IconUser />
              Go to my dashboard
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => navigate({ name: "landing" })}
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Not Found ----------------------------- */

export function NotFoundPage() {
  const { session, navigate } = useStore();
  return (
    <AppShell title="Page Not Found">
      <div className="page page--narrow">
        <PageHead
          eyebrow="System"
          title="Page Not Found"
          description="The page you tried to open does not exist in this prototype."
        />
        <div className="stack">
          <EmptyState
            title="404 — nothing is routed here"
            hint="Check the address, or return to a known page."
          />
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              onClick={() => navigate(session ? homeFor(session.role) : { name: "landing" })}
            >
              Go to dashboard
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => navigate({ name: "public-lookup" })}
            >
              Public barcode lookup
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
