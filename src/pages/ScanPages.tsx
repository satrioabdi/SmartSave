/**
 * Scan Barcode (camera) — User and Manager (§5 barcode, §17 sitemap).
 *
 * Access rule enforced here: a scanned record's full information is shown only
 * to its owner or to a Manager. Any other signed-in user gets a warning that
 * the barcode is not theirs and sees the same non-personal fields as the
 * public lookup — never mass, owner, factor or CO₂e details. Green Community
 * cannot open this route at all (canAccess).
 */
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { CameraScanner } from "../components/Camera";
import {
  Badge,
  EmptyState,
  PageHead,
  Panel,
  SimulationBanner,
  SummaryList,
} from "../components/ui";
import { IconAlert, IconBarcode, IconPrint } from "../components/icons";
import { useStore } from "../lib/store";
import { foodStatusVariant, formatDate, formatDateTime } from "../lib/format";
import { formatMass } from "../lib/carbon";
import type { FoodItem } from "../lib/types";

/**
 * Build marker shown on the page so a screenshot tells us which bundle is
 * live (phones love to keep an old tab / cached JS around).
 */
export const APP_BUILD = "scan-fix-3";

export function ScanBarcodePage() {
  const { session, food, navigate } = useStore();
  const [query, setQuery] = useState("");
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  const resolve = (raw: string) => {
    const q = raw.trim().toUpperCase();
    if (!q) {
      setError("Enter or scan a barcode value first.");
      setResultId(null);
      return;
    }
    // A deactivated original barcode is rejected with the replacement code,
    // so the holder is pointed at the active pickup barcode.
    const deactivated = food.find((f) => f.barcodeActive === false && f.barcode.toUpperCase() === q);
    if (deactivated) {
      setError(
        `Barcode ${deactivated.barcode} was deactivated. Use the replacement pickup barcode ${deactivated.replacementBarcode ?? "issued at Manager approval"}.`,
      );
      setResultId(null);
      return;
    }
    // A Green Community pickup barcode resolves to the same record.
    const hit = food.find(
      (f) =>
        f.barcode.toUpperCase() === q ||
        f.id.toUpperCase() === q ||
        f.replacementBarcode?.toUpperCase() === q,
    );
    if (!hit) {
      setError("Not Found — no record matches this barcode.");
      setResultId(null);
      return;
    }
    setError(null);
    setQuery(hit.replacementBarcode ?? hit.barcode);
    setResultId(hit.id);
  };

  const item: FoodItem | undefined = resultId
    ? food.find((f) => f.id === resultId)
    : undefined;
  const isOwner = item ? item.ownerUserId === session.userId : false;
  const isManager = session.role === "Manager";
  const authorized = Boolean(item) && (isOwner || isManager);

  const reset = () => {
    setResultId(null);
    setError(null);
    setQuery("");
  };

  return (
    <AppShell title="Scan Barcode">
      <PageHead
        eyebrow={`Role: ${session.role}`}
        title="Scan Barcode"
        description="Scan a label with the camera. Record details open only for the owner and for a Manager."
        actions={
          item && (
            <button type="button" className="button button--secondary" onClick={reset}>
              Scan another
            </button>
          )
        }
      />


      <div className="stack">
        <SimulationBanner>
          The camera preview and decoding run in your browser (native Shape
          Detection API, with a JavaScript fallback decoder). Nothing is
          uploaded — this is a UI prototype with demo records, not a backend
          scanner.
        </SimulationBanner>

        <div className="tiny" role="status">
          Build: {APP_BUILD} — if this value is old, refresh the page (or open
          it in a new tab) to load the latest deployment.
        </div>

        <div className="scan-layout">
          <Panel
            title="Camera scanner"
            description="Start the camera and hold it steady over the barcode"
          >
            <CameraScanner onDetect={(value) => resolve(value)} />
          </Panel>

          <Panel
            title="Enter the code manually"
            description="Works when the camera is unavailable or the browser cannot decode"
          >
            <div className="scan-controls">
              <div className="control">
                <label htmlFor="scan-input">Barcode / QR value</label>
                <input
                  id="scan-input"
                  value={query}
                  placeholder="e.g. FD-1042 or SS-1042"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && resolve(query)}
                />
              </div>
              <button
                type="button"
                className="button button--primary"
                onClick={() => resolve(query)}
              >
                <IconBarcode />
                Look up
              </button>
            </div>
            <p className="tiny" style={{ marginTop: 10 }}>
              Only the record owner and a Manager see record details from a
              scan. Everyone else gets a warning.
            </p>
          </Panel>
        </div>

        {error && (
          <div className="scan-error" role="alert">
            <span className="notice-icon">
              <IconAlert />
            </span>
            <span>{error}</span>
          </div>
        )}

        {item && authorized && (
          <Panel
            title="Barcode verified"
            description={
              isManager
                ? "Manager access — full record details are shown"
                : "This record belongs to your account — full details are shown"
            }
          >
            <div className="stack stack--sm">
              <div className="row">
                <Badge variant="success">
                  {isManager ? "Manager access" : "Owner access"}
                </Badge>
                {item.barcodeActive === false ? (
                  <Badge variant="warning">Original barcode {item.barcode} deactivated</Badge>
                ) : (
                  <Badge variant="info">{item.barcode}</Badge>
                )}
                {item.replacementBarcode && (
                  <Badge variant="info">Pickup {item.replacementBarcode}</Badge>
                )}
              </div>
              <SummaryList
                rows={[
                  { label: "Food ID", value: item.id },
                  { label: "Name", value: item.name },
                  {
                    label: "Category",
                    value: `${item.category} · ${item.subcategory}${item.subtype ? ` · ${item.subtype}` : ""}`,
                  },
                  {
                    label: "Status",
                    value: (
                      <Badge variant={foodStatusVariant(item.status)}>
                        {item.status}
                      </Badge>
                    ),
                  },
                  { label: "Quantity", value: formatMass(item.massG) },
                  { label: "Stored on", value: formatDateTime(item.storedAt) },
                  { label: "Expires", value: formatDateTime(item.expiresAt) },
                  {
                    label: "Locker",
                    value: item.compartmentLabel ?? "—",
                  },
                  { label: "Owner", value: item.ownerLabel },
                ]}
              />
              <div className="button-row">
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => navigate({ name: "food-detail", id: item.id })}
                >
                  Open Food Detail
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => navigate({ name: "print-label", id: item.id })}
                >
                  <IconPrint />
                  Barcode / Print Label
                </button>
              </div>
            </div>
          </Panel>
        )}

        {item && !authorized && (
          <>
            <div className="scan-error" role="alert">
              <span className="notice-icon">
                <IconAlert />
              </span>
              <span>
                <strong>This barcode is not yours.</strong> {item.id} belongs to
                another user, so you are not authorized to see its details —
                quantity, owner, locker, expiry and carbon information stay
                hidden. Only the record owner and a Manager may access them.
              </span>
            </div>

            <Panel
              title="Public information only"
              description="The same non-personal fields as the public barcode lookup"
            >
              <div className="stack stack--sm">
                <SummaryList
                  rows={[
                    { label: "Identifier", value: item.id },
                    {
                      label: "Category",
                      value: `${item.category} · ${item.subcategory}`,
                    },
                    {
                      label: "Status",
                      value: (
                        <Badge variant={foodStatusVariant(item.status)}>
                          {item.status}
                        </Badge>
                      ),
                    },
                    { label: "Stored on", value: formatDate(item.storedAt) },
                  ]}
                />
                <div className="button-row">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => navigate({ name: "public-lookup" })}
                  >
                    Open public barcode view
                  </button>
                </div>
              </div>
            </Panel>
          </>
        )}

        {!item && !error && (
          <EmptyState
            title="No barcode scanned yet"
            hint="Start the camera above or type a code (try FD-1042 or SS-1042)."
          />
        )}
      </div>
    </AppShell>
  );
}
