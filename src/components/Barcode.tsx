/**
 * Barcode / QR label (requirement §5).
 * The code encodes only a unique ID — never personal or sensitive data.
 *
 * The bars are a real Code 128 encoding (JsBarcode), so a phone camera using
 * the browser Shape Detection API can actually decode them — a previous
 * version drew decorative CSS bars that no scanner could read.
 */
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import type { FoodItem } from "../lib/types";
import { formatDate } from "../lib/format";
import { CarbonValue, AnalyticsNote } from "./ui";
import { computeCarbon, resolveForItem, CONSUMPTION_NOTE } from "../lib/carbon";

export const CONTRIBUTION_MESSAGE =
  "Thank you for contributing to carbon emission reduction through food waste prevention.";

export function Barcode({ code }: { code: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      JsBarcode(svg, code, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        height: 72,
        width: 2,
        lineColor: "#142d3e",
        background: "#ffffff",
      });
    } catch {
      // CODE128 accepts printable ASCII; if a value still fails, leave the
      // SVG empty — the human-readable ID below remains visible.
      svg.replaceChildren();
    }
  }, [code]);

  return (
    <div className="barcode">
      <svg ref={svgRef} className="barcode-svg" role="img" aria-label={`Barcode ${code}`} />
      <div className="barcode-id">{code}</div>
      <span className="tiny" style={{ display: "block", textAlign: "center", marginTop: 4 }}>
        Encodes a unique record ID only — no personal data.
      </span>
    </div>
  );
}

/** Public-facing label: identifier, category, status, contribution message. */
export function LabelCard({ item, zone }: { item: FoodItem; zone?: string }) {
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
            <span>Stored: {formatDate(item.storedAt, zone)}</span>
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
export function DetailLabelCard({ item, zone }: { item: FoodItem; zone?: string }) {
  const resolution = resolveForItem(item.category, item.subcategory, item.subtype);
  const value = computeCarbon(item.massG, resolution);

  return (
    <div className="stack">
      <LabelCard item={item} zone={zone} />
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
