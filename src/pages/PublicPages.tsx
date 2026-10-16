/** Public pages: Landing, About, Barcode lookup, Carbon Footprint. */
import { useState } from "react";
import { PublicShell } from "../components/PublicShell";
import {
  AnalyticsNote,
  Badge,
  BarChart,
  EmptyState,
  Notice,
  Panel,
  PageHead,
  PeriodFilter,
  SimulationBanner,
  SummaryList,
} from "../components/ui";
import {
  IconBarcode,
  IconChart,
  IconGift,
  IconLeaf,
  IconList,
  IconShield,
} from "../components/icons";
import { CONTRIBUTION_MESSAGE } from "../components/Barcode";
import { useStore, ROUTE_PATH, type Route } from "../lib/store";
import { bucketValue, chartBuckets, formatCo2e, inPeriod, periodLabel } from "../lib/carbon";
import { foodStatusVariant, formatDate } from "../lib/format";
import type { Period } from "../lib/types";

/* ------------------------------ Landing ------------------------------ */

export function LandingPage() {
  const { navigate } = useStore();
  const go = (r: Route) => () => navigate(r);

  const features = [
    {
      icon: <IconList />,
      title: "Register and track food",
      body: "Cascading category and subcategory selection, automatic expiry from configured shelf-life rules, and a unique barcode for every record.",
    },
    {
      icon: <IconGift />,
      title: "Donate and distribute",
      body: "Users offer surplus food, Green Community submits requests, and Managers review, allocate and record the mass actually handed over.",
    },
    {
      icon: <IconChart />,
      title: "Report estimated CO₂e",
      body: "Impact is counted only for qualified events, aggregated without double counting, and always labelled as an estimate in kg CO₂e.",
    },
  ];

  return (
    <PublicShell current="landing">
      <div className="page">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Food Waste Prevention, Donation &amp; Carbon Impact</span>
            <h1 className="h1-hero">
              Keep good food out of the waste stream.
            </h1>
            <p className="lead">
              SmartSave is a platform for recording food, managing storage and
              expiry, coordinating donation with Green Communities, and reporting
              the estimated carbon contribution of preventing food waste.
            </p>
            <div className="hero-actions">
              <button type="button" className="button button--primary" onClick={go({ name: "signup" })}>
                Sign Up
              </button>
              <button type="button" className="button button--secondary" onClick={go({ name: "signin" })}>
                Sign In
              </button>
              <button type="button" className="button button--ghost" onClick={go({ name: "public-lookup" })}>
                <IconBarcode />
                Public barcode lookup
              </button>
            </div>
            <div className="row" style={{ gap: 18 }}>
              <span className="small"><IconShield style={{ width: 14, height: 14, verticalAlign: -3, marginRight: 6, color: "var(--green)" }} />Three roles with separate access</span>
              <span className="small"><IconLeaf style={{ width: 14, height: 14, verticalAlign: -3, marginRight: 6, color: "var(--green)" }} />Estimates, clearly disclosed</span>
            </div>
          </div>

          <div className="hero-art">
            <span className="auth-kicker">Platform purpose</span>
            <div className="stack stack--sm">
              <div className="hero-stat">
                <strong>3 roles</strong>
                <span>User, Manager, Green Community</span>
              </div>
              <div className="hero-stat">
                <strong>Automatic expiry</strong>
                <span>Calculated from configured shelf-life rules — never edited by hand</span>
              </div>
              <div className="hero-stat">
                <strong>kg CO₂e</strong>
                <span>Estimated per qualified event, with factor, unit and source shown</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <span className="eyebrow">What it does</span>
            <h2 className="h1">Prevention, donation and measurement in one flow</h2>
            <p className="lead">
              Register food before it goes to waste, offer what can still be
              used, and report the impact of what was actually saved.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.title}>
                <span className="metric-icon">{f.icon}</span>
                <h3 className="card-title">{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="grid-2">
            <Panel title="Honest about what is simulated" description="Prototype scope">
              <div className="stack stack--sm">
                <SimulationBanner>
                  Photo freshness checks, barcode camera scanning and the
                  notification scheduler are simulated in this prototype. Real AI
                  freshness detection, real camera scanning, hardware sensors,
                  smart lockers and physical alarms are outside the initial
                  scope.
                </SimulationBanner>
                <Notice title="CO₂e is an estimate">
                  All carbon figures are calculated from configured emission
                  factors. They are not sensor measurements, and CO₂ ppm is not
                  displayed anywhere because no sensor is connected.
                </Notice>
              </div>
            </Panel>
            <Panel title="Public pages" description="Open without signing in">
              <div className="stack stack--sm">
                <p className="small">
                  Scanning a barcode opens a public page showing only the
                  identifier, category, status and the contribution message — no
                  personal data and no per-record calculation detail.
                </p>
                <div className="button-row">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={go({ name: "public-lookup" })}
                  >
                    <IconBarcode />
                    Public Barcode Lookup
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={go({ name: "public-carbon" })}
                  >
                    <IconChart />
                    Public Carbon Footprint
                  </button>
                </div>
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}

/* ------------------------------- About -------------------------------- */

export function AboutPage() {
  return (
    <PublicShell current="about">
      <div className="page page--narrow">
        <PageHead
          eyebrow="About SmartSave"
          title="Problem statement, workflow and scope"
          description="Why the platform exists, how food moves through it, and what is deliberately left out of the initial build."
        />

        <div className="stack">
          <Panel title="Problem statement">
            <div className="stack stack--sm">
              <p>
                Edible food is discarded because storage and expiry are tracked
                informally, surplus is not offered to anyone who could still use
                it, and the environmental effect of that waste is rarely
                quantified in a way people can act on.
              </p>
              <p className="small">
                SmartSave turns each batch of food into a record with an automatic
                expiry, a barcode, a donation workflow and — when a qualifying
                event occurs — a traceable estimate of the emissions avoided.
              </p>
            </div>
          </Panel>

          <Panel title="Prevention and donation workflow">
            <ol className="stack stack--sm" style={{ paddingLeft: 18, margin: 0 }}>
              <li>
                <strong>User registers food</strong> — category and subcategory
                selection, mass in grams, photo check, automatic expiry.
              </li>
              <li>
                <strong>Website reminder two hours before expiry</strong> —
                the User donates or collects the item.
              </li>
              <li>
                <strong>Donation is created</strong> — the food becomes
                Available for Donation.
              </li>
              <li>
                <strong>Green Community submits a request</strong> and tracks its
                status.
              </li>
              <li>
                <strong>Manager reviews</strong>, approves or rejects, allocates
                and records the mass actually distributed.
              </li>
              <li>
                <strong>Impact is recorded once</strong> per mass and outcome, and
                appears in cards, tables, charts and CSV exports alike.
              </li>
            </ol>
          </Panel>

          <Panel title="Scope and limitations">
            <div className="stack stack--sm">
              <p className="small">
                <strong>Included:</strong> responsive website, registration and
                login with three roles, food and category management, automatic
                expiry, barcode and label, donation and request workflows,
                dashboards with daily/monthly/yearly filters, configurable
                emission factors with historical snapshots, and CSV export.
              </p>
              <p className="small">
                <strong>Not included:</strong> physical smart lockers, Raspberry
                Pi, AI cameras, temperature and humidity sensors, alarms,
                sterilization, direct CO₂ ppm measurement, external messaging,
                payment gateways, and machine-learning expiry prediction from
                photos.
              </p>
              <SimulationBanner>
                Any feature still marked as simulation stays labelled until it is
                implemented and tested.
              </SimulationBanner>
            </div>
          </Panel>

          <Panel title="Terminology">
            <SummaryList
              rows={[
                { label: "Quantity / mass", value: "grams (g)" },
                { label: "Climate impact", value: "kg CO₂e (estimate)" },
                { label: "Factor invalid", value: <Badge variant="warning">Emission factor not configured</Badge> },
                { label: "Unit mismatch", value: <Badge variant="warning">Unable to calculate</Badge> },
                { label: "Role names", value: "User · Manager · Green Community" },
              ]}
            />
          </Panel>
        </div>
      </div>
    </PublicShell>
  );
}

/* --------------------------- Public lookup --------------------------- */

export function PublicLookupPage() {
  const { food, navigate } = useStore();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = () => {
    const q = query.trim().toUpperCase();
    if (!q) {
      setError("Enter a barcode or food ID to look up.");
      setResult(null);
      return;
    }
    const hit = food.find(
      (f) => f.barcode.toUpperCase() === q || f.id.toUpperCase() === q,
    );
    if (!hit) {
      setError("Not Found — no record matches this barcode.");
      setResult(null);
      return;
    }
    setError(null);
    setResult(hit.id);
  };

  const item = result ? food.find((f) => f.id === result) : undefined;

  return (
    <PublicShell current="public-lookup">
      <div className="page page--narrow">
        <PageHead
          eyebrow="Public"
          title="Public Barcode Lookup"
          description="Open a record from its barcode without signing in. Only non-personal information is shown."
        />

        <div className="stack">
          <SimulationBanner>
            Demo scan. Real camera scanning is not implemented — type or paste an
            ID instead. Try FD-1042 or barcode SS-1042.
          </SimulationBanner>

          <Panel>
            <div className="scan-controls">
              <div className="control">
                <label htmlFor="bc">Barcode / QR value</label>
                <input
                  id="bc"
                  value={query}
                  placeholder="e.g. FD-1042 or SS-1042"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookup()}
                />
              </div>
              <button type="button" className="button button--primary" onClick={lookup}>
                <IconBarcode />
                Look up
              </button>
            </div>
          </Panel>

          {error && (
            <div className="scan-error" role="alert">
              <span className="notice-icon">
                <IconBarcode />
              </span>
              <span>{error}</span>
            </div>
          )}

          {item && (
            <Panel title="Public record" description="Non-personal information only">
              <div className="stack stack--sm">
                <SummaryList
                  rows={[
                    { label: "Identifier", value: item.id },
                    { label: "Category", value: `${item.category} · ${item.subcategory}` },
                    { label: "Status", value: <Badge variant={foodStatusVariant(item.status)}>{item.status}</Badge> },
                    { label: "Stored on", value: formatDate(item.storedAt) },
                  ]}
                />
                <div className="notice">
                  <span className="notice-icon"><IconLeaf /></span>
                  <span>{CONTRIBUTION_MESSAGE}</span>
                </div>
                <Notice title="What is hidden here">
                  Mass, emission factor, formula and the per-record CO₂e estimate
                  are available only on the Food Detail page for a signed-in user
                  who owns or is authorized for this record. No owner or recipient
                  name is shown on public pages.
                </Notice>
                <div className="button-row">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => navigate({ name: "public-carbon", barcode: item.barcode })}
                  >
                    <IconChart />
                    View Public Carbon Footprint
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {!item && !error && (
            <EmptyState
              title="No record opened yet"
              hint="Enter a barcode above to see the public, non-personal view."
            />
          )}
        </div>
      </div>
    </PublicShell>
  );
}

/* ------------------------ Public carbon page ------------------------- */

export function PublicCarbonPage() {
  const { food, events, navigate } = useStore();
  const [period, setPeriod] = useState<Period>("Monthly");

  const buckets = chartBuckets(period);
  const massData = buckets.map((b) => ({
    label: b.label,
    value: events
      .filter((e) => bucketValue(e.occurredAt, b) && e.co2eKg !== null)
      .reduce((s, e) => s + (e.co2eKg ?? 0), 0),
  }));

  const total = events.reduce((s, e) => s + (e.co2eKg ?? 0), 0);
  const counted = events.filter((e) => e.co2eKg !== null).length;
  const unresolved = events.length - counted;

  return (
    <PublicShell current="public-carbon">
      <div className="page">
        <PageHead
          eyebrow="Public"
          title="Public Carbon Footprint"
          description="Aggregate, non-personal contribution charts. Open from a barcode without signing in."
          actions={<PeriodFilter value={period} onChange={setPeriod} />}
        />

        <div className="stack">
          <SimulationBanner>
            Aggregate demo data. This page never shows personal data, per-record
            calculations, mass, factors or the identity of any user or recipient.
          </SimulationBanner>

          <div className="metrics-grid metrics-grid--3">
            <div className="metric-card">
              <div className="metric-icon"><IconChart /></div>
              <div>
                <div className="metric-label">Estimated CO₂e avoided (aggregate)</div>
                <div className="metric-value">{formatCo2e(Math.round(total * 100) / 100)}</div>
              </div>
              <div className="metric-foot">Sum of qualified events only · {periodLabel(period)}</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon metric-icon--blue"><IconList /></div>
              <div>
                <div className="metric-label">Qualified events counted</div>
                <div className="metric-value">{counted}</div>
              </div>
              <div className="metric-foot">Collection and completed distribution outcomes</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon metric-icon--amber"><IconLeaf /></div>
              <div>
                <div className="metric-label">Events without a usable factor</div>
                <div className="metric-value">{unresolved}</div>
              </div>
              <div className="metric-foot">Reported as a status, never as zero</div>
            </div>
          </div>

          <div className="report-grid">
            <Panel title="Estimated CO₂e by period" description={`${periodLabel(period)} · aggregated, non-personal`}>
              <BarChart data={massData} unit="kg CO₂e" />
            </Panel>
            <Panel title="How to read this chart">
              <div className="stack stack--sm">
                <AnalyticsNote />
                <p className="small">
                  Values are estimates derived from configured emission factors.
                  They are not measurements taken by any sensor, and they are not
                  interchangeable with a CO₂ concentration reading.
                </p>
                <SummaryList
                  rows={[
                    { label: "Counted outcomes", value: "Food collected by a User · donation completed · mass distributed to a requester" },
                    { label: "Not counted", value: "Registration alone — a stored item is not an avoided emission" },
                    { label: "Double counting", value: "Each mass/lot is claimed once per outcome" },
                  ]}
                />
                <div className="button-row">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => navigate({ name: "public-lookup" })}
                  >
                    <IconBarcode />
                    Back to barcode lookup
                  </button>
                </div>
                <p className="tiny">
                  {food.length} records exist in this prototype dataset.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
