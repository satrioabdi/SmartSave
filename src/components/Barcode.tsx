/**
 * Barcode / QR label (requirement §5).
 * The code encodes only a unique ID — never personal or sensitive data.
 */
import type { FoodItem } from "../lib/types";
import { formatDate } from "../lib/format";
import { CarbonValue, AnalyticsNote } from "./ui";
import { computeCarbon, resolveForItem, CONSUMPTION_NOTE } from "../lib/carbon";

export const CONTRIBUTION_MESSAGE =
  "Thank you for contributing to carbon emission reduction through food waste prevention.";

/** Deterministic bar widths derived from the ID so the code looks stable. */
function barsFor(id: string) {
  const bars: number[] = [];
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed += id.charCodeAt(i) * (i + 3);
  for (let i = 0; i < 58; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    bars.push((seed % 3) + 1);
  }
  return bars;
}

export function Barcode({ code }: { code: string }) {
  const bars = barsFor(code);
  return (
    <div className="barcode">
      <div className="barcode-bars" aria-hidden>
        {bars.map((w, i) => (
          <i key={i} style={{ width: `${w}px`, opacity: i % 7 === 0 ? 0.75 : 1 }} />
        ))}
      </div>
      <div className="barcode-id">{code}</div>
      <span className="tiny" style={{ display: "block", textAlign: "center", marginTop: 4 }}>
        Encodes a unique record ID only — no personal data.
      </span>
    </div>
  );
}

/** Public-facing label: identifier, category, status, contribution message. */
export function LabelCard({ item }: { item: FoodItem }) {
  return (
    <div className="label-card">
      <div className="stack stack--sm">
        <span className="brand" style={{ fontSize: 18 }}>
          <span className="brand-mark" style={{ width: 22, height: 22, fontSize: 11 }}>
            S
          </span>
          SmartSave
        </span>
        <div>
          <div className="label-name">{item.name}</div>
          <div className="label-meta" style={{ marginTop: 8 }}>
            <span>Food ID: {item.id}</span>
            <span>Category: {item.category}</span>
            <span>Subcategory: {item.subcategory}</span>
            {item.compartmentLabel && (
              <span>Compartment: {item.compartmentLabel}</span>
            )}
            <span>Stored: {formatDate(item.storedAt)}</span>
          </div>
        </div>
        <Barcode code={item.barcode} />
        <p className="contribution-message">{CONTRIBUTION_MESSAGE}</p>
      </div>
    </div>
  );
}

/**
 * Authenticated detail: adds the computed contribution under the message
 * (requirement §5), with factor, unit, source, formula and disclosure (§6.2).
 */
export function DetailLabelCard({ item }: { item: FoodItem }) {
  const resolution = resolveForItem(item.category, item.subcategory, item.subtype);
  const value = computeCarbon(item.massG, resolution);

  return (
    <div className="stack">
      <LabelCard item={item} />
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="h2">Estimated carbon contribution</h2>
            <p>Calculated from this record's mass and its configured factor.</p>
          </div>
        </div>
        <div className="stack stack--sm">
          <div className="estimate-value">
            <CarbonValue value={value} />
          </div>
          <AnalyticsNote extra={CONSUMPTION_NOTE} />
        </div>
      </div>
    </div>
  );
}
